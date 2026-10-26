#!/usr/bin/env node
// build-places-index.mjs — aggregate every published results artifact into
// data/index.json for the landing page: per-place counts + a verbatim
// excerpt → signal → intervention thread. Derived only, never authored —
// the thread is picked from the artifacts' own linkages.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DATA = new URL('../site/public/data/', import.meta.url).pathname
const PLACE_META = {
  // keep in sync with site/src/lib/results.ts PLACES
  thorntree: { name: 'Thorntree', data: 'real' },
  'kenya-coast': { name: 'Kenya coast', data: 'real' },
  'mida-creek': { name: 'Mida Creek', data: 'real' },
  'hebden-bridge': { name: 'Hebden Bridge', data: 'real' },
  'dar-es-salaam': { name: 'Dar es Salaam', data: 'real' },
  'puerto-la-cruz': { name: 'Puerto la Cruz', data: 'real' },
  minneapolis: { name: 'Minneapolis', data: 'real' },
  nairobi: { name: 'Nairobi', data: 'real' },
  detroit: { name: 'Detroit', data: 'real' },
  utopia: { name: 'Utopia', data: 'dummy' },
}

function threadFor(r) {
  const claimById = new Map(r.claims.map((c) => [c.id, c]))
  const storyById = new Map(r.stories.map((s) => [s.id, s]))
  const interventions = [
    ...(r.interventions.from_plans ?? []),
    ...(r.interventions.from_voices ?? []),
    ...(r.interventions.dreams ?? []),
  ]
  const used = new Set(interventions.flatMap((i) => i.signal_ids))
  const sig =
    r.signals.find((s) => used.has(s.id) && s.supporting_claim_ids.length) ??
    r.signals.find((s) => s.supporting_claim_ids.length)
  if (!sig) return null
  // prefer a clean, quotable excerpt — no hashtag salad, no did: handles
  const claims = sig.supporting_claim_ids
    .map((id) => claimById.get(id))
    .filter(Boolean)
  const claim =
    claims.find((c) => !c.text.includes('#') && c.text.length > 24) ??
    claims.find((c) => !c.text.includes('#')) ??
    claims[0]
  if (!claim) return null
  const story = storyById.get(claim.story_id)
  const teller = (story?.teller_role ?? 'A resident')
    .replace(/\s*·\s*did:\S+/, '')
    .replace(/\bdid:\S+/, 'public post')
  const intv = interventions.find((i) => i.signal_ids.includes(sig.id))
  return {
    excerpt: claim.text,
    teller,
    channel: story?.channel ?? 'story',
    signal: sig.statement,
    intervention: intv?.name ?? null,
  }
}

const places = []
for (const f of readdirSync(DATA).filter((f) => f.endsWith('_results.json'))) {
  const id = f.replace(/_results\.json$/, '')
  const meta = PLACE_META[id]
  if (!meta) continue
  const r = JSON.parse(readFileSync(join(DATA, f), 'utf8'))
  places.push({
    id,
    name: meta.name,
    data: meta.data,
    geo: r.place.geo ?? null,
    counts: {
      stories: r.stories.length,
      claims: r.claims.length,
      signals: r.signals.length,
      interventions:
        (r.interventions.from_plans?.length ?? 0) +
        (r.interventions.from_voices?.length ?? 0) +
        (r.interventions.dreams?.length ?? 0),
    },
    thread: threadFor(r),
  })
}
const order = Object.keys(PLACE_META)
places.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))
const out = { generated: new Date().toISOString(), places }
writeFileSync(join(DATA, 'index.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`index.json: ${places.length} places`)
