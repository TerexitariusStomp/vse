#!/usr/bin/env node
// run-pipeline.mjs — drive one or more places through the live VSE engine.
//
//   node tools/run-pipeline.mjs spec.json [spec2.json ...] [--write] [--reset]
//                              [--deterministic-only] [--key-file <path>]
//
// A spec carries the curated verbatim stories + the analyst decisions
// (signal groupings, gates, interventions, SIPs). The script:
//   0. LINTS the spec locally — every story ⊆ corpus, every required
//      claim_text ⊆ some story's text. Bad specs fail in ms, not mid-run.
//   1. pushes the place + stories through real API routes (parallel);
//   2. waits adaptively for extraction, batch re-drives claimless/thin
//      stories, then fills unmatched spec claim_texts via deterministic
//      analyst spans (same slice-equality gate — zero model calls);
//   3. consolidates (logged), creates signals, mints participants, casts
//      votes + gates, posts interventions + SIPs (parallel phases);
//   4. publishes, fetches the artifact, --write saves + validates it.
//
// Env: VSE_BASE (default https://vse-engine.delta-git.workers.dev),
//      VSE_ANALYST_KEY or --key-file <path>.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'

const ROOT = resolve(new URL('..', import.meta.url).pathname)
const BASE = process.env.VSE_BASE ?? 'https://vse-engine.delta-git.workers.dev'
const SF = process.env.SPRINGFORTH_DIR ?? join(homedir(), 'Documents/springforth')

// ---- args ------------------------------------------------------------------
const args = process.argv.slice(2)
const specPaths = args.filter((a) => !a.startsWith('--') && a !== args[args.indexOf('--key-file') + 1])
if (!specPaths.length) {
  console.error('usage: run-pipeline.mjs <spec.json> [more.json ...] [--write] [--reset] [--deterministic-only] [--key-file <path>]')
  process.exit(2)
}
const WRITE = args.includes('--write')
const RESET = args.includes('--reset')
const DET_ONLY = args.includes('--deterministic-only')
const keyFileIdx = args.indexOf('--key-file')
const KEY =
  process.env.VSE_ANALYST_KEY ??
  (keyFileIdx > -1 ? readFileSync(args[keyFileIdx + 1], 'utf8').trim() : null)

// ---- helpers ---------------------------------------------------------------
let TAG = ''
const log = (...a) => console.log('▸', TAG, ...a)
const fail = (msg) => {
  console.error('✗', TAG, msg)
  process.exit(1)
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(method, path, body, { auth = false, retries = 2, timeoutMs = 45000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let res
    try {
      res = await fetch(BASE + path, {
        method,
        headers: {
          'content-type': 'application/json',
          ...(auth ? { authorization: `Bearer ${KEY}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (e) {
      if (attempt < retries) { await sleep(1500); continue }
      fail(`${method} ${path} → ${e.name === 'TimeoutError' ? 'timeout' : e.message}`)
    }
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = { raw: text } }
    if (res.ok) return json
    if (attempt < retries && res.status >= 500) { await sleep(1500); continue }
    fail(`${method} ${path} → ${res.status}: ${text.slice(0, 300)}`)
  }
}

/** Run async fns with bounded concurrency. */
async function pool(items, n, fn) {
  const out = []
  for (let i = 0; i < items.length; i += n)
    out.push(...(await Promise.all(items.slice(i, i + n).map(fn))))
  return out
}

// ---- corpus ----------------------------------------------------------------
const CORPUS = (() => {
  const files = []
  const outDir = join(SF, 'out')
  const fixDir = join(SF, 'scripts/fixtures')
  if (existsSync(outDir)) files.push(...readdirSync(outDir).filter((f) => f.endsWith('.sql')).map((f) => join(outDir, f)))
  if (existsSync(fixDir)) files.push(...readdirSync(fixDir).map((f) => join(fixDir, f)))
  return files.map((f) => readFileSync(f, 'utf8')).join('\n')
})()

async function runPlace(specPath) {
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  TAG = `[${spec.place.id}]`
  log(`spec ${specPath}`)

  // ---- 0. lint: everything checkable locally fails before any API call -----
  const corpus = CORPUS + '\n' + (spec.social_exports ?? [])
    .map((p) => (JSON.parse(readFileSync(join(ROOT, p), 'utf8')).candidates ?? []).map((c) => c.text).join('\n'))
    .join('\n')
  if (!corpus.length) fail(`no corpus found under ${SF}`)
  for (const st of spec.stories) {
    const sqlEscaped = st.text.replace(/'/g, "''")
    if (!corpus.includes(st.text) && !corpus.includes(sqlEscaped))
      fail(`story text not verbatim in corpus: ${st.text.slice(0, 80)}`)
  }
  // claim_text → owning spec-story index (exact match first, else substring)
  const claimOwner = (t) => {
    const i = spec.stories.findIndex((s) => s.text === t)
    return i >= 0 ? i : spec.stories.findIndex((s) => s.text.includes(t))
  }
  for (const s of spec.signals) {
    for (const t of s.claim_texts)
      if (claimOwner(t) < 0) fail(`signal ${s.key}: claim_text not verbatim in any spec story: ${t.slice(0, 70)}`)
    for (const t of s.claim_texts_optional ?? [])
      if (claimOwner(t) < 0) log(`  ${s.key}: optional claim_text not in any story — skipped: ${t.slice(0, 60)}`)
  }
  log(`${spec.stories.length} stories + ${spec.signals.length} signals lint-clean`)

  // ---- reset ---------------------------------------------------------------
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
    try {
      execFileSync('npx', ['wrangler', 'd1', 'execute', 'vse', '--remote', '--command', sql], {
        cwd: join(ROOT, 'engine'),
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ?? 'ddf0cf5b4491ba59765378877fe8c697' },
        stdio: 'pipe',
      })
    } catch (e) {
      fail(`reset failed: ${e.stdout?.toString().slice(-400) ?? e.message}`)
    }
    log(`reset ${pid}`)
  }

  // ---- 1. place + intake (parallel; already-ingested texts reuse) ----------
  await api('POST', `/api/places/${spec.place.id}`, spec.place, { auth: true })
  const existing = await api('GET', `/api/stories/${spec.place.id}`, undefined, { auth: true }).catch(() => [])
  const byText = new Map()
  for (const e of existing.filter((e) => !e.withdrawn))
    byText.set(e.text, [...(byText.get(e.text) ?? []), e.id])
  // Reserve existing ids; POST only what's new (intake dedups anyway).
  const storyIds = await pool(spec.stories, 8, async (st) => {
    const q = byText.get(st.text)
    if (q?.length) return q.shift()
    const r = await api('POST', `/api/places/${spec.place.id}/stories`, {
      teller_role: st.teller_role,
      channel: st.channel ?? 'facilitated',
      text: st.text,
      source: st.source,
    })
    return r.id
  })
  log(`${storyIds.length} stories (${existing.length ? 'reused prior rows' : 'ingested'})`)

  // ---- 2. extraction ---------------------------------------------------------
  const getClaims = () => api('GET', `/api/claims/${spec.place.id}?status=verified`, undefined, { auth: true })
  let claims = []

  if (!DET_ONLY) {
    // Adaptive settle: poll every 2s; done when every story has ≥1 claim or
    // the count is stable for 3 polls (≥8s minimum, 90s cap).
    let last = -1, stable = 0
    for (let i = 0; i < 45; i++) {
      await sleep(2000)
      claims = await getClaims()
      const covered = new Set(claims.map((c) => c.story_id))
      if (storyIds.every((id) => covered.has(id))) break
      if (claims.length === last) { if (++stable >= 3 && i >= 3) break }
      else { stable = 0; last = claims.length }
    }
    // One batched re-drive: claimless stories + thin-only stories
    // (every claim <20 chars — e.g. "I'm upset" from a fuller story).
    const byStory = new Map()
    for (const c of claims) byStory.set(c.story_id, [...(byStory.get(c.story_id) ?? []), c])
    const redrive = storyIds.filter((id) => {
      const cs = byStory.get(id) ?? []
      return !cs.length || cs.every((c) => c.text.length < 20)
    })
    if (redrive.length) {
      log(`batch re-driving ${redrive.length} claimless/thin stories`)
      await api('POST', `/api/extract-batch`, { storyIds: redrive }, { auth: true, timeoutMs: 120000 })
      claims = await getClaims()
    }
  }

  // Deterministic fill: spec claim_texts that extraction never emitted get
  // inserted as analyst spans — identical slice-equality gate, no model.
  function resolveClaim(text, all = false, assigned = new Set()) {
    const open = all ? claims : claims.filter((c) => !assigned.has(c.id))
    const exact = open.filter((c) => c.text === text).map((c) => c.id)
    if (exact.length) return { ids: exact, how: 'exact' }
    const inclusions = open
      .filter((c) => text.includes(c.text) || c.text.includes(text))
      .map((c) => c.id)
    return inclusions.length ? { ids: inclusions, how: 'containment' } : { ids: [], how: 'missing' }
  }

  const specTexts = [...new Set(spec.signals.flatMap((s) => [...s.claim_texts, ...(s.claim_texts_optional ?? [])]))]
  const unmatched = specTexts.filter((t) => resolveClaim(t).how === 'missing')
  if (unmatched.length) {
    const fills = await Promise.all(unmatched.map((t) => {
      const i = claimOwner(t)
      return i >= 0
        ? api('POST', '/api/claims/span', { story_id: storyIds[i], text: t }, { auth: true }).then(() => ({ t, ok: true }))
        : { t, ok: false }
    }))
    const still = fills.filter((f) => !f.ok).map((f) => f.t)
    if (still.length) fail(`spec claims unowned by any story: ${still[0].slice(0, 70)}`)
    claims = await getClaims()
    log(`${unmatched.length} spec claims filled via analyst spans (proposer='analyst')`)
  }

  const quar = await api('GET', `/api/claims/${spec.place.id}?status=quarantined`, undefined, { auth: true })
  log(`${claims.length} verified claims · ${quar.length} quarantined`)

  // ---- 3. consolidation (observed, then analyst decides) -------------------
  const { clusters } = await api('POST', `/api/consolidate/${spec.place.id}`, undefined, { auth: true, timeoutMs: 120000 })
  log(`${clusters.length} proposed clusters (sizes: ${clusters.map((c) => c.centroidSize).join(', ') || 'none'})`)

  // ---- 4. signals ------------------------------------------------------------
  const assigned = new Set()
  const signalPayloads = spec.signals.map((s) => {
    const claimIds = [...new Set(s.claim_texts.flatMap((t) => {
      const { ids, how } = resolveClaim(t, false, assigned)
      if (!ids.length) fail(`spec signal ${s.key}: claim text never resolved verbatim: ${t.slice(0, 70)}`)
      if (how === 'containment') log(`  ${s.key}: "${t.slice(0, 50)}" resolved by containment (${ids.length})`)
      return ids
    }))]
    for (const t of s.claim_texts_optional ?? []) {
      const { ids } = resolveClaim(t, false, assigned)
      if (ids.length) { claimIds.push(...ids); log(`  ${s.key}: optional "${t.slice(0, 50)}" attached`) }
    }
    for (const id of claimIds) assigned.add(id)
    return { s, claimIds }
  })
  const signalIds = {}
  await Promise.all(signalPayloads.map(async ({ s, claimIds }) => {
    const r = await api('POST', `/api/places/${spec.place.id}/signals`, {
      statement: s.statement, claim_ids: claimIds,
    }, { auth: true })
    signalIds[s.key] = r.id
  }))
  log(`${Object.keys(signalIds).length} signals confirmed`)

  // ---- 5. people check (parallel) --------------------------------------------
  // Mint enough tokens for the longest votes array — votes are indexed by
  // participant position, so a spec with more vote slots than participants
  // would otherwise send undefined.
  const nParticipants = Math.max(
    spec.participants ?? 8,
    ...Object.values(spec.votes ?? {}).map((v) => v.length),
  )
  const participants = await Promise.all(
    Array.from({ length: nParticipants }, () =>
      api('POST', `/api/check/session?place=${spec.place.id}`).then((r) => r.participant)),
  )
  const voteCalls = []
  for (const [key, votes] of Object.entries(spec.votes ?? {})) {
    for (const [i, vote] of votes.entries()) {
      if (!vote) continue
      voteCalls.push(api('POST', `/api/check/signals/${signalIds[key]}/vote`, {
        participant: participants[i],
        vote,
        amendment: vote === 'amend' ? spec.amendments?.[key] : undefined,
      }))
    }
  }
  const gateCalls = Object.entries(spec.gates ?? {}).map(([key, gate]) =>
    api('POST', `/api/check/signals/${signalIds[key]}/gate`, { gate, set_by: spec.place.id + ' session' }))
  await Promise.all([...voteCalls, ...gateCalls])
  log(`check: ${participants.length} participants, ${voteCalls.length} votes, ${gateCalls.length} gates`)

  // ---- 6. interventions + sips (parallel) -------------------------------------
  const ivCalls = (spec.interventions ?? []).map((iv) =>
    api('POST', `/api/places/${spec.place.id}/interventions`, {
      view: iv.view,
      name: iv.name,
      note: iv.note ?? '',
      signal_ids: (iv.signals ?? []).map((k) => signalIds[k]),
      counter_signal_ids: (iv.counter ?? []).map((k) => signalIds[k]),
      priced: !!iv.priced,
    }, { auth: true }))
  const sipCalls = (spec.sips ?? []).map((sp) => {
    const evidence = (sp.evidence_signals ?? []).flatMap((k) =>
      spec.signals.find((s) => s.key === k).claim_texts.flatMap((t) => resolveClaim(t, true).ids),
    )
    return api('POST', `/api/places/${spec.place.id}/sips`, {
      kind: sp.kind, title: sp.title, what_changes: sp.what_changes,
      time_to_show: sp.time_to_show, evidence_claim_ids: evidence,
    }, { auth: true })
  })
  await Promise.all([...ivCalls, ...sipCalls])
  log(`${ivCalls.length} interventions · ${sipCalls.length} sips`)

  // ---- 7. publish + fetch + validate ------------------------------------------
  const pub = await api('POST', `/api/publish/${spec.place.id}`, undefined, { auth: true, timeoutMs: 120000 })
  log(`published ${pub.version} sha ${pub.manifest_sha256.slice(0, 16)}… → ${pub.r2_key}`)

  const { results } = await api('GET', `/api/published/${spec.place.id}`)
  log(`artifact: ${results.stories.length} stories · ${results.claims.length} claims · ${results.signals.length} signals · ${results.sips.length} sips`)

  if (WRITE) {
    const out1 = join(ROOT, 'data', `${spec.place.id}_results.json`)
    const out2 = join(ROOT, 'site/public/data', `${spec.place.id}_results.json`)
    const body = JSON.stringify(results, null, 2)
    mkdirSync(join(ROOT, 'data'), { recursive: true })
    writeFileSync(out1, body)
    writeFileSync(out2, body)
    console.log(execFileSync('node', [join(ROOT, 'tools/validate-results.mjs'), out1], { encoding: 'utf8' }))
    log(`wrote ${out1}`)
  } else {
    log('dry run — pass --write to save the artifact to data/ + site/public/data/')
  }
}

// Sequential per place by default (logs stay readable); places are
// independent so run multiple specs on multiple shells for parallelism.
for (const p of specPaths) await runPlace(p)
