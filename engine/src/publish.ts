import type { Env } from './env.ts'
// Same semantic invariants as tools/validate-results.mjs — publish reuses
// the library so the file the demonstrator reads is exactly what passed.
import { checkSemantics } from '../../tools/results-lib.mjs'

// PUBLISH (PRD FR-E24, gate G8): assemble → schema+semantics → version →
// sha256 manifest → R2 → publications row. Only checked signals publish.

interface PubRow { id: string; version: string; manifest_sha256: string; r2_key: string }

/** Assemble the results-file JSON for a place from live tables. */
export async function assembleResults(env: Env, placeId: string) {
  const db = env.DB
  const place = await db.prepare('SELECT * FROM places WHERE id = ?').bind(placeId).first()
  if (!place) throw new Error(`place ${placeId} not found`)

  const stories = (
    await db.prepare('SELECT id, teller_role, channel, text FROM stories WHERE place_id = ? AND withdrawn = 0').bind(placeId).all()
  ).results ?? []
  const claims = (
    await db.prepare(
      `SELECT id, story_id, text, span_start, span_end, signal_id FROM claims
       WHERE place_id = ? AND status = 'verified' AND signal_id IS NOT NULL`,
    ).bind(placeId).all()
  ).results ?? []

  const signals = (
    await db.prepare(
      `SELECT s.id, s.statement,
              (SELECT gate FROM gates g WHERE g.signal_id = s.id) AS gate
       FROM signals s WHERE s.place_id = ? AND s.status = 'checked'`,
    ).bind(placeId).all()
  ).results ?? []

  const votes = (
    await db.prepare(
      `SELECT v.signal_id, v.participant_id, v.vote, v.amendment FROM votes v
       JOIN signals s ON s.id = v.signal_id WHERE s.place_id = ?`,
    ).bind(placeId).all()
  ).results ?? []
  const participantCount = (
    await db.prepare('SELECT COUNT(*) AS n FROM participants WHERE place_id = ?').bind(placeId).first<{ n: number }>()
  )?.n ?? 0

  const claimsOf = (sid: string) => claims.filter((c: any) => c.signal_id === sid)
  const signalsOut = (signals as any[]).map((s) => {
    const v = (votes as any[]).filter((x) => x.signal_id === s.id)
    const support = claimsOf(s.id)
    return {
      id: s.id,
      statement: s.statement,
      supporting_claim_ids: support.map((c: any) => c.id),
      voices: new Set(support.map((c: any) => c.story_id)).size,
      recurrence: support.length,
      verification: {
        participants: new Set(v.map((x) => x.participant_id)).size,
        endorse: v.filter((x) => x.vote === 'endorse').length,
        amend: v.filter((x) => x.vote === 'amend').length,
        contest: v.filter((x) => x.vote === 'contest').length,
        amendments: v.map((x) => x.amendment).filter(Boolean),
        gate: s.gate ?? 'not_yet',
      },
    }
  })

  const sips = (
    await db.prepare('SELECT * FROM sips WHERE place_id = ?').bind(placeId).all()
  ).results ?? []
  const sipEvidence = (
    await db.prepare(
      `SELECT e.sip_id, e.claim_id FROM sip_evidence e JOIN sips s ON s.id = e.sip_id WHERE s.place_id = ?`,
    ).bind(placeId).all()
  ).results ?? []

  const interventions = (
    await db.prepare('SELECT * FROM interventions WHERE place_id = ?').bind(placeId).all()
  ).results ?? []
  const links = (
    await db.prepare(
      `SELECT l.intervention_id, l.signal_id, l.role FROM intervention_signals l
       JOIN interventions i ON i.id = l.intervention_id WHERE i.place_id = ?`,
    ).bind(placeId).all()
  ).results ?? []

  const interventionOut = (view: string) =>
    (interventions as any[])
      .filter((i) => i.view === view)
      .map((i) => {
        const mine = (links as any[]).filter((l) => l.intervention_id === i.id)
        return {
          id: i.id, name: i.name, note: i.note,
          signal_ids: mine.filter((l) => l.role === 'answer').map((l) => l.signal_id),
          counter_signal_ids: mine.filter((l) => l.role === 'counter').map((l) => l.signal_id),
          sip_id: i.sip_id ?? undefined,
          priced: !!i.priced,
        }
      })

  return {
    _about: `Results for ${(place as any).name}, published by a Value Structuring Engine.`,
    place: { id: (place as any).id, name: (place as any).name, kind: (place as any).kind, summary: (place as any).summary },
    pipeline: [
      { stage: 'Listening', detail: 'stories told in people’s own words', count: stories.length, unit: 'stories' },
      { stage: 'Making sense', detail: 'exact excerpts extracted from stories', count: claims.length, unit: 'excerpts' },
      { stage: 'Consolidating', detail: 'excerpts gathered into signals', count: signalsOut.length, unit: 'signals' },
      { stage: 'People check', detail: 'contributors endorse, amend or contest', count: participantCount, unit: 'participants' },
    ],
    scale_note: (place as any).scale_note ?? undefined,
    stories,
    claims: (claims as any[]).map((c) => ({ id: c.id, story_id: c.story_id, text: c.text, span: [c.span_start, c.span_end], signal_id: c.signal_id })),
    signals: signalsOut,
    interventions: { from_plans: interventionOut('from_plans'), from_place: interventionOut('from_place') },
    sips: (sips as any[]).map((s) => ({
      id: s.id, kind: s.kind, title: s.title, what_changes: s.what_changes, time_to_show: s.time_to_show,
      evidence_claim_ids: (sipEvidence as any[]).filter((e) => e.sip_id === s.id).map((e) => e.claim_id),
    })),
    priorities: { title: 'Where capital is most needed', intro: '', items: [] },
  }
}

export async function publish(env: Env, placeId: string): Promise<PubRow> {
  const results = await assembleResults(env, placeId)

  // Structural rules that must hold before anything reaches a static host.
  if (!results.signals.length) throw new Error('no checked signals — nothing to publish')
  const semantics = checkSemantics(results as any)
  if (semantics.length) throw new Error(`semantic validation failed: ${semantics.join('; ')}`)

  const version = new Date().toISOString().slice(0, 10)
  const body = JSON.stringify({ ...results, meta: { place_id: placeId, version, published_at: new Date().toISOString() } }, null, 2)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body))
  const sha = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')

  const key = `results/${placeId}/${version}-${sha.slice(0, 12)}.json`
  const manifest = JSON.stringify({ file: key, sha256: sha, version, place: placeId }, null, 2)
  await env.ARTIFACTS.put(key, body, { httpMetadata: { contentType: 'application/json' } })
  await env.ARTIFACTS.put(`${key}.manifest.json`, manifest)

  const id = crypto.randomUUID()
  await env.DB.prepare(
    'INSERT INTO publications (id, place_id, version, manifest_sha256, r2_key) VALUES (?, ?, ?, ?, ?)',
  ).bind(id, placeId, version, sha, key).run()
  return { id, version, manifest_sha256: sha, r2_key: key }
}
