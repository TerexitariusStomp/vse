import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from './env.ts'

// LISTEN (PRD FR-E1..E3, E26): five channels in — whatsapp, voice, web,
// facilitated, social. Every story keeps role + channel, never a public name.
// 'social' covers public posts imported from open networks (Bluesky, Nostr,
// Hive) via tools/social — provenance URL rides in `source`.

const StoryIn = z.object({
  teller_role: z.string().min(1).max(120),
  channel: z.enum(['whatsapp', 'voice', 'web', 'facilitated', 'social']),
  text: z.string().min(1),
  source: z.string().max(500).optional(), // provenance ref — "system (record)"
})

export const intake = new Hono<{ Bindings: Env }>()

/** Web form / facilitated-session text intake. */
intake.post('/places/:placeId/stories', async (c) => {
  const body = StoryIn.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const placeId = c.req.param('placeId')
  const id = crypto.randomUUID()
  const res = await c.env.DB.prepare(
    'INSERT OR IGNORE INTO stories (id, place_id, teller_role, channel, text, source) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      placeId,
      body.data.teller_role,
      body.data.channel,
      body.data.text,
      body.data.source ?? null,
    )
    .run()
  if (!res.success) return c.json({ error: 'insert failed (unknown place?)' }, 400)
  // UNIQUE(place_id, text) dedup: identical words are the same story —
  // return the existing row instead of double-extracting it.
  if (res.meta.changes === 0) {
    const existing = await c.env.DB.prepare(
      'SELECT id FROM stories WHERE place_id = ? AND text = ?',
    )
      .bind(placeId, body.data.text)
      .first<{ id: string }>()
    return c.json({ id: existing?.id ?? id, dedup: true })
  }
  await c.env.PIPELINE.send({ kind: 'extract', placeId, storyId: id })
  return c.json({ id }, 201)
})

/** Voice intake: audio → R2 → queue → whisper → story (channel parity). */
intake.post('/places/:placeId/voice', async (c) => {
  const placeId = c.req.param('placeId')
  const form = await c.req.formData()
  const audio = form.get('audio')
  const tellerRole = String(form.get('teller_role') ?? '')
  if (!(audio instanceof File) || !tellerRole)
    return c.json({ error: 'audio file and teller_role required' }, 400)
  const r2Key = `audio/${placeId}/${crypto.randomUUID()}`
  await c.env.ARTIFACTS.put(r2Key, audio.stream(), {
    httpMetadata: { contentType: audio.type },
  })
  await c.env.PIPELINE.send({
    kind: 'transcribe',
    placeId,
    r2Key,
    tellerRole,
    channel: 'voice',
  })
  return c.json({ queued: true, r2Key }, 202)
})

/** WhatsApp Cloud API webhook — GET verify + POST message ingest (FR-E2). */
intake.get('/intake/whatsapp', (c) => {
  const mode = c.req.query('hub.mode')
  const token = c.req.query('hub.verify_token')
  const challenge = c.req.query('hub.challenge')
  if (mode === 'subscribe' && token === c.env.WHATSAPP_VERIFY_TOKEN)
    return c.text(challenge ?? '')
  return c.text('forbidden', 403)
})

intake.post('/intake/whatsapp', async (c) => {
  const payload = (await c.req.json().catch(() => null)) as any
  const placeId = c.req.query('place') ?? 'default'
  const messages = payload?.entry?.flatMap((e: any) =>
    e?.changes?.flatMap((ch: any) => ch?.value?.messages ?? []),
  ) ?? []
  let accepted = 0
  for (const m of messages) {
    // In production the teller role comes from onboarding flow state;
    // until then, store the channel-visible role placeholder.
    const text = m?.text?.body
    if (m?.type === 'text' && typeof text === 'string' && text.trim()) {
      const id = crypto.randomUUID()
      const res = await c.env.DB.prepare(
        'INSERT OR IGNORE INTO stories (id, place_id, teller_role, channel, text) VALUES (?, ?, ?, ?, ?)',
      )
        .bind(id, placeId, 'whatsapp teller', 'whatsapp', text)
        .run()
      if (res.meta.changes === 0) continue
      await c.env.PIPELINE.send({ kind: 'extract', placeId, storyId: id })
      accepted++
    }
    // Audio messages arrive as media ids — a follow-up fetch via
    // WHATSAPP_TOKEN retrieves the media URL; left to deployment config.
  }
  return c.json({ accepted })
})

/** Teller withdrawal (FR-E26): mark the story withdrawn; its claims are
 *  quarantined so nothing derived from it can reach publication. */
intake.post('/stories/:storyId/withdraw', async (c) => {
  const id = c.req.param('storyId')
  const res = await c.env.DB.batch([
    c.env.DB.prepare('UPDATE stories SET withdrawn = 1 WHERE id = ?').bind(id),
    c.env.DB.prepare(
      `UPDATE claims SET status = 'quarantined', signal_id = NULL
       WHERE story_id = ?`,
    ).bind(id),
  ])
  return res.every((r) => r.success)
    ? c.json({ withdrawn: id })
    : c.json({ error: 'withdraw failed' }, 500)
})
