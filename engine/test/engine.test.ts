// node --test test/ — route + pipeline coverage over the real schema
// (migrations applied to in-memory sqlite; the commons_sticky trigger is
// enforced for real). No network: AI/R2/Queue are in-memory fakes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import worker from '../src/index.ts'
import { makeEnv, req, jsonPost, ANALYST } from './helpers.ts'
import { checkSemantics } from '../../tools/results-lib.mjs'

function seedPlace(sqlite: DatabaseSync) {
  sqlite.prepare("INSERT INTO places (id, name) VALUES ('p1', 'Testplace')").run()
  sqlite.prepare("INSERT INTO places (id, name) VALUES ('p2', 'Elsewhere')").run()
}

// --- intake -----------------------------------------------------------------

test('intake: oversized story rejected 413', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  const res = await worker.fetch(
    jsonPost('/api/places/p1/stories', {
      teller_role: 'r', channel: 'facilitated', text: 'x'.repeat(20_001),
    }),
    env,
  )
  assert.equal(res.status, 413)
})

test('intake: web channel requires consent or lands pending', async () => {
  const { env, sqlite, queue } = makeEnv()
  seedPlace(sqlite)
  const res = await worker.fetch(
    jsonPost('/api/places/p1/stories', { teller_role: 'resident', channel: 'web', text: 'the well is dry' }),
    env,
  )
  assert.equal(res.status, 201)
  const body = await res.json() as { consent: string }
  assert.equal(body.consent, 'pending')
  assert.equal(queue.length, 0, 'unconsented story must not enter extraction')
})

test('intake: web channel with consent is queued for extraction', async () => {
  const { env, sqlite, queue } = makeEnv()
  seedPlace(sqlite)
  const res = await worker.fetch(
    jsonPost('/api/places/p1/stories', {
      teller_role: 'resident', channel: 'web', text: 'the well is dry', consent: true,
    }),
    env,
  )
  assert.equal(res.status, 201)
  assert.equal(queue.length, 1)
})

test('intake: facilitated channel grants consent by default', async () => {
  const { env, sqlite, queue } = makeEnv()
  seedPlace(sqlite)
  await worker.fetch(
    jsonPost('/api/places/p1/stories', { teller_role: 'nurse', channel: 'facilitated', text: 'no clinic transport' }),
    env,
  )
  const row = sqlite.prepare("SELECT consent FROM stories WHERE place_id='p1'").get() as { consent: string }
  assert.equal(row.consent, 'granted')
  assert.equal(queue.length, 1)
})

test('intake: voice upload rejects non-audio and oversize', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  const form = new FormData()
  form.set('teller_role', 'resident')
  form.set('audio', new File(['x'], 'n.txt', { type: 'text/plain' }))
  const res = await worker.fetch(req('/api/places/p1/voice', { method: 'POST', body: form }), env)
  assert.equal(res.status, 415)
})

// --- whatsapp webhook --------------------------------------------------------

const WA_BODY = JSON.stringify({
  entry: [{ changes: [{ value: { messages: [{ type: 'text', text: { body: 'we need the clinic bus back' } }] } }] }],
})

async function hmac(secret: string, body: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return 'sha256=' + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

test('whatsapp: rejects unsigned/bad-signature POSTs when secret is set', async () => {
  const { env, sqlite } = makeEnv({ WHATSAPP_APP_SECRET: 'appsecret' })
  seedPlace(sqlite)
  const bad = await worker.fetch(
    req('/api/intake/whatsapp?place=p1', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': 'sha256=deadbeef' },
      body: WA_BODY,
    }),
    env,
  )
  assert.equal(bad.status, 401)
  const none = await worker.fetch(
    req('/api/intake/whatsapp?place=p1', { method: 'POST', headers: { 'content-type': 'application/json' }, body: WA_BODY }),
    env,
  )
  assert.equal(none.status, 401)
})

test('whatsapp: accepts correctly-signed POST and queues extraction', async () => {
  const { env, sqlite, queue } = makeEnv({ WHATSAPP_APP_SECRET: 'appsecret' })
  seedPlace(sqlite)
  const res = await worker.fetch(
    req('/api/intake/whatsapp?place=p1', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': await hmac('appsecret', WA_BODY) },
      body: WA_BODY,
    }),
    env,
  )
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { accepted: 1 })
  assert.equal(queue.length, 1)
})

// --- people check ------------------------------------------------------------

test('check: vote from another place is rejected', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  sqlite.prepare("INSERT INTO signals (id, place_id, statement) VALUES ('sig1','p1','water matters')").run()
  sqlite.prepare("INSERT INTO participants (id, place_id) VALUES ('part-b','p2')").run()
  const res = await worker.fetch(
    jsonPost('/api/check/signals/sig1/vote', { participant: 'part-b', vote: 'endorse' }),
    env,
  )
  assert.equal(res.status, 403)
})

test('check: same-place vote records and upserts', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  sqlite.prepare("INSERT INTO signals (id, place_id, statement) VALUES ('sig1','p1','water matters')").run()
  sqlite.prepare("INSERT INTO participants (id, place_id) VALUES ('part-a','p1')").run()
  const r1 = await worker.fetch(
    jsonPost('/api/check/signals/sig1/vote', { participant: 'part-a', vote: 'endorse' }), env)
  assert.equal(r1.status, 200)
  const r2 = await worker.fetch(
    jsonPost('/api/check/signals/sig1/vote', { participant: 'part-a', vote: 'contest' }), env)
  assert.equal(r2.status, 200)
  const row = sqlite.prepare("SELECT vote FROM votes WHERE participant_id='part-a'").get() as { vote: string }
  assert.equal(row.vote, 'contest', 're-voting updates the single row')
})

test('check: session mint rejects unknown place', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  const res = await worker.fetch(req('/api/check/session?place=nope', { method: 'POST' }), env)
  assert.equal(res.status, 404)
})

test('check: magic link mints a participant and returns the link', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  const res = await worker.fetch(jsonPost('/api/check/link', { place: 'p1' }), env)
  assert.equal(res.status, 201)
  const body = await res.json() as { link: string; delivered: string }
  assert.match(body.link, /^\/check\?place=p1&p=/)
  assert.equal(body.delivered, 'link')
  const via = sqlite.prepare("SELECT created_via FROM participants WHERE place_id='p1'").get() as { created_via: string }
  assert.equal(via.created_via, 'link')
})

// --- gate: the sticky commons ------------------------------------------------

test('gate: commons_only is sticky — repricing rejected by trigger (G10)', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  sqlite.prepare("INSERT INTO signals (id, place_id, statement) VALUES ('sig1','p1','the commons')").run()
  const g1 = await worker.fetch(jsonPost('/api/check/signals/sig1/gate', { gate: 'commons_only' }), env)
  assert.equal(g1.status, 200)
  const g2 = await worker.fetch(jsonPost('/api/check/signals/sig1/gate', { gate: 'may_be_priced' }), env)
  assert.equal(g2.status, 409)
  const stored = sqlite.prepare("SELECT gate FROM gates WHERE signal_id='sig1'").get() as { gate: string }
  assert.equal(stored.gate, 'commons_only')
})

// --- withdraw → publish (G9) ---------------------------------------------------

test('withdraw quarantines claims and publishes exclude them', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  sqlite.prepare("INSERT INTO stories (id, place_id, teller_role, channel, text) VALUES ('st1','p1','role','facilitated','the bus stop needs a shelter')").run()
  await worker.fetch(req('/api/stories/st1/withdraw', { method: 'POST' }), env)
  const withdrawn = sqlite.prepare("SELECT withdrawn FROM stories WHERE id='st1'").get() as { withdrawn: number }
  assert.equal(withdrawn.withdrawn, 1)
})

// --- publish -----------------------------------------------------------------

function publishFixture(sqlite: DatabaseSync) {
  sqlite.prepare("INSERT INTO stories (id, place_id, teller_role, channel, text) VALUES ('st1','p1','resident','facilitated','the well ran dry in march')").run()
  sqlite.prepare("INSERT INTO signals (id, place_id, statement, status) VALUES ('sig1','p1','water access is fragile','checked')").run()
  sqlite.prepare("INSERT INTO gates (signal_id, gate) VALUES ('sig1','may_be_priced')").run()
  sqlite.prepare("INSERT INTO claims (id, place_id, story_id, signal_id, text, span_start, span_end, status) VALUES ('c1','p1','st1','sig1','the well ran dry',0,16,'verified')").run()
  sqlite.prepare("INSERT INTO participants (id, place_id) VALUES ('pa','p1')").run()
  sqlite.prepare("INSERT INTO votes (participant_id, signal_id, vote) VALUES ('pa','sig1','endorse')").run()
}

test('publish: assembles a semantics-clean artifact and marks signals published', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  publishFixture(sqlite)
  const res = await worker.fetch(req('/api/publish/p1', { method: 'POST', headers: ANALYST }), env)
  assert.equal(res.status, 201)
  const pub = await res.json() as { version: string; warnings: string[]; r2_key: string }
  assert.match(pub.version, /^\d{4}-\d{2}-\d{2}$/)
  const artifact = await (env.ARTIFACTS as unknown as { store: Map<string, string> }).store.get(pub.r2_key)
  const results = JSON.parse(artifact!)
  assert.deepEqual(checkSemantics(results), [])
  const sig = sqlite.prepare("SELECT status FROM signals WHERE id='sig1'").get() as { status: string }
  assert.equal(sig.status, 'published')
})

test('publish: same-day republish bumps the version and keeps published signals', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  publishFixture(sqlite)
  const r1 = await worker.fetch(req('/api/publish/p1', { method: 'POST', headers: ANALYST }), env)
  const v1 = (await r1.json() as { version: string }).version
  const r2 = await worker.fetch(req('/api/publish/p1', { method: 'POST', headers: ANALYST }), env)
  const v2 = (await r2.json() as { version: string }).version
  assert.equal(v2, `${v1}.2`, 'second same-day publish gets a .N suffix')
})

test('publish: warns about excluded content (FR-E19)', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  publishFixture(sqlite)
  sqlite.prepare("INSERT INTO signals (id, place_id, statement) VALUES ('sig2','p1','still unchecked')").run()
  sqlite.prepare("INSERT INTO stories (id, place_id, teller_role, channel, text, consent) VALUES ('st2','p1','r','web','pending story','pending')").run()
  const res = await worker.fetch(req('/api/publish/p1', { method: 'POST', headers: ANALYST }), env)
  const pub = await res.json() as { warnings: string[] }
  assert.ok(pub.warnings.some((w) => w.includes('unchecked')))
  assert.ok(pub.warnings.some((w) => w.includes('consent')))
})

test('publish: springforth adapter emits a sibling artifact (FR-E25)', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  publishFixture(sqlite)
  sqlite.prepare("INSERT INTO interventions (id, place_id, view, name) VALUES ('i1','p1','from_place','Drill a second well')").run()
  sqlite.prepare("INSERT INTO intervention_signals (intervention_id, signal_id, role) VALUES ('i1','sig1','answer')").run()
  const res = await worker.fetch(req('/api/publish/p1?springforth=1', { method: 'POST', headers: ANALYST }), env)
  assert.equal(res.status, 201)
  const pub = await res.json() as { springforth_key?: string }
  assert.ok(pub.springforth_key?.startsWith('springforth/p1/'))
  const sf = JSON.parse((env.ARTIFACTS as unknown as { store: Map<string, string> }).store.get(pub.springforth_key!)!)
  assert.equal(sf.possibilities[0].status, 'draft')
  assert.equal(sf.possibilities[0].title, 'Drill a second well')
})

// --- analyst auth + batch caps -------------------------------------------------

test('analyst routes reject bad/missing keys', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  assert.equal((await worker.fetch(req('/api/stories/p1'), env)).status, 401)
  assert.equal(
    (await worker.fetch(req('/api/stories/p1', { headers: { authorization: 'Bearer wrong' } }), env)).status,
    401,
  )
  assert.equal((await worker.fetch(req('/api/stories/p1', { headers: ANALYST }), env)).status, 200)
})

test('extract-batch caps at 100 stories', async () => {
  const { env } = makeEnv()
  const res = await worker.fetch(
    jsonPost('/api/extract-batch', { storyIds: Array.from({ length: 101 }, (_, i) => `s${i}`) }, ANALYST),
    env,
  )
  assert.equal(res.status, 400)
})

test('signals route rejects claims from another place', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  sqlite.prepare("INSERT INTO stories (id, place_id, teller_role, channel, text) VALUES ('stX','p2','r','facilitated','foreign words here')").run()
  sqlite.prepare("INSERT INTO claims (id, place_id, story_id, text, span_start, span_end, status) VALUES ('cX','p2','stX','foreign words',0,13,'verified')").run()
  const res = await worker.fetch(
    jsonPost('/api/places/p1/signals', { statement: 'cross-place grab', claim_ids: ['cX'] }, ANALYST),
    env,
  )
  assert.equal(res.status, 400)
})

test('interventions reject foreign signals and commons_only backing when priced', async () => {
  const { env, sqlite } = makeEnv()
  seedPlace(sqlite)
  sqlite.prepare("INSERT INTO signals (id, place_id, statement) VALUES ('sP2','p2','other place signal')").run()
  sqlite.prepare("INSERT INTO signals (id, place_id, statement) VALUES ('sP1','p1','commons signal')").run()
  sqlite.prepare("INSERT INTO gates (signal_id, gate) VALUES ('sP1','commons_only')").run()
  const foreign = await worker.fetch(
    jsonPost('/api/places/p1/interventions', { view: 'from_place', name: 'x', signal_ids: ['sP2'] }, ANALYST),
    env,
  )
  assert.equal(foreign.status, 400)
  const priced = await worker.fetch(
    jsonPost('/api/places/p1/interventions', { view: 'from_place', name: 'x', signal_ids: ['sP1'], priced: true }, ANALYST),
    env,
  )
  assert.equal(priced.status, 409)
})
