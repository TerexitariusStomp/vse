// FR-E25 — Springforth adapter. Maps a published results file into draft
// Possibility records (the Springforth "I want to…" unit, see
// ~/Documents/springforth/src/entities.ts `Possibility` zod schema).
//
// The seam is deliberate: VSE's check gates a value; the adapter only emits
// *draft* possibilities — a person still declares them on the Springforth
// side. Evidence pointers preserve verbatim lineage end-to-end: every draft
// carries the signal ids, and each signal resolves to exact story excerpts
// in the results file this artifact was published alongside.

interface Results {
  place: { id: string; name: string }
  stories: { id: string; teller_role: string; channel: string; text: string }[]
  claims: { id: string; story_id: string; text: string; signal_id: string }[]
  signals: {
    id: string
    statement: string
    supporting_claim_ids: string[]
    voices: number
    verification: { gate: string; endorse: number; amend: number; contest: number }
  }[]
  interventions: {
    from_plans: Intervention[]
    from_place: Intervention[]
  }
}

interface Intervention {
  id: string
  name: string
  note: string
  signal_ids: string[]
  counter_signal_ids: string[]
  priced: boolean
}

/** One verbatim evidence excerpt per answering signal — the strongest
 *  statement of need in the teller's own words. */
function evidenceLines(results: Results, signalIds: string[]): string[] {
  const claimsById = new Map(results.claims.map((c) => [c.id, c]))
  const storiesById = new Map(results.stories.map((s) => [s.id, s]))
  const lines: string[] = []
  for (const sid of signalIds) {
    const sig = results.signals.find((s) => s.id === sid)
    const claim = sig?.supporting_claim_ids.map((id) => claimsById.get(id)).find(Boolean)
    if (!sig || !claim) continue
    const story = storiesById.get(claim.story_id)
    lines.push(
      `“${claim.text}” — ${story?.teller_role ?? 'a resident'} (${sig.voices} voice${sig.voices === 1 ? '' : 's'}, gate: ${sig.verification.gate})`,
    )
  }
  return lines
}

export function springforthArtifact(results: Results) {
  const declared = [
    ...(results.interventions.from_place ?? []),
    ...(results.interventions.from_plans ?? []),
  ]
  const possibilities = declared.map((i: Intervention) => {
    const evidence = evidenceLines(results, i.signal_ids)
    const counter = evidenceLines(results, i.counter_signal_ids)
    return {
      id: `vse-${results.place.id}-${i.id}`,
      title: i.name,
      description: [
        i.note,
        evidence.length ? `Evidence (verbatim):\n${evidence.map((l) => `- ${l}`).join('\n')}` : '',
        counter.length ? `Harms voiced:\n${counter.map((l) => `- ${l}`).join('\n')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      declarerId: `vse-${results.place.id}`,
      place: results.place.name,
      // Only signals the place did not gate commons_only may seek capital;
      // those drafts are still unpriced on arrival — priced is metadata.
      status: 'draft',
      vse: {
        intervention_id: i.id,
        signal_ids: i.signal_ids,
        counter_signal_ids: i.counter_signal_ids,
        priced: i.priced,
      },
      createdAt: new Date().toISOString(),
    }
  })
  return {
    _about: `Springforth adapter artifact for ${results.place.name} — draft possibilities derived from a checked VSE results file.`,
    source: 'vse',
    place: results.place,
    possibilities,
  }
}
