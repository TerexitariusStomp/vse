import type { Results } from './results'

/** Pure, data-derived counts behind every plain-language answer line. */

export function storiesAnswer(r: Results) {
  const freq = new Map<string, number>()
  for (const s of r.stories.filter((x) => x.channel !== 'social'))
    freq.set(s.teller_role, (freq.get(s.teller_role) ?? 0) + 1)
  const roles = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([role]) => role)
  return { stories: r.stories.length, roles }
}

export function signalsAnswer(r: Results) {
  const strongest = [...r.signals].sort(
    (a, b) => b.voices - a.voices || b.recurrence - a.recurrence,
  )[0]
  return {
    claims: r.claims.length,
    signals: r.signals.length,
    voices: strongest?.voices ?? 0,
    statement: strongest?.statement ?? null,
  }
}

export function checkAnswer(r: Results) {
  const backed = r.signals.filter(
    (s) => s.verification.endorse > s.verification.contest + s.verification.amend,
  ).length
  const contested = r.signals.filter((s) => s.verification.contest > 0).length
  return { backed, signals: r.signals.length, contested }
}

export function capitalAnswer(r: Results) {
  const interventions =
    (r.interventions.from_plans?.length ?? 0) + (r.interventions.from_place?.length ?? 0)
  const commons = r.signals.filter((s) => s.verification.gate === 'commons_only').length
  return { interventions, commons }
}

export function prioritiesAnswer(r: Results) {
  return { items: r.priorities.items.length }
}
