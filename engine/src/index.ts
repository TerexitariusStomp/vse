import { Hono } from 'hono'
import type { Env, PipelineJob } from './env.ts'
import { intake, timingSafeEq } from './intake.ts'
import { check } from './check.ts'
import { structure } from './structure.ts'
import { runExtraction, findSpans } from './extract.ts'
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
  const got = c.req.header('authorization') ?? ''
  if (!key || !timingSafeEq(got, `Bearer ${key}`))
    return c.json({ error: 'analyst key required' }, 401)
  await next()
})
analyst.route('/', structure)
analyst.post('/places/:placeId', async (c) => {
  const { name, kind, summary, scale_note, geo, readings } = await c.req.json()
  const id = c.req.param('placeId') || crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO places (id, name, kind, summary, scale_note, geo, readings) VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, kind=excluded.kind,
       summary=excluded.summary, scale_note=excluded.scale_note,
       geo=excluded.geo, readings=excluded.readings`,
  )
    .bind(
      id,
      name ?? 'unnamed',
      kind ?? 'place',
      summary ?? '',
      scale_note ?? null,
      geo ? JSON.stringify(geo) : null,
      readings ? JSON.stringify(readings) : null,
    )
    .run()
  return c.json({ id }, 201)
})
// DRAFT: the ?springforth=1 seam emits draft-possibility artifacts for the
// sibling Springforth project — experimental, not a committed interface.
analyst.post('/publish/:placeId', async (c) => {
  try {
    return c.json(
      await publish(c.env, c.req.param('placeId'), {
        springforth: c.req.query('springforth') === '1',
      }),
      201,
    )
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : String(e) }, 422)
  }
})
/** Re-run extraction for one story (analyst console re-drive). */
analyst.post('/extract/:storyId', async (c) => {
  await runExtraction(c.env, c.req.param('storyId'))
  return c.json({ ok: true })
})

/** Re-run extraction for many stories in parallel (one HTTP call).
 *  Capped — each entry is a model call, so an unbounded batch is a
 *  spend/quota footgun. */
analyst.post('/extract-batch', async (c) => {
  const { storyIds } = await c.req.json()
  if (!Array.isArray(storyIds) || !storyIds.length)
    return c.json({ error: 'storyIds array required' }, 400)
  if (storyIds.length > 100)
    return c.json({ error: 'storyIds capped at 100 per call' }, 400)
  const results = await Promise.allSettled(
    storyIds.map((id: string) => runExtraction(c.env, id)),
  )
  const failed = results.filter((r) => r.status === 'rejected').length
  return c.json({ extracted: storyIds.length - failed, failed })
})

/**
 * Analyst-specified verbatim span → verified claim. The model is one
 * proposer; the analyst is another — the slice-equality gate applies
 * identically to both, so this never bypasses the verbatim contract.
 */
analyst.post('/claims/span', async (c) => {
  const { story_id, text } = await c.req.json()
  if (!story_id || typeof text !== 'string' || !text.length)
    return c.json({ error: 'story_id and non-empty text required' }, 400)
  const story = await c.env.DB.prepare(
    'SELECT id, place_id, text FROM stories WHERE id = ? AND withdrawn = 0',
  )
    .bind(story_id)
    .first<{ id: string; place_id: string; text: string }>()
  if (!story) return c.json({ error: 'story not found' }, 404)
  const spans = findSpans(story.text, text)
  if (!spans.length) return c.json({ error: 'text not verbatim in story' }, 422)
  const existing = await c.env.DB.prepare(
    "SELECT id FROM claims WHERE story_id = ? AND text = ? AND status = 'verified'",
  )
    .bind(story.id, text)
    .first<{ id: string }>()
  if (existing) return c.json({ id: existing.id, dedup: true })
  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO claims (id, place_id, story_id, text, span_start, span_end, status, proposer)
     VALUES (?, ?, ?, ?, ?, ?, 'verified', 'analyst')`,
  )
    .bind(id, story.place_id, story.id, text, spans[0][0], spans[0][1])
    .run()
  return c.json({ id }, 201)
})

analyst.get('/stories/:placeId', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT id, teller_role, channel, text, withdrawn FROM stories WHERE place_id = ? ORDER BY created_at',
  ).bind(c.req.param('placeId')).all()
  return c.json(results ?? [])
})

analyst.get('/claims/:placeId', async (c) => {
  const status = c.req.query('status') ?? 'proposed'
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM claims WHERE place_id = ? AND status = ? ORDER BY created_at',
  ).bind(c.req.param('placeId'), status).all()
  return c.json(results ?? [])
})

/** Queue jobs that exhausted retries — the console's failure list. */
analyst.get('/pipeline/failures', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM pipeline_failures ORDER BY created_at DESC LIMIT 200',
  ).all()
  return c.json(results ?? [])
})
app.route('/api', analyst)

// --- queue consumer: the pipeline between stages -----------------------------
export default {
  fetch: app.fetch,

  async queue(batch: MessageBatch<PipelineJob>, env: Env): Promise<void> {
    // Dead-letter queue: jobs that exhausted retries land here. Record them
    // so the analyst console sees what died instead of dropping silently.
    if (batch.queue === 'vse-pipeline-dlq') {
      for (const msg of batch.messages) {
        await env.DB.prepare(
          'INSERT INTO pipeline_failures (id, kind, payload, error, attempts) VALUES (?, ?, ?, ?, ?)',
        )
          .bind(
            crypto.randomUUID(),
            (msg.body as PipelineJob)?.kind ?? 'unknown',
            JSON.stringify(msg.body),
            'retries exhausted',
            msg.attempts ?? 0,
          )
          .run()
        msg.ack()
      }
      return
    }
    // Messages are independent jobs — run them concurrently. Each still
    // gets the same per-claim span check; a failure retries only that
    // message.
    await Promise.allSettled(
      batch.messages.map(async (msg) => {
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
      }),
    )
  },
}
