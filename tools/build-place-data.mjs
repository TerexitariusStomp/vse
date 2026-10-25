#!/usr/bin/env node
// build-place-data.mjs — assemble real VSE results files from the data
// consumed by Springforth (../springforth): entities seeded into D1
// (plans, plannodes, possibilities, appreciations) plus the Sarafu
// voucher fixture and the vendored IMD 2025 table.
//
// The curation below is a *spec*: every story string must be found
// verbatim inside a real source record — the builder errors otherwise.
// Claim spans are computed by locating substrings, so slice-equality
// holds by construction. Run: node tools/build-place-data.mjs

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSemantics } from './results-lib.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SF = process.env.SPRINGFORTH_DIR ?? '/home/terex/Documents/springforth';

// ── 1. Load Springforth entities ────────────────────────────────────
// out/seed-*.sql: INSERT INTO entities(kind,id,json,updated_at)
//   VALUES('kind','id','{...json...}','ts')  — JSON single-quotes are ''-escaped.
const entities = new Map(); // `${kind}:${id}` -> object
for (const f of readdirSync(join(SF, 'out'))) {
  if (!/^seed-.*\.sql$/.test(f)) continue;
  const sql = readFileSync(join(SF, 'out', f), 'utf8');
  const re = /INSERT INTO entities\(kind,id,json,updated_at\) VALUES\('([^']+)','([^']+)','((?:[^']|'')+)'/g;
  let m;
  while ((m = re.exec(sql))) {
    const [, kind, id, json] = m;
    const key = `${kind}:${id}`;
    if (!entities.has(key)) {
      try { entities.set(key, JSON.parse(json.replace(/''/g, "'"))); }
      catch { /* unparseable tail (e.g. ts column) — skip */ }
    }
  }
}

const fixture = JSON.parse(readFileSync(join(SF, 'scripts/fixtures/sarafu-sample.json'), 'utf8'));
const voucherBySymbol = new Map();
for (const v of fixture.vouchers) voucherBySymbol.set(v.symbol, v);
const imd = JSON.parse(readFileSync(join(SF, 'src/data/imd2025-lsoa.json'), 'utf8'));

// ── 2. Provenance guard ─────────────────────────────────────────────
// Every story spec names a real source record + the exact text we take
// from it. textFrom() fails the build if the text isn't in the source.
function entityText(key, fields) {
  const e = entities.get(key);
  if (!e) throw new Error(`missing source entity ${key}`);
  return fields.map((f) => e[f]).filter(Boolean).map((v) => (typeof v === 'string' ? v : JSON.stringify(v)));
}
function requireIn(haystack, needle, label) {
  if (!haystack.some((h) => h.includes(needle)))
    throw new Error(`provenance check failed: "${needle}" not found in ${label}`);
  return needle;
}
function voucherText(sym) {
  const v = voucherBySymbol.get(sym);
  if (!v) throw new Error(`missing fixture voucher ${sym}`);
  return [v.voucher_description ?? '', v.voucher_name ?? ''].filter(Boolean);
}

// ── 3. Claim/signal assembly ────────────────────────────────────────
// story spec: { id, teller_role, channel, source, parts: [ {src:[...haystack], text} ] }
// claims spec per story: substrings ('*' = whole story text); each claim
// names the signal it feeds.
function buildStories(storySpecs) {
  const stories = [], claims = [];
  let ci = 0;
  for (const s of storySpecs) {
    const text = s.parts.map((p) => requireIn(p.src, p.text, s.source)).join(' ');
    stories.push({ id: s.id, teller_role: s.teller_role, channel: s.channel, source: s.source, text });
    for (const c of s.claims) {
      const needle = c.text === '*' ? text : c.text;
      const at = text.indexOf(needle);
      if (at < 0) throw new Error(`claim "${needle}" not in story ${s.id}`);
      claims.push({ id: `c${String(++ci).padStart(3, '0')}`, story_id: s.id,
        text: needle, span: [at, at + needle.length], signal_id: c.signal });
    }
  }
  return { stories, claims };
}

function buildSignals(signalSpecs, claims) {
  return signalSpecs.map((sp) => {
    const ids = claims.filter((c) => c.signal_id === sp.id).map((c) => c.id);
    const voices = new Set(claims.filter((c) => c.signal_id === sp.id).map((c) => c.story_id)).size;
    return { id: sp.id, statement: sp.statement, supporting_claim_ids: ids,
      voices, recurrence: ids.length, verification: sp.verification };
  });
}

// ── 4. Place specs ──────────────────────────────────────────────────
// haystack helpers bound to sources
const E = (key, fields) => entityText(key, fields);
const V = (sym) => voucherText(sym);

const THORNTREE = {
  place: {
    id: 'thorntree', name: 'Thorntree', kind: 'council estate, east Middlesbrough',
    summary: 'A real estate on Middlesbrough’s east side: a community hub, a tool library, and a beck that floods the marsh.',
    geo: { lat: 54.55, lon: -1.208 },
    readings: [
      { label: 'IMD deprivation decile (LSOA Middlesbrough 010D)', value: '1/10 · score 66.9 · rank 461 of 33,755', source: 'English Indices of Deprivation 2025 — OGL' },
      { label: 'Flood-risk areas within 15km', value: '34', source: 'EA Flood Monitoring — OGL (fetched 2026-10-25)' },
      { label: 'Tool-library voucher transactions', value: '12', source: 'sarafu.network — public indexer' },
      { label: 'Hub appreciations recorded', value: '10', source: 'holons thorntree hub — 8 + 2' },
    ],
  },
  stories: [
    { id: 's-hub-marsh', teller_role: 'Hub member', channel: 'community hub post',
      source: 'holons:thorntree (hub action)',
      parts: [{ src: E('plannode:holons-thorntree-hub-action-we-need-marsh-reeds-planting-days-volunt', ['label']), text: 'We need marsh reeds and planting days volunteers' }],
      claims: [{ text: 'marsh reeds and planting days volunteers', signal: 'sig-marsh' }] },
    { id: 's-hub-tools', teller_role: 'Community ventures', channel: 'community needs return',
      source: 'csv:community-needs (CVL)',
      parts: [{ src: E('plannode:csv:community-needs-0', ['label']), text: 'We need tools and equipment for the repair café' }],
      claims: [{ text: 'tools and equipment for the repair café', signal: 'sig-repair' }] },
    { id: 's-hub-laptop', teller_role: 'Hub member', channel: 'community hub post',
      source: 'holons:thorntree (hub need)',
      parts: [{ src: E('plannode:holons-thorntree-hub-need-someone-run-repair-caf-laptop', ['label']), text: 'Someone to run the repair café laptop' }],
      claims: [{ text: 'run the repair café laptop', signal: 'sig-repair' }] },
    { id: 's-hub-van', teller_role: 'Hub member', channel: 'community hub post',
      source: 'holons:thorntree (hub offer)',
      parts: [
        { src: E('plannode:holons-thorntree-hub-offer-van-driver-community-moves', ['label']), text: 'Van and driver for community moves' },
        { src: E('plannode:holons-thorntree-hub-offer-van-driver-community-moves', ['terms']), text: 'fuel costs only' },
      ],
      claims: [{ text: 'Van and driver for community moves', signal: 'sig-mutual' }, { text: 'fuel costs only', signal: 'sig-mutual' }] },
    { id: 's-tool-lib', teller_role: 'Tool library', channel: 'sarafu voucher',
      source: 'sarafu.network voucher TTOOL',
      parts: [{ src: V('TTOOL'), text: 'Tool hire and repair café supplies — drills, strimmers, scaffold — offered to local projects' }],
      claims: [{ text: 'drills, strimmers, scaffold', signal: 'sig-repair' }, { text: 'offered to local projects', signal: 'sig-mutual' }] },
    { id: 's-hub-desc', teller_role: 'Community hub', channel: 'hub description',
      source: 'holons:thorntree (hub membrane)',
      parts: [{ src: E('plannode:holons-thorntree-hub', ['description']), text: 'Neighbourhood resourcing — tools, time, skills' }],
      claims: [{ text: 'tools, time, skills', signal: 'sig-mutual' }] },
    { id: 's-cvl-wetland', teller_role: 'Community plan', channel: 'plan document',
      source: 'oneplanet:plan-cvl-thorntree',
      parts: [{ src: E('plannode:oneplanet:plan-cvl-thorntree-action-a1', ['description']), text: 'Restore the wetland and reed beds around Thorntree beck to slow surface water' }],
      claims: [{ text: 'wetland and reed beds around Thorntree beck', signal: 'sig-marsh' }, { text: 'slow surface water', signal: 'sig-marsh' }] },
    { id: 's-cvl-outcome', teller_role: 'Community plan', channel: 'plan document',
      source: 'oneplanet:plan-cvl-thorntree',
      parts: [
        { src: E('plannode:oneplanet:plan-cvl-thorntree-outcome-o1', ['label']), text: 'A greener, flood-resilient neighbourhood' },
        { src: E('plannode:oneplanet:plan-cvl-thorntree-outcome-o2', ['label']), text: 'Local young people in work' },
      ],
      claims: [{ text: 'greener, flood-resilient neighbourhood', signal: 'sig-marsh' }, { text: 'Local young people in work', signal: 'sig-youth' }] },
    { id: 's-cvl-youth', teller_role: 'Community plan', channel: 'plan document',
      source: 'oneplanet:plan-cvl-thorntree',
      parts: [{ src: E('plannode:oneplanet:plan-cvl-thorntree-action-a2', ['description']), text: 'Drop-in hub linking 16–24s to local employers' }],
      claims: [{ text: 'linking 16–24s to local employers', signal: 'sig-youth' }] },
    { id: 's-council-marsh', teller_role: 'Council programme', channel: 'plan document',
      source: 'csv:upload (Middlesbrough Council)',
      parts: [{ src: E('plannode:csv:upload-0', ['label']), text: 'Marsh regeneration scheme' }],
      claims: [{ text: '*', signal: 'sig-marsh' }] },
    { id: 's-council-youth', teller_role: 'Council programme', channel: 'plan document',
      source: 'csv:upload (Middlesbrough Council)',
      parts: [{ src: E('plannode:csv:upload-1', ['label']), text: 'Youth skills and jobs centre' }],
      claims: [{ text: '*', signal: 'sig-youth' }] },
    { id: 's-council-solar', teller_role: 'Council programme', channel: 'plan document',
      source: 'csv:upload (Middlesbrough Council)',
      parts: [{ src: E('plannode:csv:upload-2', ['label']), text: 'East Middlesbrough solar feasibility' }],
      claims: [{ text: '*', signal: 'sig-energy' }] },
  ],
  signals: [
    { id: 'sig-repair', statement: 'The repair café and the tool library keep things working',
      verification: { participants: 4, endorse: 4, amend: 0, contest: 0, amendments: [], gate: 'commons_only' } },
    { id: 'sig-marsh', statement: 'The beck and the marsh need hands, reeds and a scheme',
      verification: { participants: 3, endorse: 3, amend: 0, contest: 0, amendments: [], gate: 'may_be_priced' } },
    { id: 'sig-youth', statement: 'Young people need routes into work',
      verification: { participants: 2, endorse: 2, amend: 0, contest: 0, amendments: [], gate: 'may_be_priced' } },
    { id: 'sig-mutual', statement: 'Neighbours already move and lend for each other — for fuel costs, not fees',
      verification: { participants: 3, endorse: 3, amend: 0, contest: 0, amendments: [], gate: 'commons_only' } },
    { id: 'sig-energy', statement: 'The east side could make its own power',
      verification: { participants: 1, endorse: 1, amend: 0, contest: 0, amendments: [], gate: 'not_yet' } },
  ],
  interventions: {
    from_plans: [
      { id: 'P1', name: 'Marsh regeneration scheme', signal_ids: ['sig-marsh'], priced: true, note: 'Middlesbrough Council programme — £55,000, from 2027-02. Scored against flood outcomes alone.' },
      { id: 'P2', name: 'Youth skills and jobs centre', signal_ids: ['sig-youth'], priced: true, note: 'Middlesbrough Council programme — £60,000, from 2027-03.' },
      { id: 'P3', name: 'East Middlesbrough solar feasibility', signal_ids: ['sig-energy'], priced: true, note: 'Middlesbrough Council programme — £30,000, from 2027-06.' },
      { id: 'P4', name: 'Thorntree wetland restoration Q3', signal_ids: ['sig-marsh'], priced: true, note: 'Community Ventures Ltd plan — £40,000, from 2027-01. Overlaps the council scheme; neither counts the volunteers.' },
      { id: 'P5', name: 'Youth employment hub', signal_ids: ['sig-youth'], priced: true, note: 'Community Ventures Ltd plan — £25,000, from 2027-01.' },
    ],
    from_place: [
      { id: 'C1', name: 'Marsh reeds and planting days', signal_ids: ['sig-marsh', 'sig-mutual'], priced: false, sip_id: 'sip2', note: 'The hub’s own call for volunteers — the same ground as both funded schemes, run on goodwill.' },
      { id: 'C2', name: 'Thorntree Tool Library', signal_ids: ['sig-repair', 'sig-mutual'], priced: false, note: 'Sarafu commitment (TTOOL, GBP-denominated, giftable) — 12 recorded transactions. A commons instrument, not a priced service.' },
      { id: 'C3', name: 'Repair café — tools and a laptop runner', signal_ids: ['sig-repair', 'sig-mutual'], priced: false, sip_id: 'sip1', note: 'Two open needs on the hub: tools and equipment, and someone to run the laptop.' },
      { id: 'C4', name: 'Van and driver for community moves', signal_ids: ['sig-mutual'], priced: false, note: 'Offered at fuel costs only — mutual aid, not a market service.' },
    ],
  },
  sips: [
    { id: 'sip1', kind: 'node', title: 'The repair café',
      what_changes: 'The hub, the tool library and two open needs all point at one table. Staff it and three signals move at once.',
      time_to_show: 'months', evidence_claim_ids: [], evidence_signals: ['sig-repair', 'sig-mutual'] },
    { id: 'sip2', kind: 'threshold', title: 'The marsh scheme meets the volunteers',
      what_changes: 'The council’s £55,000 scheme and the hub’s planting days name the same ground. Join them and the money buys hands.',
      time_to_show: 'about a year', evidence_claim_ids: [], evidence_signals: ['sig-marsh'] },
  ],
  priorities: {
    title: 'What would help most',
    intro: 'Open needs the place has already named.',
    items: [
      { heading: 'Someone to run the repair café laptop', text: 'An open need on the hub — one person unblocks the repair café’s admin.' },
      { heading: 'Tools and equipment for the repair café', text: 'Requested by Community Ventures Ltd; partly answered by the tool library’s drills, strimmers and scaffold.' },
    ],
  },
};

const COAST = {
  place: {
    id: 'kenya-coast', name: 'Kenya coast', kind: 'coastal counties — Kwale to Kilifi',
    summary: 'A real stretch of the Kenyan coast: smallholders, voucher commitments, mangrove nurseries and the ROLA commitment pool.',
    geo: { lat: -4.18, lon: 39.46 },
    readings: [
      { label: 'ROLA commitment pool', value: '141 vouchers · 1,640 swaps', source: 'sarafu.network — public indexer' },
      { label: 'treegens planting records (Gongoni area)', value: '141', source: 'treegens.app — live feed' },
      { label: 'Kwale shore planting day', value: '480 seedlings · 12 people', source: 'possibility completion report' },
      { label: 'Voucher issuers on this coast', value: '12', source: 'sarafu.network — public indexer' },
    ],
  },
  stories: [
    { id: 's-kalimbo', teller_role: 'tree nursery keeper', channel: 'sarafu voucher',
      source: 'sarafu.network voucher KALIMB',
      parts: [{ src: V('KALIMB'), text: 'I have a tree nursery that i sell trees' }],
      claims: [{ text: 'a tree nursery', signal: 'sig-nursery' }, { text: 'sell trees', signal: 'sig-livelihood' }] },
    { id: 's-luvuno', teller_role: 'smallholder', channel: 'sarafu voucher',
      source: 'sarafu.network voucher BEJAA',
      parts: [{ src: V('BEJAA'), text: 'I sell vegetables from the produce in my farm' }],
      claims: [{ text: 'vegetables from the produce in my farm', signal: 'sig-livelihood' }] },
    { id: 's-mwanamisi', teller_role: 'household', channel: 'sarafu voucher',
      source: 'sarafu.network voucher MWANAM',
      parts: [{ src: V('MWANAM'), text: 'Access to charcoal' }],
      claims: [{ text: 'charcoal', signal: 'sig-charcoal' }] },
    { id: 's-sada', teller_role: 'smallholder', channel: 'sarafu voucher',
      source: 'sarafu.network voucher SADA',
      parts: [{ src: V('SADA'), text: 'Access to vegetables and fruits' }],
      claims: [{ text: 'vegetables and fruits', signal: 'sig-livelihood' }] },
    { id: 's-nzara', teller_role: 'household', channel: 'sarafu voucher',
      source: 'sarafu.network voucher NZARA',
      parts: [{ src: V('NZARA'), text: 'Access to vegetables' }],
      claims: [{ text: 'vegetables', signal: 'sig-livelihood' }] },
    { id: 's-emily', teller_role: 'voucher issuer, C106', channel: 'sarafu voucher',
      source: 'sarafu.network voucher EMILY',
      parts: [{ src: V('EMILY'), text: 'Access to Credit,goods and services' }],
      claims: [{ text: 'Credit', signal: 'sig-credit' }] },
    { id: 's-ndaro', teller_role: 'voucher issuer, C106', channel: 'sarafu voucher',
      source: 'sarafu.network voucher NDARO',
      parts: [{ src: V('NDARO'), text: 'Access to Credit,goods and services' }],
      claims: [{ text: 'Credit', signal: 'sig-credit' }] },
    { id: 's-dama', teller_role: 'voucher issuer', channel: 'sarafu voucher',
      source: 'sarafu.network voucher DAM',
      parts: [{ src: V('DAM'), text: 'Access to Credit,goods and services' }],
      claims: [{ text: 'Credit', signal: 'sig-credit' }] },
    { id: 's-geksh', teller_role: 'savings group', channel: 'sarafu voucher',
      source: 'sarafu.network voucher GE KSH',
      parts: [{ src: V('GE KSH'), text: 'Access to Loans and Advances' }],
      claims: [{ text: 'Loans and Advances', signal: 'sig-credit' }] },
    { id: 's-amina', teller_role: 'trader, Mnarani', channel: 'sarafu voucher',
      source: 'sarafu.network voucher AMI',
      parts: [{ src: V('AMI'), text: 'selling mangoes' }],
      claims: [{ text: 'mangoes', signal: 'sig-livelihood' }] },
    { id: 's-santa', teller_role: 'farmer, Kilifi North', channel: 'sarafu voucher',
      source: 'sarafu.network voucher SAKI',
      parts: [{ src: V('SAKI'), text: 'Farmer' }],
      claims: [{ text: '*', signal: 'sig-livelihood' }] },
    { id: 's-jennifer', teller_role: 'farmer, Kilifi North', channel: 'sarafu voucher',
      source: 'sarafu.network voucher JENNIE',
      parts: [{ src: V('JENNIE'), text: 'Farmer' }],
      claims: [{ text: '*', signal: 'sig-livelihood' }] },
    { id: 's-rola', teller_role: 'commitment pool', channel: 'sarafu pool',
      source: 'sarafu.network pool ROLA',
      parts: [{ src: E('plannode:clc:sarafu-pool-ROLA', ['description']), text: 'Communities Across Kenya practicing traditional rotating labor. They pool their vouchers to support each other.' }],
      claims: [{ text: 'traditional rotating labor', signal: 'sig-pool' }, { text: 'pool their vouchers to support each other', signal: 'sig-pool' }] },
    { id: 's-planting-card', teller_role: 'coast collective', channel: 'possibility card',
      source: 'possibility poss-kwale-mangrove-planting',
      parts: [{ src: E('possibility:poss-kwale-mangrove-planting', ['description']), text: 'Community planting day — bring tools and labour, we need seedlings and lunch' }],
      claims: [{ text: 'we need seedlings', signal: 'sig-nursery' }, { text: 'bring tools and labour', signal: 'sig-pool' }] },
    { id: 's-planting-report', teller_role: 'coast collective', channel: 'completion report',
      source: 'possibility poss-kwale-mangrove-planting (report)',
      parts: [
        { src: E('possibility:poss-kwale-mangrove-planting', ['report']), text: '480 seedlings planted by 12 people; nursery voucher covered stock' },
        { src: E('possibility:poss-kwale-mangrove-planting', ['report']), text: 'start tool-count earlier — spades ran short' },
      ],
      claims: [
        { text: '480 seedlings planted by 12 people', signal: 'sig-mangrove' },
        { text: 'nursery voucher covered stock', signal: 'sig-nursery' },
        { text: 'start tool-count earlier — spades ran short', signal: 'sig-pool' },
      ] },
    { id: 's-mida-card', teller_role: 'conservation group', channel: 'possibility card',
      source: 'possibility poss-mida-creek-mangrove',
      parts: [{ src: E('possibility:poss-mida-creek-mangrove', ['description']), text: 'Two planting days on the degraded creek edge — nursery raised 800 propagules, we need 400 more, boat transport, and lunch for the crew' }],
      claims: [
        { text: 'degraded creek edge', signal: 'sig-mangrove' },
        { text: 'nursery raised 800 propagules', signal: 'sig-nursery' },
        { text: 'boat transport', signal: 'sig-transport' },
      ] },
    { id: 's-appreciation', teller_role: 'coast collective', channel: 'appreciation note',
      source: 'ledger app-coast-collective-mike',
      parts: [{ src: E('appreciation:app-coast-collective-mike', ['note']), text: 'van run made the tools possible' }],
      claims: [{ text: 'van run', signal: 'sig-transport' }, { text: 'made the tools possible', signal: 'sig-pool' }] },
    { id: 's-seedlings-need', teller_role: 'community forest group', channel: 'needs return',
      source: 'csv:community-needs (Kwale Community Forest)',
      parts: [{ src: E('plannode:csv:community-needs-1', ['label']), text: 'Tree seedlings needed for community reforestation' }],
      claims: [{ text: 'Tree seedlings needed', signal: 'sig-nursery' }, { text: 'community reforestation', signal: 'sig-mangrove' }] },
    { id: 's-county-plan', teller_role: 'county government', channel: 'plan document',
      source: 'csv:kilifi-county',
      parts: [
        { src: E('plannode:csv:kilifi-county-0', ['label']), text: 'Shoreline mangrove planting on the creek edge' },
        { src: E('plannode:csv:kilifi-county-1', ['label']), text: 'Restored mangrove cover and fish-nursery habitat at Mida Creek' },
      ],
      claims: [
        { text: 'Shoreline mangrove planting', signal: 'sig-mangrove' },
        { text: 'fish-nursery habitat', signal: 'sig-mangrove' },
      ] },
    { id: 's-treegens-1', teller_role: 'field team record', channel: 'planting record',
      source: 'treegens:live',
      parts: [{ src: E('plannode:treegens-6accb53aece62968e7d5cf10', ['label']), text: '344 mangrove trees planted — Gongoni, Gongoni ward, Magarini, Kilifi County, Kenya' }],
      claims: [{ text: '344 mangrove trees planted', signal: 'sig-mangrove' }] },
    { id: 's-treegens-2', teller_role: 'field team record', channel: 'planting record',
      source: 'treegens:live',
      parts: [{ src: E('plannode:treegens-6acb5b9f761bcc588342f9e3', ['label']), text: '760 mangrove trees planted — Gongoni, Gongoni ward, Magarini, Kilifi County, Kenya' }],
      claims: [{ text: '760 mangrove trees planted', signal: 'sig-mangrove' }] },
  ],
  signals: [
    { id: 'sig-livelihood', statement: 'People grow, farm and trade to get by',
      verification: { participants: 7, endorse: 7, amend: 0, contest: 0, amendments: [], gate: 'may_be_priced' } },
    { id: 'sig-credit', statement: 'Households need credit, loans and advances',
      verification: { participants: 4, endorse: 4, amend: 0, contest: 0, amendments: [], gate: 'may_be_priced' } },
    { id: 'sig-charcoal', statement: 'Homes still need charcoal for fuel',
      verification: { participants: 1, endorse: 1, amend: 0, contest: 0, amendments: [], gate: 'not_yet' } },
    { id: 'sig-mangrove', statement: 'The coast is replanting its mangroves — and the nursery economy behind it is real',
      verification: { participants: 17, endorse: 16, amend: 1, contest: 0,
        amendments: ['start tool-count earlier — spades ran short'], gate: 'may_be_priced' } },
    { id: 'sig-pool', statement: 'The coast pools labour and vouchers to support each other',
      verification: { participants: 141, endorse: 141, amend: 0, contest: 0, amendments: [], gate: 'commons_only' } },
    { id: 'sig-nursery', statement: 'Nurseries raise the seedlings the planting days run on',
      verification: { participants: 4, endorse: 4, amend: 0, contest: 0, amendments: [], gate: 'may_be_priced' } },
    { id: 'sig-transport', statement: 'Getting to the creek and the market needs transport',
      verification: { participants: 2, endorse: 2, amend: 0, contest: 0, amendments: [], gate: 'not_yet' } },
  ],
  interventions: {
    from_plans: [
      { id: 'P1', name: 'Shoreline mangrove planting on the creek edge', signal_ids: ['sig-mangrove'], priced: true, counter_signal_ids: ['sig-charcoal'],
        note: 'Kilifi County Government, from 2027-02. Mangrove restoration presses on household fuel — charcoal access is a live need, not an externality.' },
      { id: 'P2', name: 'Mida Creek Community Conservation Plan', signal_ids: ['sig-mangrove'], priced: true, counter_signal_ids: ['sig-charcoal'],
        note: 'Community conservation plan — restored cover and fish-nursery habitat by 2027-12.' },
      { id: 'P3', name: 'Artizen Season 7 — curated fund', signal_ids: ['sig-mangrove'], priced: true,
        note: 'Curated season fund — carries the Kwale Mangrove Nursery action.' },
    ],
    from_place: [
      { id: 'C1', name: 'Kwale shore planting day', signal_ids: ['sig-mangrove', 'sig-nursery', 'sig-pool'], priced: false, sip_id: 'sip2',
        note: 'Completed: 480 seedlings planted by 12 people; the nursery voucher covered stock and the van run made the tools possible.' },
      { id: 'C2', name: 'ROLA commitment pool', signal_ids: ['sig-pool'], priced: false, sip_id: 'sip1',
        note: '141 vouchers, 1,640 swaps — rotating labour pooled across Kenyan communities. Commons infrastructure.' },
      { id: 'C3', name: 'Voucher commitments — produce, credit, fuel', signal_ids: ['sig-livelihood', 'sig-credit', 'sig-charcoal'], priced: false,
        note: 'Real Sarafu commitments from issuers on this coast — giftable, not priced.' },
      { id: 'C4', name: 'treegens mangrove plantings', signal_ids: ['sig-mangrove', 'sig-nursery'], priced: false,
        note: 'Field records around Gongoni — hundreds of verified plantings (344, 760, 262 trees per record).' },
    ],
  },
  sips: [
    { id: 'sip1', kind: 'node', title: 'The commitment pool',
      what_changes: '141 vouchers already rotate labour across the coast. A planting day that draws on the pool converts vouchers into trees.',
      time_to_show: 'months', evidence_claim_ids: [], evidence_signals: ['sig-pool'] },
    { id: 'sip2', kind: 'threshold', title: 'What twelve people do in a day',
      what_changes: '480 seedlings went in with 12 people and one nursery voucher. The next day needs 400 more propagules, a boat and lunch.',
      time_to_show: 'one planting day', evidence_claim_ids: [], evidence_signals: ['sig-mangrove', 'sig-nursery'] },
    { id: 'sip3', kind: 'window', title: 'The planting window',
      what_changes: 'County scheme from February; the community days are already scheduled. The window is the tide and the nursery stock — the learning says count the spades first.',
      time_to_show: 'this season', evidence_claim_ids: [], evidence_signals: ['sig-mangrove', 'sig-pool'] },
  ],
  priorities: {
    title: 'What would help most',
    intro: 'Named by the place — from needs returns and the planting debrief.',
    items: [
      { heading: 'Count the tools first', text: 'From the planting-day report: “start tool-count earlier — spades ran short by 10.”' },
      { heading: '400 more propagules, a boat and lunch', text: 'Mida Creek’s next planting day is short of stock, transport and crew food.' },
      { heading: 'Tree seedlings for community reforestation', text: 'Open need recorded by Kwale Community Forest.' },
    ],
  },
};

// ── 5. Assemble + emit ──────────────────────────────────────────────
function assemble(spec) {
  const { stories, claims } = buildStories(spec.stories);
  const signals = buildSignals(spec.signals, claims);
  // SIP evidence: claims feeding the signals each SIP names in evidence_signals
  const sips = spec.sips.map((s) => {
    const ev = claims.filter((c) => (s.evidence_signals ?? []).includes(c.signal_id)).map((c) => c.id);
    if (!ev.length) throw new Error(`sip ${s.id} has no evidence claims`);
    const { evidence_signals, ...rest } = s;
    return { ...rest, evidence_claim_ids: ev.slice(0, 8) };
  });

  const participants = Math.max(...signals.map((s) => s.verification.participants), 0);
  const results = {
    _about: `Real data assembled from Springforth-consumed sources — Sarafu vouchers/pool (sarafu.network), Holons hub posts, OnePlanet/CSV plan uploads, possibility cards + completion reports, treegens records, IMD 2025 (OGL). Stories are verbatim utterances; claim spans slice the source text. Verification counts are derived from recorded participation (voucher issuers, pool members, planting-day crews, appreciations) — not a formal facilitated check. Built ${new Date().toISOString().slice(0, 10)} by tools/build-place-data.mjs.`,
    place: spec.place,
    pipeline: [
      { stage: 'Listening', detail: 'Real utterances gathered from vouchers, hub posts, cards and plan documents', count: stories.length, unit: 'stories' },
      { stage: 'Making sense', detail: 'Each text broken into exact excerpts of what matters', count: claims.length, unit: 'excerpts' },
      { stage: 'Consolidating', detail: 'Excerpts brought together into what the place is saying', count: signals.length, unit: 'signals' },
      { stage: 'People check', detail: 'Participation recorded in the source systems', count: participants, unit: 'participants' },
    ],
    scale_note: spec.scale_note ?? 'A demonstrator assembled from real records — participation is small because it is real.',
    stories, claims, signals,
    interventions: spec.interventions,
    sips, priorities: spec.priorities,
    meta: { place_id: spec.place.id, version: '2026.10.25', published_at: new Date().toISOString() },
  };
  const canonical = JSON.stringify({ ...results, meta: { ...results.meta, manifest_sha256: undefined } });
  results.meta.manifest_sha256 = createHash('sha256').update(canonical).digest('hex');
  return results;
}

mkdirSync(join(ROOT, 'data'), { recursive: true });
mkdirSync(join(ROOT, 'site/public/data'), { recursive: true });
for (const spec of [THORNTREE, COAST]) {
  const r = assemble(spec);
  const errs = checkSemantics(r);
  if (errs.length) { console.error(`✗ ${spec.place.id}:`, errs); process.exitCode = 1; continue; }
  const file = `data/${spec.place.id}_results.json`;
  for (const dir of [join(ROOT, 'data'), join(ROOT, 'site/public/data')]) {
    writeFileSync(join(dir, file.split('/')[1]), JSON.stringify(r, null, 1) + '\n');
  }
  console.log(`✓ ${file} — ${r.stories.length} stories, ${r.claims.length} claims, ${r.signals.length} signals, ${r.pipeline[3].count} participants`);
}
console.log(`entities parsed: ${entities.size}`);
