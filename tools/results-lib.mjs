// Semantic invariants for a VSE results file (PRD §7.2, gates G7–G10).
// These are the checks JSON Schema cannot express: referential integrity,
// verbatim span equality, derivable aggregates, and gate semantics.
// Pure functions — no IO — so the engine's publish step can reuse them.

/** @returns {string[]} human-readable violations; empty means clean */
export function checkSemantics(data) {
  const errors = []
  const err = (m) => errors.push(m)

  const stories = new Map((data.stories ?? []).map((s) => [s.id, s]))
  const claims = new Map((data.claims ?? []).map((c) => [c.id, c]))
  const signals = new Map((data.signals ?? []).map((s) => [s.id, s]))
  const sips = new Map((data.sips ?? []).map((s) => [s.id, s]))

  // --- unique ids ------------------------------------------------------
  for (const [label, map, arr] of [
    ['story', stories, data.stories],
    ['claim', claims, data.claims],
    ['signal', signals, data.signals],
    ['sip', sips, data.sips],
  ]) {
    if (arr && map.size !== arr.length) err(`duplicate ${label} ids`)
  }

  // --- claims: verbatim lineage (gate G9) -------------------------------
  for (const c of data.claims ?? []) {
    const story = stories.get(c.story_id)
    if (!story) {
      err(`claim ${c.id}: story_id ${c.story_id} does not resolve`)
      continue
    }
    const [a, b] = c.span
    if (!(Number.isInteger(a) && Number.isInteger(b) && a < b && b <= story.text.length)) {
      err(`claim ${c.id}: span [${a},${b}] out of bounds for story ${c.story_id}`)
      continue
    }
    if (story.text.slice(a, b) !== c.text) {
      err(`claim ${c.id}: text does not slice-equal story ${c.story_id}[${a},${b}]`)
    }
    if (!signals.has(c.signal_id)) err(`claim ${c.id}: signal_id ${c.signal_id} does not resolve`)
  }

  // --- signals: bidirectional support + derivable aggregates ------------
  const seen = new Set()
  for (const s of data.signals ?? []) {
    if (!s.supporting_claim_ids?.length)
      err(`signal ${s.id}: resolves to no verbatim excerpts (gate G2)`)
    if (new Set(s.supporting_claim_ids ?? []).size !== (s.supporting_claim_ids ?? []).length)
      err(`signal ${s.id}: duplicate claim ids in supporting_claim_ids`)
    for (const cid of s.supporting_claim_ids) {
      const c = claims.get(cid)
      if (!c) { err(`signal ${s.id}: supporting_claim_ids -> ${cid} does not resolve`); continue }
      if (c.signal_id !== s.id) err(`signal ${s.id}: claim ${cid} points back to ${c.signal_id}`)
      seen.add(cid)
    }
    const support = s.supporting_claim_ids.map((id) => claims.get(id)).filter(Boolean)
    const voices = new Set(support.map((c) => c.story_id)).size
    if (s.voices !== voices) err(`signal ${s.id}: voices ${s.voices} != derived ${voices}`)
    if (s.recurrence !== s.supporting_claim_ids.length)
      err(`signal ${s.id}: recurrence ${s.recurrence} != ${s.supporting_claim_ids.length} claims`)
    const v = s.verification
    if (v && v.endorse + v.amend + v.contest > v.participants)
      err(`signal ${s.id}: votes (${v.endorse + v.amend + v.contest}) exceed participants (${v.participants})`)
    if (v?.amendments.length && v.amend === 0)
      err(`signal ${s.id}: has amendment text but zero amend votes`)
  }
  for (const c of data.claims ?? []) {
    if (!seen.has(c.id)) err(`claim ${c.id} is not listed as supporting its signal ${c.signal_id}`)
  }

  // --- interventions: refs, gate semantics (gate G10), counter-evidence -
  const commonsOnly = new Set(
    [...signals.values()].filter((s) => s.verification?.gate === 'commons_only').map((s) => s.id),
  )
  const interventionIds = new Map()
  for (const view of ['from_plans', 'from_place']) {
    for (const i of data.interventions?.[view] ?? []) {
      if (interventionIds.has(i.id))
        err(`intervention ${i.id}: id appears in both ${interventionIds.get(i.id)} and ${view}`)
      interventionIds.set(i.id, view)
      for (const sid of i.signal_ids)
        if (!signals.has(sid)) err(`intervention ${i.id}: signal_id ${sid} does not resolve`)
      for (const sid of i.counter_signal_ids ?? [])
        if (!signals.has(sid)) err(`intervention ${i.id}: counter_signal_id ${sid} does not resolve`)
      if ((i.counter_signal_ids ?? []).some((sid) => i.signal_ids.includes(sid)))
        err(`intervention ${i.id}: a signal cannot be both evidence and counter-evidence`)
      if (i.priced && i.signal_ids.some((sid) => commonsOnly.has(sid)))
        err(`intervention ${i.id}: priced intervention may not answer commons_only signals`)
      if (i.sip_id && !sips.has(i.sip_id)) err(`intervention ${i.id}: sip_id ${i.sip_id} does not resolve`)
    }
  }

  // --- sips: evidence must resolve --------------------------------------
  for (const s of data.sips ?? []) {
    if (!['threshold', 'node', 'window'].includes(s.kind)) err(`sip ${s.id}: unknown kind ${s.kind}`)
    for (const cid of s.evidence_claim_ids)
      if (!claims.has(cid)) err(`sip ${s.id}: evidence_claim_ids -> ${cid} does not resolve`)
    if (!s.evidence_claim_ids?.length) err(`sip ${s.id}: has no evidence claims`)
  }

  return errors
}

/** Signals a view never reaches — derived, never stored (PRD §6 note). */
export function unreachedSignals(data, view) {
  const covered = new Set((data.interventions?.[view] ?? []).flatMap((i) => i.signal_ids))
  return (data.signals ?? []).filter((s) => !covered.has(s.id))
}

export function avgSignalsPerIntervention(list) {
  if (!list?.length) return 0
  return list.reduce((n, i) => n + i.signal_ids.length, 0) / list.length
}
