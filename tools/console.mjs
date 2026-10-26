#!/usr/bin/env node
// console.mjs — thin analyst console over the engine's bearer API (FR-E12/E14).
// The pipeline does the heavy work; this is the human review loop:
// quarantined claims, cluster confirmation, gates, failures, publish.
//
//   node tools/console.mjs <command> [args]
//
//   stories   <place>                          list stories
//   claims    <place> [--status <s>]           list claims (default: quarantined)
//   span      <story-id> <verbatim text>       analyst-specified span → verified claim
//   clusters  <place>                          run consolidation → candidate clusters
//   signal    <place> <statement> <claim-id…>  confirm a signal from claims
//   tally     <place>                          people-check tally per signal
//   gate      <signal-id> <gate>               set gate (may_be_priced|commons_only|not_yet)
//   failures                                 pipeline jobs that exhausted retries
//   publish   <place> [--springforth]          publish a results artifact
//
// Env: VSE_BASE (default https://vse-engine.delta-git.workers.dev)
//      VSE_ANALYST_KEY or --key-file <path>  (e.g. .vse-analyst-key)

import { readFileSync } from 'node:fs'

const BASE = process.env.VSE_BASE ?? 'https://vse-engine.delta-git.workers.dev'
const raw = process.argv.slice(2)
const kf = raw.indexOf('--key-file')
const KEY =
  process.env.VSE_ANALYST_KEY ??
  (kf > -1 ? readFileSync(raw[kf + 1], 'utf8').trim() : null)

// args minus the --key-file pair
const args = raw.filter((_, i) => i !== kf && i !== kf + 1)
const cmd = args[0]
const rest = args.slice(1).filter((a) => !a.startsWith('--'))
const flag = (n) => args.includes(n)

async function api(path, { method = 'GET', body, public: pub = false } = {}) {
  const headers = { 'content-type': 'application/json' }
  if (!pub && KEY) headers.authorization = `Bearer ${KEY}`
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    console.error(`✗ ${res.status} ${path}:`, typeof data === 'string' ? data : JSON.stringify(data))
    process.exit(1)
  }
  return data
}

const out = (x) => console.log(JSON.stringify(x, null, 2))

switch (cmd) {
  case 'stories':
    out(await api(`/stories/${rest[0]}`))
    break
  case 'claims': {
    const status = rest[1] ?? 'quarantined'
    out(await api(`/claims/${rest[0]}?status=${status}`))
    break
  }
  case 'span': {
    const [storyId, ...words] = rest
    out(await api('/claims/span', { method: 'POST', body: { story_id: storyId, text: words.join(' ') } }))
    break
  }
  case 'clusters':
    out(await api(`/consolidate/${rest[0]}`, { method: 'POST' }))
    break
  case 'signal': {
    const [place, statement, ...claimIds] = rest
    out(await api(`/places/${place}/signals`, { method: 'POST', body: { statement, claim_ids: claimIds } }))
    break
  }
  case 'tally':
    out(await api(`/check/${rest[0]}`, { public: true }))
    break
  case 'gate':
    out(await api(`/check/signals/${rest[0]}/gate`, { method: 'POST', body: { gate: rest[1] } }))
    break
  case 'failures':
    out(await api('/pipeline/failures'))
    break
  case 'publish':
    out(await api(`/publish/${rest[0]}${flag('--springforth') ? '?springforth=1' : ''}`, { method: 'POST' }))
    break
  default:
    console.log(`usage: console.mjs <stories|claims|span|clusters|signal|tally|gate|failures|publish> [args]
  (see file header for full command list)`)
    process.exit(cmd ? 1 : 0)
}
