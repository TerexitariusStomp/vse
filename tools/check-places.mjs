#!/usr/bin/env node
// check-places.mjs — the four place lists must agree or a new artifact
// silently never ships:
//   site/public/data/*_results.json   (what the site serves)
//   site/src/lib/results.ts PLACES    (the router's place list)
//   site/public/data/index.json       (landing-page aggregate; generated)
//   diorama specs                     (compile-time via Record<PlaceId>)
// run with: node --experimental-strip-types tools/check-places.mjs
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DATA = join(ROOT, 'site/public/data')
const { PLACES } = await import(join(ROOT, 'site/src/lib/results.ts'))

const files = readdirSync(DATA)
  .filter((f) => f.endsWith('_results.json'))
  .map((f) => f.replace(/_results\.json$/, ''))
  .sort()
const listed = PLACES.map((p) => p.id).sort()

const fail = []
const only = (a, b) => a.filter((x) => !b.includes(x))

for (const id of only(files, listed)) fail.push(`results file ${id}_results.json has no PLACES entry`)
for (const id of only(listed, files)) fail.push(`PLACES lists ${id} but no results file exists`)

// index.json must name every place with matching label/data flag — and its
// counts must match the artifacts (a stale index is drift, not just ugly).
let index = null
try {
  index = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8'))
} catch {
  fail.push('index.json missing or unparseable — run npm run data:sync')
}
if (index) {
  const byId = new Map(index.places.map((p) => [p.id, p]))
  for (const p of PLACES) {
    const e = byId.get(p.id)
    if (!e) { fail.push(`index.json has no entry for ${p.id}`); continue }
    if (e.name !== p.label) fail.push(`index.json name for ${p.id}: "${e.name}" != "${p.label}"`)
    if (e.data !== p.data) fail.push(`index.json data flag for ${p.id}: "${e.data}" != "${p.data}"`)
    const r = JSON.parse(readFileSync(join(DATA, `${p.id}_results.json`), 'utf8'))
    const counts = {
      stories: r.stories.length,
      claims: r.claims.length,
      signals: r.signals.length,
      interventions: (r.interventions.from_plans?.length ?? 0) + (r.interventions.from_place?.length ?? 0),
    }
    for (const [k, v] of Object.entries(counts))
      if (e.counts[k] !== v) fail.push(`index.json ${p.id}.${k}: ${e.counts[k]} != artifact ${v} — regenerate (npm run data:sync)`)
  }
  for (const id of only([...byId.keys()], listed)) fail.push(`index.json lists unknown place ${id}`)
}

if (fail.length) {
  console.error('place lists out of sync:')
  for (const f of fail) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`places in sync: ${listed.length} places across files, PLACES, index.json`)
