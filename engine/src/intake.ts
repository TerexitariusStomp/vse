import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from './env.ts'

// LISTEN (PRD FR-E1..E3, E26): five channels in — whatsapp, voice, web,
// facilitated, social. Every story keeps role + channel, never a public name.
// 'social' covers public posts imported from open networks (Bluesky, Nostr,
// Hive) via tools/social — provenance URL rides in `source`.

// A story longer than this exceeds the extraction model's context and only
// burns retries — reject at the boundary instead.
const MAX_STORY_CHARS = 20_000
// Whisper on Workers AI accepts common audio containers; cap upload size.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024

// FR-E9 / NFR-2: cheap boundary heuristic — emails, phone-ish numbers, and
// national-id-ish long digit runs mark the story pii_flag=1, which holds it
// out of extraction and publication until an analyst clears it. Deliberately
// a regex, not a library: false positives cost a review, false negatives
// cost publication.
const PII_PATTERN =
  /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?\d[\d\s().-]{7,}\d)|\b\d{9,}\b/
export const piiFlag = (text: string): number => (PII_PATTERN.test(text) ? 1 : 0)

const StoryIn = z.object({
  teller_role: z.string().min(1).max(120),
  channel: z.enum(['whatsapp', 'voice', 'web', 'facilitated', 'social']),
  text: z.string().min(1).max(MAX_STORY_CHARS),
  source: z.string().max(500).optional(), // provenance ref — "system (record)"
  consent: z.boolean().optional(), // teller consent asserted by the form (FR-E9)
  turnstile_token: z.string().max(2048).optional(),
})

/** Cloudflare Turnstile — enforced for public channels when TURNSTILE_SECRET
 *  is configured; unset means facilitated mode and the check is skipped. */
export async function turnstileOk(env: Env, token: string | undefined, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET) return true
  if (!token) return false
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: ip,
    }),
  }).catch(() => null)
  if (!res) return false
  const out = (await res.json()) as { success?: boolean }
  return out.success === true
}

/** Timing-safe string comparison (Workers WebCrypto). */
export async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export const intake = new Hono<{ Bindings: Env }>()

/** Web form / facilitated-session text intake. */
intake.post('/places/:placeId/stories', async (c) => {
  const raw = await c.req.json().catch(() => null)
  const body = StoryIn.safeParse(raw)
  if (!body.success) {
    const issues = body.error.issues
    if (issues.some((i) => i.code === 'too_big'))
      return c.json({ error: `story exceeds ${MAX_STORY_CHARS} characters` }, 413)
    return c.json({ error: body.error.flatten() }, 400)
  }
  // Web-channel intake is the public spam surface (FR-E5): require Turnstile
  // when configured. Facilitated/social channels carry their own provenance.
  if (body.data.channel === 'web') {
    const ok = await turnstileOk(c.env, body.data.turnstile_token, c.req.header('cf-connecting-ip') ?? '')
    if (!ok) return c.json({ error: 'turnstile verification failed' }, 403)
  }
  const placeId = c.req.param('placeId')
  const id = crypto.randomUUID()
  // Consent (FR-E9): facilitated and whatsapp/social channels arrive through
  // flows that already assert consent; the open web form must post it.
  const consent =
    body.data.channel === 'web'
      ? body.data.consent === true ? 'granted' : 'pending'
      : 'granted'
  const res = await c.env.DB.prepare(
    'INSERT OR IGNORE INTO stories (id, place_id, teller_role, channel, text, source, consent, pii_flag) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      placeId,
      body.data.teller_role,
      body.data.channel,
      body.data.text,
      body.data.source ?? null,
      consent,
      piiFlag(body.data.text),
    )
    .run()
    .catch((e: Error) => ({ success: false as const, error: e.message, meta: { changes: 0 } }))
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
  // Extraction requires consent; pending stories wait for the analyst.
  if (consent === 'granted')
    await c.env.PIPELINE.send({ kind: 'extract', placeId, storyId: id })
  return c.json({ id, consent }, 201)
})

/** Voice intake: audio → R2 → queue → whisper → story (channel parity). */
intake.post('/places/:placeId/voice', async (c) => {
  const placeId = c.req.param('placeId')
  const form = await c.req.formData()
  const audio = form.get('audio')
  const tellerRole = String(form.get('teller_role') ?? '')
  if (!(audio instanceof File) || !tellerRole)
    return c.json({ error: 'audio file and teller_role required' }, 400)
  if (!audio.type.startsWith('audio/'))
    return c.json({ error: 'unsupported content type — audio/* required' }, 415)
  if (audio.size > MAX_AUDIO_BYTES)
    return c.json({ error: `audio exceeds ${MAX_AUDIO_BYTES >> 20}MB` }, 413)
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
  const raw = await c.req.text()
  // Verify X-Hub-Signature-256 = HMAC-SHA256(body, app secret) when the secret
  // is configured — without it anyone could inject stories into any place.
  if (c.env.WHATSAPP_APP_SECRET) {
    const header = c.req.header('x-hub-signature-256') ?? ''
    const expected = `sha256=${await hmacSha256Hex(c.env.WHATSAPP_APP_SECRET, raw)}`
    if (!timingSafeEq(header, expected)) return c.json({ error: 'bad signature' }, 401)
  }
  const payload = JSON.parse(raw) as any
  const placeId = c.req.query('place') ?? 'default'
  const messages = payload?.entry?.flatMap((e: any) =>
    e?.changes?.flatMap((ch: any) => ch?.value?.messages ?? []),
  ) ?? []
  let accepted = 0
  for (const m of messages) {
    // In production the teller role comes from onboarding flow state;
    // until then, store the channel-visible role placeholder.
    const text = m?.text?.body
    if (m?.type === 'text' && typeof text === 'string' && text.trim() && text.length <= MAX_STORY_CHARS) {
      const id = crypto.randomUUID()
      const res = await c.env.DB.prepare(
        'INSERT OR IGNORE INTO stories (id, place_id, teller_role, channel, text, pii_flag) VALUES (?, ?, ?, ?, ?, ?)',
      )
        .bind(id, placeId, 'whatsapp teller', 'whatsapp', text, piiFlag(text))
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
