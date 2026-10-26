#!/usr/bin/env node
// data-sync.mjs — keep site/public/data/ an exact mirror of canonical data/.
//
//   node tools/data-sync.mjs          copy + regenerate index.json
//   node tools/data-sync.mjs --check  verify only (CI drift gate)
//
// The results artifacts are published to data/ by the engine/tooling; the
// static demonstrator serves its own copy so it can deploy standalone.
import { copyFileSync, readdirSync, readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'data')
const DST = join(ROOT, 'site/public/data')
const CHECK = process.argv.includes('--check')

const files = readdirSync(SRC).filter((f) => f.endsWith('_results.json'))
let drift = []
for (const f of files) {
  const src = readFileSync(join(SRC, f))
  let dst = null
  try {
    dst = readFileSync(join(DST, f))
  } catch {
    /* missing */
  }
  if (!dst?.equals(src)) drift.push(f)
}

if (CHECK) {
  if (drift.length) {
    console.error(`data drift: ${drift.join(', ')} — run npm run data:sync`)
    process.exit(1)
  }
  console.log(`data/: ${files.length} artifacts mirrored, no drift`)
  process.exit(0)
}

mkdirSync(DST, { recursive: true })
for (const f of files) copyFileSync(join(SRC, f), join(DST, f))
execFileSync('node', [join(ROOT, 'tools/build-places-index.mjs')], { stdio: 'inherit' })
console.log(`synced ${files.length} artifacts (${drift.length} updated)`)
