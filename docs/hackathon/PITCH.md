# VSE — pitch (Sustainable Finance Live 2026, PS1)

Live: **https://vse-demonstrator.pages.dev** · engine:
`https://vse-engine.delta-git.workers.dev` (`/health`) · repo:
github.com/TerexitariusStomp/vse (Apache-2.0)

## The problem

Place-based investment hears consultants, not the place. Funders get pitch
decks and synthesised PDFs; the people who live there get surveyed,
aggregated, and forgotten. Every fund wants its own bid — flood, school,
housing, farm each proved separately — so nobody funds the joining up. One
of our demonstrator places carries a town councillor who spent £60k on
consultants and still couldn't fund a joined-up scheme.

## The system

**A system that helps a whole place say what it needs, in a form that can
guide capital to where it is most needed, without first reducing it to a
price.**

1. **Listen** — people tell stories in their own words, on channels they
   already use: WhatsApp, voice note, web form, facilitated session —
   Welsh included.
2. **Keep the exact words** — the engine proposes excerpts; a mechanical
   gate keeps only verbatim spans:
   `story.text.slice(span[0], span[1]) === claim.text`. Paraphrases are
   quarantined, never shipped.
3. **Consolidate** — excerpts cluster into a handful of clear *signals*
   ("The beck and the marsh need hands, reeds and a scheme").
4. **People check** — the tellers endorse, amend, or contest each signal
   *before* anything guides capital. Constitutional gate, not a feature
   flag.
5. **Structure capital** — the same verified signals rendered two ways:
   siloed plans vs place-derived multi-need interventions, with
   System Intervention Points (thresholds/nodes/windows) marked. Signals
   gated `commons_only` are **structurally unpriceable** — a database
   trigger plus a publish-time hard fail (409) make them unpriceable, not
   merely labelled.
6. **Publish** — a versioned, schema-validated, hash-manifested results
   file anyone can re-render or re-verify with independent code.

## Why it wins PS1

- **The invariant nobody else ships:** verbatim-span lineage, enforced
  mechanically at extraction, at publish, and by a standalone validator —
  not a convention. Every signal traces to the exact quoted sentence in
  under 10 seconds.
- **Deployed, not mocked.** The engine ran end-to-end on Cloudflare
  (Workers + D1 + Queue + R2 + Workers AI) for all ten shipped places;
  `GET /api/published/<place>` serves each artifact from R2.
- **The gate works — we have the receipts.** Smaller instruct models
  (7B/8B tier) reliably *elaborate* short fragments instead of copying
  them; the span check quarantined every such proposal. A live check
  confirmed a `priced` intervention backed by a `commons_only` signal is
  rejected with HTTP 409.
- **Real runs on ten places** — 191 stories · 283 verbatim excerpts ·
  60 signals · 51 interventions: five places built from real field
  records (Sarafu vouchers, county plans, hub records, Treegens planting
  records), four from clearly-attributed public social posts, one labelled
  fictional place (Utopia) carrying generated voice audio.
- **Open artifact contract** — JSON Schema + semantic invariants; the
  demonstrator is a pure static reader (offline PWA, zero backend calls,
  <2% custom code over the OSS stack). A third party needs only the
  schema and the validator to re-verify everything we publish.

## Value in money terms — the treasurer's three frames

- **Risk** — each place's official record sits beside its voice:
  Thorntree renders IMD-2025 decile 1 (score 66.9, rank 461 of 33,755) and
  34 EA flood-risk areas within 15km on the same card as the residents'
  sentences. What's at stake is on the card, not in a slide.
- **Cost** — `from_plans` interventions carry real budgets from the plan
  documents they quote (CVL/council plans, county actions); the cost of
  the ask is verbatim text, not an estimate.
- **Value creation** — the two-way mirror makes joining-up measurable:
  `from_plans` answers ~1.0 needs per intervention; `from_place` answers
  several (Utopia: 3.0). SIPs name the leverage points — thresholds,
  nodes, windows — each carrying its own evidence excerpts
  (IPTiP-anchored, PRD §3).

Everything is labelled: verbatim quote, recorded participation, or
official reading — nothing invented. `commons_only` signals stay in the
commons by construction: the value that can't be priced is protected as a
category, not rounded to zero.

## How we score against the published criteria

| Criterion (verbatim, slide 38) | Where it shows |
|---|---|
| Demo | `DEMO-SCRIPT.md` nine legs on the live site; `demo-assets/` numbered screenshots + `walkthrough.mp4` |
| Business Idea | `BMC.md` — the `/thorntree#capital` two-view toggle *is* the pitch: joining-up made legible to capital |
| Technical Implementation | `ARCHITECTURE.md`; deployed engine; two-layer validator; span gate; 409-enforced commons gate; PWA reader |
| Use of Datasets | `DATA-SOURCES.md` — Springforth-consumed field records (Sarafu, OnePlanet/CSV plans, Treegens, IMD-2025, EA Flood) + public bsky/nostr/hive posts with click-through provenance |
| Presentation | `PITCH-LIVE.md` 8-min script; landing "follow one sentence" thread; per-place 3D dioramas + generated voices |
| Feasibility | live now — `curl` the site and `/health`; every published file passes `npm run validate` |
| Scalability | queue-driven pipeline (~60–90s/place); the results-file contract means new places ship as data, not code |
| Impact potential | verified place voice → capital allocation; commons gate protects relational value (IPBES: only ~6% of valuation studies even address it) |

Deliverables: **BMC** (`BMC.md`) · **logical architecture**
(`ARCHITECTURE.md` + `demo-assets/architecture.svg`) · **clickable demo**
(live + `demo-assets/walkthrough.mp4`).

## The demo journey — Thorntree + nine more places

- **Thorntree**, a council estate in east Middlesbrough: hub records,
  a Sarafu tool-library voucher, council plan documents, IMD decile 1,
  and 8 attributed public posts — one place heard two ways.
- **Kenya coast · Mida Creek · Hebden Bridge · Dar es Salaam** — real
  field records: Sarafu voucher commitments (the ROLA pool: 141 vouchers,
  1,640 swaps), a 1,200-propagule mangrove nursery, a mutual-aid flood
  prep day, app-verified vs pre-app planting claims where the biggest
  numbers are the least verified.
- **Puerto la Cruz · Minneapolis · Nairobi · Detroit** — places founded
  entirely on public social posts; every story links back to the original
  post, attributed to channel, never to a person.
- **Utopia** — the labelled fictional reference place: 8 tellers, 49
  excerpts, generated voice audio on every diorama figure, including a
  story told in Welsh.

## Numbers

10 places · 191 stories · 283 verbatim excerpts · 60 signals ·
51 interventions · ~7,150 LOC authored vs ≥400k deployed OSS (<2%) ·
Apache-2.0 · zero third-party requests on the demonstrator.
