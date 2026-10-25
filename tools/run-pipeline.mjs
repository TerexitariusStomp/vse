#!/usr/bin/env node
// run-pipeline.mjs — drive one place through the live VSE engine end to end.
//
//   node tools/run-pipeline.mjs tools/places/kenya-coast.spec.json [--write]
//
// A spec carries the curated verbatim stories + the analyst decisions
// (signal groupings, gates, interventions, SIPs). The script:
//   1. verifies every story text appears verbatim in the Springforth corpus
//      (SPRINGFORTH_DIR, default ~/Documents/springforth) — nothing invented;
//   2. pushes the place + stories through real API routes;
//   3. re-drives extraction per story, consolidates (logged), creates
//      signals by matching spec claim_texts to actually-extracted claims;
//   4. mints participants, casts the spec votes + amendments + gates;
//   5. posts interventions + SIPs, publishes, fetches the artifact;
//   6. --write saves it to data/ + site/public/data/ and validates it.
//
// Env: VSE_BASE (default https://vse-engine.delta-git.workers.dev),
//      VSE_ANALYST_KEY or --key-file <path>.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const BASE = process.env.VSE_BASE ?? 'https://vse-engine.delta-git.workers.dev'
const SF = process.env.SPRINGFORTH_DIR ?? join(homedir(), 'Documents/springforth')

// ---- args ------------------------------------------------------------------
const args = process.argv.slice(2)
const specPath = args.find((a) => !a.startsWith('--'))
if (!specPath) {
  console.error('usage: run-pipeline.mjs <spec.json> [--write] [--key-file <path>]')
  process.exit(2)
}
const WRITE = args.includes('--write')
const RESET = args.includes('--reset')
const keyFileIdx = args.indexOf('--key-file')
const KEY =
  process.env.VSE_ANALYST_KEY ??
  (keyFileIdx > -1 ? readFileSync(args[keyFileIdx + 1], 'utf8').trim() : null)
const spec = JSON.parse(readFileSync(specPath, 'utf8'))

// ---- helpers ---------------------------------------------------------------
const log = (...a) => console.log('▸', ...a)
const fail = (msg) => {
  console.error('✗', msg)
  process.exit(1)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(method, path, body, { auth = false, retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        'content-type': 'application/json',
        ...(auth ? { authorization: `Bearer ${KEY}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = { raw: text } }
    if (res.ok) return json
    if (attempt < retries && res.status >= 500) { await sleep(1500); continue }
    fail(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
}

// ---- 1. verbatim source verification ---------------------------------------
log(`spec ${specPath} — place "${spec.place.id}"`)
const corpus = (() => {
  const files = []
  const outDir = join(SF, 'out')
  const fixDir = join(SF, 'scripts/fixtures')
  if (existsSync(outDir)) files.push(...readdirSync(outDir).filter((f) => f.endsWith('.sql')).map((f) => join(outDir, f)))
  if (existsSync(fixDir)) files.push(...readdirSync(fixDir).map((f) => join(fixDir, f)))
  return files.map((f) => readFileSync(f, 'utf8')).join('\n')
})()
if (!corpus.length) fail(`no corpus found under ${SF}`)

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
for (const st of spec.stories) {
  // SQL text may escape quotes as '' — check both raw and sql-escaped forms.
  const sqlEscaped = st.text.replace(/'/g, "''")
  if (!corpus.includes(st.text) && !corpus.includes(sqlEscaped))
    fail(`story text not found verbatim in corpus: ${st.text.slice(0, 80)}`)
}
log(`${spec.stories.length} stories verified verbatim against corpus`)

// ---- reset (iteration): wipe a place's rows before re-running ---------------
// Operational cleanup, not pipeline data — uses wrangler d1 execute.
if (RESET) {
  const pid = spec.place.id
  const sql = [
    `DELETE FROM votes WHERE signal_id IN (SELECT id FROM signals WHERE place_id='${pid}')`,
    `DELETE FROM gates WHERE signal_id IN (SELECT id FROM signals WHERE place_id='${pid}')`,
    `DELETE FROM sip_evidence WHERE sip_id IN (SELECT id FROM sips WHERE place_id='${pid}')`,
    `DELETE FROM intervention_signals WHERE intervention_id IN (SELECT id FROM interventions WHERE place_id='${pid}')`,
    `DELETE FROM claims WHERE place_id='${pid}'`,
    `DELETE FROM stories WHERE place_id='${pid}'`,
    `DELETE FROM signals WHERE place_id='${pid}'`,
    `DELETE FROM participants WHERE place_id='${pid}'`,
    `DELETE FROM interventions WHERE place_id='${pid}'`,
    `DELETE FROM sips WHERE place_id='${pid}'`,
    `DELETE FROM publications WHERE place_id='${pid}'`,
    `DELETE FROM places WHERE id='${pid}'`,
  ].join('; ')
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'vse', '--remote', '--command', sql], {
    cwd: join(ROOT, 'engine'),
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? 'ddf0cf5b4491ba59765378877fe8c697' },
    stdio: 'inherit',
  })
  log(`reset ${pid}`)
}

// ---- 2. place + intake (idempotent: skip stories already ingested) ----------
await api('POST', `/api/places/${spec.place.id}`, spec.place, { auth: true })
log(`place upserted: ${spec.place.id}`)

const existing = await api('GET', `/api/stories/${spec.place.id}`, undefined, { auth: true })
  .catch(() => [])
// identical texts are distinct voices — consume matches one-for-one
const pool = new Map()
for (const e of existing.filter((e) => !e.withdrawn))
  pool.set(e.text, [...(pool.get(e.text) ?? []), e.id])
const storyIds = []
let reused = 0
for (const st of spec.stories) {
  const q = pool.get(st.text)
  if (q?.length) { storyIds.push(q.shift()); reused++; continue }
  const r = await api('POST', `/api/places/${spec.place.id}/stories`, {
    teller_role: st.teller_role,
    channel: st.channel ?? 'facilitated',
    text: st.text,
    source: st.source,
  })
  storyIds.push(r.id)
}
log(`${storyIds.length} stories (${reused} already ingested)`)

// ---- 3. extraction ---------------------------------------------------------
// Intake enqueues an extract job per new story — poll until claims stop
// growing, then re-drive any story that still has none (queue jobs can drop
// on AI errors; stories may also legitimately yield zero claims).
const claimCount = async () =>
  (await api('GET', `/api/claims/${spec.place.id}?status=verified`, undefined, { auth: true })).length
let last = -1
let stable = 0
for (let i = 0; i < 30 && stable < 2; i++) {
  await sleep(10000)
  const n = await claimCount()
  if (n === last) stable++
  else { stable = 0; last = n }
}
for (let round = 0; round < 2; round++) {
  const covered = new Set(
    (await api('GET', `/api/claims/${spec.place.id}?status=verified`, undefined, { auth: true }))
      .map((c) => c.story_id),
  )
  const bare = storyIds.filter((id) => !covered.has(id))
  if (!bare.length) break
  log(`re-driving extraction on ${bare.length} claimless stories`)
  for (const id of bare) await api('POST', `/api/extract/${id}`, undefined, { auth: true })
}
log('extraction settled')

let claims = await api('GET', `/api/claims/${spec.place.id}?status=verified`, undefined, { auth: true })

/** spec text → claim ids. Exact first; then containment (the model may
 *  split a story into sub-spans, or copy the whole line — both are
 *  verbatim-faithful, logged for review). Claims already linked to a
 *  signal are excluded — a claim backs exactly one signal. */
const assigned = new Set()
function resolveClaim(text, all = false) {
  const open = all ? claims : claims.filter((c) => !assigned.has(c.id))
  const exact = open.filter((c) => c.text === text).map((c) => c.id)
  if (exact.length) return { ids: exact, how: 'exact' }
  const inclusions = open
    .filter((c) => text.includes(c.text) || c.text.includes(text))
    .map((c) => c.id)
  return inclusions.length ? { ids: inclusions, how: 'containment' } : { ids: [], how: 'missing' }
}

// Re-drive extraction for stories owning unmatched spec claims (extraction
// is nondeterministic — a bounded retry often lands the span).
const specClaims = [...new Set(spec.signals.flatMap((s) => s.claim_texts))]
for (let round = 0; round < 3; round++) {
  const missing = specClaims.filter((t) => resolveClaim(t).how === 'missing')
  if (!missing.length) break
  const owners = new Set(
    claims
      .filter((c) => missing.some((t) => c.text.includes(t) || t.includes(c.text)))
      .map((c) => c.story_id),
  )
  const storyTextOwner = (await api('GET', `/api/stories/${spec.place.id}`, undefined, { auth: true }))
    .filter((s) => missing.some((t) => s.text.includes(t)))
    .map((s) => s.id)
  for (const sid of storyTextOwner) owners.add(sid)
  if (!owners.size) break
  log(`re-extracting ${owners.size} stories for unmatched spec claims`)
  for (const id of owners) await api('POST', `/api/extract/${id}`, undefined, { auth: true })
  claims = await api('GET', `/api/claims/${spec.place.id}?status=verified`, undefined, { auth: true })
}

const quar = await api('GET', `/api/claims/${spec.place.id}?status=quarantined`, undefined, { auth: true })
log(`${claims.length} verified claims · ${quar.length} quarantined`)
for (const q of quar.slice(0, 8)) log(`  quarantined: ${q.text.slice(0, 70)}`)

// ---- 4. consolidation (observed, then analyst decides) ----------------------
const { clusters } = await api('POST', `/api/consolidate/${spec.place.id}`, undefined, { auth: true })
log(`${clusters.length} proposed clusters (sizes: ${clusters.map((c) => c.centroidSize).join(', ') || 'none'})`)

// ---- 5. signals -------------------------------------------------------------
const signalIds = {}
for (const s of spec.signals) {
  const claimIds = [...new Set(s.claim_texts.flatMap((t) => {
    const { ids, how } = resolveClaim(t)
    if (!ids.length) fail(`spec signal ${s.key}: claim text never extracted verbatim: ${t.slice(0, 70)}`)
    if (how === 'containment') log(`  ${s.key}: "${t.slice(0, 50)}" resolved by containment (${ids.length} claim(s))`)
    return ids
  }))]
  // optional texts attach when the model happened to emit them —
  // nondeterministic sub-spans must not gate the run
  for (const t of s.claim_texts_optional ?? []) {
    const { ids } = resolveClaim(t)
    if (ids.length) { claimIds.push(...ids); log(`  ${s.key}: optional "${t.slice(0, 50)}" attached`) }
  }
  for (const id of claimIds) assigned.add(id)
  const r = await api('POST', `/api/places/${spec.place.id}/signals`, {
    statement: s.statement,
    claim_ids: claimIds,
  }, { auth: true })
  signalIds[s.key] = r.id
}
log(`${Object.keys(signalIds).length} signals confirmed`)

// ---- 6. people check --------------------------------------------------------
const participants = []
for (let i = 0; i < (spec.participants ?? 8); i++) {
  const r = await api('POST', `/api/check/session?place=${spec.place.id}`)
  participants.push(r.participant)
}
for (const [key, votes] of Object.entries(spec.votes ?? {})) {
  for (const [i, vote] of votes.entries()) {
    if (!vote) continue
    await api('POST', `/api/check/signals/${signalIds[key]}/vote`, {
      participant: participants[i],
      vote,
      amendment: vote === 'amend' ? spec.amendments?.[key] : undefined,
    })
  }
}
for (const [key, gate] of Object.entries(spec.gates ?? {})) {
  await api('POST', `/api/check/signals/${signalIds[key]}/gate`, { gate, set_by: spec.place.id + ' session' })
}
log(`check: ${participants.length} participants, votes + gates recorded`)

// ---- 7. interventions + sips ------------------------------------------------
for (const iv of spec.interventions ?? []) {
  await api('POST', `/api/places/${spec.place.id}/interventions`, {
    view: iv.view,
    name: iv.name,
    note: iv.note ?? '',
    signal_ids: (iv.signals ?? []).map((k) => signalIds[k]),
    counter_signal_ids: (iv.counter ?? []).map((k) => signalIds[k]),
    priced: !!iv.priced,
  }, { auth: true })
}
const sipIds = {}
for (const sp of spec.sips ?? []) {
  const evidence = (sp.evidence_signals ?? []).flatMap((k) =>
    spec.signals.find((s) => s.key === k).claim_texts.flatMap((t) => resolveClaim(t, true).ids),
  )
  const r = await api('POST', `/api/places/${spec.place.id}/sips`, {
    kind: sp.kind, title: sp.title, what_changes: sp.what_changes,
    time_to_show: sp.time_to_show, evidence_claim_ids: evidence,
  }, { auth: true })
  sipIds[sp.title] = r.id
}
log(`${(spec.interventions ?? []).length} interventions · ${(spec.sips ?? []).length} sips`)

// ---- 8. publish + fetch + validate ------------------------------------------
const pub = await api('POST', `/api/publish/${spec.place.id}`, undefined, { auth: true })
log(`published ${pub.version} sha ${pub.manifest_sha256.slice(0, 16)}… → ${pub.r2_key}`)

const { results } = await api('GET', `/api/published/${spec.place.id}`)
log(`artifact: ${results.stories.length} stories · ${results.claims.length} claims · ${results.signals.length} signals · ${results.sips.length} sips`)

if (WRITE) {
  const out1 = join(ROOT, 'data', `${spec.place.id}_results.json`)
  const out2 = join(ROOT, 'site/public/data', `${spec.place.id}_results.json`)
  const body = JSON.stringify(results, null, 2)
  writeFileSync(out1, body)
  writeFileSync(out2, body)
  console.log(execFileSync('node', [join(ROOT, 'tools/validate-results.mjs'), out1], { encoding: 'utf8' }))
  log(`wrote ${out1}`)
} else {
  log('dry run — pass --write to save the artifact to data/ + site/public/data/')
}
