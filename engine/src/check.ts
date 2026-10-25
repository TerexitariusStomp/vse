import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from './env.ts'

// CHECK (PRD FR-E13..E17): the people who told the stories endorse, amend,
// or contest each signal — before any of it may guide capital.
// Identity is a lightweight opaque token; facilitated sessions mint them
// per paper slip or shared-device session.

export const check = new Hono<{ Bindings: Env }>()

/** Facilitated mode: mint an anonymous participant token (one per slip). */
check.post('/check/session', async (c) => {
  const placeId = c.req.query('place')
  if (!placeId) return c.json({ error: 'place required' }, 400)
  const id = crypto.randomUUID()
  await c.env.DB.prepare('INSERT INTO participants (id, place_id) VALUES (?, ?)')
    .bind(id, placeId)
    .run()
  return c.json({ participant: id }, 201)
})

const VoteIn = z.object({
  participant: z.string(),
  vote: z.enum(['endorse', 'amend', 'contest']),
  amendment: z.string().max(2000).optional(),
})

check.post('/check/signals/:signalId/vote', async (c) => {
  const body = VoteIn.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  if (body.data.vote !== 'amend' && body.data.amendment)
    return c.json({ error: 'amendment text requires an amend vote' }, 400)
  const signalId = c.req.param('signalId')
  const res = await c.env.DB.prepare(
    `INSERT INTO votes (participant_id, signal_id, vote, amendment)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (participant_id, signal_id) DO UPDATE SET
       vote = excluded.vote, amendment = excluded.amendment`,
  )
    .bind(body.data.participant, signalId, body.data.vote, body.data.amendment ?? null)
    .run()
  return res.success ? c.json({ recorded: true }) : c.json({ error: 'vote failed' }, 400)
})

const GateIn = z.object({
  gate: z.enum(['may_be_priced', 'commons_only', 'not_yet']),
  set_by: z.string().optional(),
})

/** Gate transitions. The commons_sticky trigger rejects commons_only→priced.
 *  Setting the gate is the close of the check: the signal becomes 'checked'
 *  and is eligible for publication (signals.status: checking → checked). */
check.post('/check/signals/:signalId/gate', async (c) => {
  const body = GateIn.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const signalId = c.req.param('signalId')
  const res = await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO gates (signal_id, gate, set_by) VALUES (?, ?, ?)
       ON CONFLICT (signal_id) DO UPDATE SET gate = excluded.gate, set_by = excluded.set_by`,
    ).bind(signalId, body.data.gate, body.data.set_by ?? null),
    c.env.DB.prepare("UPDATE signals SET status = 'checked' WHERE id = ?").bind(signalId),
  ]).catch((e: Error) => [{ success: false, error: e.message }])
  return res.every((r) => r.success)
    ? c.json({ gate: body.data.gate })
    : c.json({ error: (res as { error?: string }[])[0]?.error ?? 'gate rejected' }, 409)
})

/** Live tally for a place's signals — drives the people-check screen. */
check.get('/check/:placeId', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT s.id, s.statement, s.status,
            (SELECT gate FROM gates g WHERE g.signal_id = s.id) AS gate,
            (SELECT COUNT(DISTINCT v.participant_id) FROM votes v WHERE v.signal_id = s.id) AS participants,
            (SELECT COUNT(*) FROM votes v WHERE v.signal_id = s.id AND v.vote = 'endorse') AS endorse,
            (SELECT COUNT(*) FROM votes v WHERE v.signal_id = s.id AND v.vote = 'amend') AS amend,
            (SELECT COUNT(*) FROM votes v WHERE v.signal_id = s.id AND v.vote = 'contest') AS contest
     FROM signals s WHERE s.place_id = ?`,
  )
    .bind(c.req.param('placeId'))
    .all()
  const { results: amendments } = await c.env.DB.prepare(
    `SELECT v.signal_id, v.amendment FROM votes v
     JOIN signals s ON s.id = v.signal_id
     WHERE s.place_id = ? AND v.amendment IS NOT NULL`,
  )
    .bind(c.req.param('placeId'))
    .all<{ signal_id: string; amendment: string }>()
  const bySignal = new Map<string, string[]>()
  for (const a of amendments ?? [])
    bySignal.set(a.signal_id, [...(bySignal.get(a.signal_id) ?? []), a.amendment])
  return c.json(
    (results ?? []).map((s: any) => ({ ...s, amendments: bySignal.get(s.id) ?? [] })),
  )
})
