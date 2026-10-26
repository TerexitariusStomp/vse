import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from './env.ts'
import { runConsolidation } from './consolidate.ts'

// STRUCTURE (PRD FR-E18..E23): signals → two intervention views → sips →
// the Springforth seam. Analyst routes are bearer-gated (ANALYST_KEY).

export const structure = new Hono<{ Bindings: Env }>()

/** Candidate clusters for the analyst console. */
structure.post('/consolidate/:placeId', async (c) => {
  return c.json({ clusters: await runConsolidation(c.env, c.req.param('placeId')) })
})

const SignalIn = z.object({
  statement: z.string().min(1),
  claim_ids: z.array(z.string()).min(1),
})

/** Analyst confirms a cluster as a signal; claims get linked verbatim.
 *  Every claim_id must resolve to a verified claim in this place — a silent
 *  no-op would produce a signal backing fewer words than the analyst saw. */
structure.post('/places/:placeId/signals', async (c) => {
  const body = SignalIn.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  const placeId = c.req.param('placeId')
  const resolvable = await c.env.DB.prepare(
    `SELECT id FROM claims
     WHERE place_id = ? AND status = 'verified'
       AND id IN (${body.data.claim_ids.map(() => '?').join(',')})`,
  )
    .bind(placeId, ...body.data.claim_ids)
    .all<{ id: string }>()
  const ok = new Set((resolvable.results ?? []).map((r) => r.id))
  const missing = body.data.claim_ids.filter((cid) => !ok.has(cid))
  if (missing.length)
    return c.json({ error: `claims not verified in this place: ${missing.join(', ')}` }, 400)
  const id = crypto.randomUUID()
  const batch = [
    c.env.DB.prepare(
      'INSERT INTO signals (id, place_id, statement, status) VALUES (?, ?, ?, ?)',
    ).bind(id, placeId, body.data.statement, 'checking'),
    c.env.DB.prepare(
      "INSERT INTO gates (signal_id, gate) VALUES (?, 'not_yet')",
    ).bind(id),
    ...body.data.claim_ids.map((cid) =>
      c.env.DB.prepare(
        `UPDATE claims SET signal_id = ? WHERE id = ? AND place_id = ? AND status = 'verified'`,
      ).bind(id, cid, placeId),
    ),
  ]
  const res = await c.env.DB.batch(batch)
  return res.every((r) => r.success)
    ? c.json({ id }, 201)
    : c.json({ error: 'signal insert failed' }, 400)
})

const InterventionIn = z.object({
  view: z.enum(['from_plans', 'from_place']),
  name: z.string().min(1),
  note: z.string().default(''),
  signal_ids: z.array(z.string()).min(1),
  counter_signal_ids: z.array(z.string()).default([]), // harms, FR-E22
  sip_id: z.string().optional(),
  priced: z.boolean().default(false),
})

structure.post('/places/:placeId/interventions', async (c) => {
  const body = InterventionIn.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)

  // All referenced signals must exist in this place — intervention links
  // to another place's signals would corrupt the published file.
  const placeId = c.req.param('placeId')
  const allSignalIds = [...body.data.signal_ids, ...body.data.counter_signal_ids]
  const sigRows = await c.env.DB.prepare(
    `SELECT id FROM signals WHERE place_id = ? AND id IN (${allSignalIds.map(() => '?').join(',')})`,
  )
    .bind(placeId, ...allSignalIds)
    .all<{ id: string }>()
  const found = new Set((sigRows.results ?? []).map((r) => r.id))
  const missing = allSignalIds.filter((sid) => !found.has(sid))
  if (missing.length)
    return c.json({ error: `signals not in this place: ${missing.join(', ')}` }, 400)

  // commons_only signals can never back a priced intervention (gate G10).
  if (body.data.priced) {
    const commons = await c.env.DB.prepare(
      `SELECT s.id FROM signals s JOIN gates g ON g.signal_id = s.id
       WHERE g.gate = 'commons_only' AND s.id IN (${body.data.signal_ids.map(() => '?').join(',')})`,
    )
      .bind(...body.data.signal_ids)
      .all()
    if (commons.results?.length)
      return c.json({ error: 'commons_only signals cannot back a priced intervention' }, 409)
  }

  const id = crypto.randomUUID()
  const rows = [
    c.env.DB.prepare(
      'INSERT INTO interventions (id, place_id, view, name, note, sip_id, priced) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).bind(id, placeId, body.data.view, body.data.name, body.data.note, body.data.sip_id ?? null, body.data.priced ? 1 : 0),
    ...body.data.signal_ids.map((sid) =>
      c.env.DB.prepare(
        "INSERT INTO intervention_signals (intervention_id, signal_id, role) VALUES (?, ?, 'answer')",
      ).bind(id, sid),
    ),
    ...body.data.counter_signal_ids.map((sid) =>
      c.env.DB.prepare(
        "INSERT INTO intervention_signals (intervention_id, signal_id, role) VALUES (?, ?, 'counter')",
      ).bind(id, sid),
    ),
  ]
  const res = await c.env.DB.batch(rows)
  return res.every((r) => r.success) ? c.json({ id }, 201) : c.json({ error: 'insert failed' }, 400)
})

const SipIn = z.object({
  kind: z.enum(['threshold', 'node', 'window']),
  title: z.string().min(1),
  what_changes: z.string().min(1),
  time_to_show: z.string().min(1),
  evidence_claim_ids: z.array(z.string()).min(1),
})

structure.post('/places/:placeId/sips', async (c) => {
  const body = SipIn.safeParse(await c.req.json().catch(() => null))
  if (!body.success) return c.json({ error: body.error.flatten() }, 400)
  // Evidence claims must resolve inside this place.
  const ev = await c.env.DB.prepare(
    `SELECT id FROM claims WHERE place_id = ? AND status = 'verified'
       AND id IN (${body.data.evidence_claim_ids.map(() => '?').join(',')})`,
  )
    .bind(c.req.param('placeId'), ...body.data.evidence_claim_ids)
    .all<{ id: string }>()
  const evOk = new Set((ev.results ?? []).map((r) => r.id))
  const missing = body.data.evidence_claim_ids.filter((cid) => !evOk.has(cid))
  if (missing.length)
    return c.json({ error: `evidence claims not verified in this place: ${missing.join(', ')}` }, 400)
  const id = crypto.randomUUID()
  const res = await c.env.DB.batch([
    c.env.DB.prepare(
      'INSERT INTO sips (id, place_id, kind, title, what_changes, time_to_show) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(id, c.req.param('placeId'), body.data.kind, body.data.title, body.data.what_changes, body.data.time_to_show),
    ...body.data.evidence_claim_ids.map((cid) =>
      c.env.DB.prepare('INSERT INTO sip_evidence (sip_id, claim_id) VALUES (?, ?)').bind(id, cid),
    ),
  ])
  return res.every((r) => r.success) ? c.json({ id }, 201) : c.json({ error: 'insert failed' }, 400)
})
