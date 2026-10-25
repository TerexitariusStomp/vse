import { Hono } from 'hono'
import type { Env, PipelineJob } from './env.ts'
import { intake } from './intake.ts'
import { check } from './check.ts'
import { structure } from './structure.ts'
import { runExtraction } from './extract.ts'
import { runConsolidation } from './consolidate.ts'
import { publish } from './publish.ts'

const app = new Hono<{ Bindings: Env }>()

app.get('/health', (c) => c.json({ ok: true, engine: 'vse' }))

// --- public intake (LISTEN) -------------------------------------------------
app.route('/api', intake)
app.route('/api', check)

// --- published artifacts (public — must register before the analyst
//     middleware mount so the bearer gate does not intercept this path) ------
app.get('/api/published/:placeId', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM publications WHERE place_id = ? ORDER BY published_at DESC LIMIT 1',
  ).bind(c.req.param('placeId')).first()
  if (!row) return c.json({ error: 'nothing published' }, 404)
  const obj = await c.env.ARTIFACTS.get((row as any).r2_key)
  if (!obj) return c.json({ error: 'artifact missing' }, 404)
  return c.json({ publication: row, results: await obj.json() })
})

// --- analyst console (bearer-gated) -----------------------------------------
const analyst = new Hono<{ Bindings: Env }>()
analyst.use('*', async (c, next) => {
  const key = c.env.ANALYST_KEY
  if (!key || c.req.header('authorization') !== `Bearer ${key}`)
    return c.json({ error: 'analyst key required' }, 401)
  await next()
})
analyst.route('/', structure)
analyst.post('/places/:placeId', async (c) => {
  const { name, kind, summary, scale_note } = await c.req.json()
  const id = c.req.param('placeId') || crypto.randomUUID()
  await c.env.DB.prepare(
    'INSERT INTO places (id, name, kind, summary, scale_note) VALUES (?, ?, ?, ?, ?)',
  ).bind(id, name ?? 'unnamed', kind ?? 'place', summary ?? '', scale_note ?? null).run()
  return c.json({ id }, 201)
})
analyst.post('/publish/:placeId', async (c) => {
  try {
    return c.json(await publish(c.env, c.req.param('placeId')), 201)
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 422)
  }
})
/** Re-run extraction for one story (analyst console re-drive). */
analyst.post('/extract/:storyId', async (c) => {
  await runExtraction(c.env, c.req.param('storyId'))
  return c.json({ ok: true })
})

analyst.get('/claims/:placeId', async (c) => {
  const status = c.req.query('status') ?? 'proposed'
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM claims WHERE place_id = ? AND status = ? ORDER BY created_at',
  ).bind(c.req.param('placeId'), status).all()
  return c.json(results ?? [])
})
app.route('/api', analyst)

// --- queue consumer: the pipeline between stages -----------------------------
export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<PipelineJob>, env: Env): Promise<void> {
    for (const msg of batch.messages) {
      const job = msg.body
      try {
        if (job.kind === 'transcribe') {
          const audio = await env.ARTIFACTS.get(job.r2Key)
          if (!audio) throw new Error(`missing audio ${job.r2Key}`)
          const bytes = new Uint8Array(await audio.arrayBuffer())
          const res = (await env.AI.run('@cf/openai/whisper', {
            audio: [...bytes],
          })) as { text?: string }
          const text = res.text?.trim()
          if (text) {
            const id = crypto.randomUUID()
            await env.DB.prepare(
              'INSERT INTO stories (id, place_id, teller_role, channel, text, r2_key) VALUES (?, ?, ?, ?, ?, ?)',
            ).bind(id, job.placeId, job.tellerRole, job.channel, text, job.r2Key).run()
            await env.PIPELINE.send({ kind: 'extract', placeId: job.placeId, storyId: id })
          }
        } else if (job.kind === 'extract') {
          await runExtraction(env, job.storyId)
        } else if (job.kind === 'consolidate') {
          await runConsolidation(env, job.placeId) // results surface via /api/consolidate
        }
        msg.ack()
      } catch (e) {
        console.error('pipeline job failed', job.kind, e)
        msg.retry()
      }
    }
  },
}
