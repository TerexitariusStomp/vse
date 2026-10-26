# Reviewer's guide — VSE (Value Structuring Engine)

Live: **https://vse-demonstrator.pages.dev** — everything below is live,
no login, works offline after first load (PWA). Engine:
`https://vse-engine.delta-git.workers.dev` (`GET /health`).
Two paths: 3 minutes or 8 minutes.

## 3-minute path

1. **`/`** — landing: "Every place knows what it needs", the globe of ten
   places, the four-step strip (stories → exact words kept → the place
   checks → it guides decisions), and the *follow one sentence* thread.
   (Presentation)
2. **`/#thread`** — one verbatim quote traced to a checked signal to a
   fundable intervention — the whole product in one row. (Demo)
3. **`/thorntree#check`** — the constitutional gate: endorse/amend/contest
   tallies per signal, a live visitor vote, and the three-state gate
   (*May be priced / Commons only / Not yet*). `commons_only` is a
   structural exclusion, not a label — the publish step hard-fails a
   priced intervention that touches it. (Technical implementation)
4. **`/thorntree#capital`** — toggle *From the plans* ↔ *From the place*:
   same verified signals, one project per need vs interventions answering
   several — the joining-up argument made visible. (Business idea)

## 8-minute path (adds)

5. **`/thorntree`** — chapter 01 card: "Real data" marker, official
   readings (IMD-2025 decile 1; 34 EA flood-risk areas ≤15km; Sarafu
   tool-library vouchers), globe, diorama. (Feasibility)
6. **`/thorntree#stories`** — expand a story; underlined passages are
   verbatim excerpts; provenance chips name each record (hub note,
   voucher, plan document); "public post" chips link to the original
   post. (Use of datasets)
7. **`/thorntree#signals`** — expand a signal → "the exact words behind
   it"; tap a quote and land highlighted inside the story. The invariant
   is `story.text.slice(span[0], span[1]) === claim.text`, enforced at
   extraction, at publish, and by `tools/validate-results.mjs`.
   (Technical implementation)
8. **`/utopia`** — the labelled fictional place: full diorama + click a
   figure → story card → **Listen** (generated voices; one story told in
   Welsh). Dummy-data marker shown everywhere it appears. (Presentation +
   honesty)
9. **`/nairobi`** (then back to `/` for the globe) — four places founded
   entirely on public social posts, channel-attributed, click-through
   provenance. New places ship as a results file — data, not code.
   (Scalability, impact)
10. **Repo + validator** — github.com/TerexitariusStomp/vse:
    `schema/results.schema.json`, `tools/validate-results.mjs`,
    `tools/places/*.spec.json` reproduce each run against the live
    engine (`tools/run-pipeline.mjs`). (Feasibility)

## Criteria map

| Criterion (verbatim, slide 38) | Where it shows |
|---|---|
| Demo | live site throughout; `DEMO-SCRIPT.md` nine legs; `demo-assets/` numbered screenshots + `walkthrough.mp4` (2:30) |
| Business Idea | `BMC.md`; the `/thorntree#capital` two-view toggle is the pitch — joining-up made measurable |
| Technical Implementation | `ARCHITECTURE.md`; deployed engine (D1 + Queue + R2 + Workers AI 70B); slice-equality gate; D1 `commons_sticky` trigger + live 409 publish gate; two-layer validation (JSON Schema + semantic invariants) |
| Use of Datasets | `DATA-SOURCES.md` — per-place provenance: Sarafu vouchers & ROLA pool, OnePlanet/county CSV plans, Holons hub records, Treegens plantings, IMD-2025, EA Flood, ValueFlows; public bsky/nostr/hive posts with click-through URLs |
| Presentation | `PITCH-LIVE.md`; editorial chapters; per-place dioramas + generated voices; the landing thread |
| Feasibility | deployed + validated now: all 10 place routes 200; `npm run validate` green on every published file; `GET /api/published/<place>` serves each artifact from R2 |
| Scalability | queue-driven pipeline (~60–90s/place end-to-end); engine is edge-native; site is a pure static reader |
| Impact potential | verified place voice → capital allocation; commons gate protects relational value (IPBES 2022); SIPs point at tipping leverage |

## Honesty notes (read before judging)

- **Verification counts** derive from recorded participation, not a
  formal facilitated check — labelled as such.
- **Social stories** are public posts, attributed to channel (bsky /
  nostr / hive), never to a person; every one links to the original.
- **Utopia** is fictional — labelled "Dummy data" on the chapter marker,
  the landing index, and here. Its eight diorama voices are generated.
- Visitor votes and gate changes on the check screen are memory-only —
  nothing is sent or stored (deliberate: clean repeat demos, no fake
  telemetry).

Deliverables: **BMC** (`BMC.md`) · **logical architecture**
(`ARCHITECTURE.md` + `demo-assets/architecture.svg`) · **clickable demo**
(live + `demo-assets/walkthrough.mp4`).

Repo: github.com/TerexitariusStomp/vse — Apache-2.0.
