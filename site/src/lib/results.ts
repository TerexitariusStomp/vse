import { z } from 'zod'

// Mirrors schema/results.schema.json (PRD §7.2). Keep in step.

const Gate = z.enum(['may_be_priced', 'commons_only', 'not_yet'])
export type Gate = z.infer<typeof Gate>

export const ResultsSchema = z.object({
  _about: z.string().optional(),
  place: z.object({
    id: z.string(),
    name: z.string(),
    kind: z.string(),
    summary: z.string(),
    geo: z.object({ lat: z.number(), lon: z.number() }).optional(),
    readings: z
      .array(z.object({ label: z.string(), value: z.string(), source: z.string() }))
      .optional(),
  }),
  pipeline: z
    .array(
      z.object({
        stage: z.string(),
        detail: z.string(),
        count: z.number().int().nonnegative(),
        unit: z.string(),
      }),
    )
    .length(4),
  scale_note: z.string().optional(),
  stories: z.array(
    z.object({
      id: z.string(),
      teller_role: z.string(),
      channel: z.string(),
      source: z.string().optional(),
      text: z.string().min(1),
    }),
  ),
  claims: z.array(
    z.object({
      id: z.string(),
      story_id: z.string(),
      text: z.string().min(1),
      span: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
      signal_id: z.string(),
    }),
  ),
  signals: z.array(
    z.object({
      id: z.string(),
      statement: z.string(),
      supporting_claim_ids: z.array(z.string()),
      voices: z.number().int().nonnegative(),
      recurrence: z.number().int().nonnegative(),
      verification: z.object({
        participants: z.number().int().nonnegative(),
        endorse: z.number().int().nonnegative(),
        amend: z.number().int().nonnegative(),
        contest: z.number().int().nonnegative(),
        amendments: z.array(z.string()),
        gate: Gate,
      }),
    }),
  ),
  interventions: z.object({
    from_plans: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        signal_ids: z.array(z.string()),
        counter_signal_ids: z.array(z.string()).optional(),
        note: z.string(),
        sip_id: z.string().optional(),
        priced: z.boolean().optional(),
      }),
    ),
    from_place: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        signal_ids: z.array(z.string()),
        counter_signal_ids: z.array(z.string()).optional(),
        note: z.string(),
        sip_id: z.string().optional(),
        priced: z.boolean().optional(),
      }),
    ),
  }),
  sips: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['threshold', 'node', 'window']),
      title: z.string(),
      what_changes: z.string(),
      time_to_show: z.string(),
      evidence_claim_ids: z.array(z.string()),
    }),
  ),
  priorities: z.object({
    title: z.string(),
    intro: z.string(),
    items: z.array(z.object({ heading: z.string(), text: z.string() })),
  }),
  meta: z
    .object({
      place_id: z.string(),
      version: z.string(),
      published_at: z.string(),
      manifest_sha256: z.string(),
    })
    .optional(),
})

export type Results = z.infer<typeof ResultsSchema>
export type Story = Results['stories'][number]
export type Claim = Results['claims'][number]
export type Signal = Results['signals'][number]
export type Intervention = Results['interventions']['from_plans'][number]
export type Sip = Results['sips'][number]
export type View = keyof Results['interventions']

/** Places with published results files in public/data/. */
export const PLACES = [
  { id: 'thorntree', label: 'Thorntree' },
  { id: 'kenya-coast', label: 'Kenya coast' },
] as const
export type PlaceId = (typeof PLACES)[number]['id']

export function currentPlace(): PlaceId {
  const q = new URLSearchParams(window.location.search).get('place')
  if (q === 'thorntree' || q === 'kenya-coast') return q
  const saved = localStorage.getItem('vse-place')
  return saved === 'kenya-coast' ? 'kenya-coast' : 'thorntree'
}

export async function loadResults(place: PlaceId = 'thorntree'): Promise<Results> {
  const url = `${import.meta.env.BASE_URL}data/${place}_results.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load results file (${res.status})`)
  return ResultsSchema.parse(await res.json())
}

// ---- derived selectors (never stored in the file) ----

export function signalMap(r: Results) {
  return new Map(r.signals.map((s) => [s.id, s]))
}
export function storyMap(r: Results) {
  return new Map(r.stories.map((s) => [s.id, s]))
}
export function claimsBySignal(r: Results) {
  const m = new Map<string, Claim[]>()
  for (const c of r.claims) {
    const arr = m.get(c.signal_id) ?? []
    arr.push(c)
    m.set(c.signal_id, arr)
  }
  return m
}
export function claimsByStory(r: Results) {
  const m = new Map<string, Claim[]>()
  for (const c of r.claims) {
    const arr = m.get(c.story_id) ?? []
    arr.push(c)
    m.set(c.story_id, arr)
  }
  for (const arr of m.values()) arr.sort((a, b) => a.span[0] - b.span[0])
  return m
}

/** Segments of a story's text with claim ids, for in-place highlighting. */
export function storySegments(
  story: Story,
  claims: Claim[],
): { text: string; claim?: Claim }[] {
  const segs: { text: string; claim?: Claim }[] = []
  let pos = 0
  for (const c of claims) {
    const [s, e] = c.span
    if (s < pos || e > story.text.length) continue // defensive; validator guarantees
    if (s > pos) segs.push({ text: story.text.slice(pos, s) })
    segs.push({ text: story.text.slice(s, e), claim: c })
    pos = e
  }
  if (pos < story.text.length) segs.push({ text: story.text.slice(pos) })
  return segs
}

export function avgSignalsPerIntervention(list: Intervention[]) {
  if (!list.length) return 0
  return list.reduce((n, i) => n + i.signal_ids.length, 0) / list.length
}

/** Signals no intervention in this view answers — derived, never hard-coded. */
export function unreachedSignals(r: Results, view: View): Signal[] {
  const covered = new Set(r.interventions[view].flatMap((i) => i.signal_ids))
  return r.signals.filter((s) => !covered.has(s.id))
}

export const GATE_LABEL: Record<Gate, string> = {
  may_be_priced: 'May be priced',
  commons_only: 'Commons only (never priced)',
  not_yet: 'Not yet settled',
}
export const GATE_HINT: Record<Gate, string> = {
  may_be_priced: 'The place has agreed this need can carry a price.',
  commons_only: 'The place says this belongs to everyone — never price it.',
  not_yet: 'The people have not settled whether this may be priced.',
}
export const SIP_KIND_LABEL: Record<Sip['kind'], string> = {
  threshold: 'Threshold',
  node: 'Node',
  window: 'Window in time',
}
