# Value Structuring Engine (VSE)

The VSE helps a whole place say what it needs, in a form that can guide
capital to where it is most needed — without first reducing it to a price.
People tell stories about what matters where they live; the engine turns
thousands of them into a handful of clear signals; the people who told them
check those signals; and the result helps guide investment.

This repository holds two products on one data contract:

- **`site/`** — a static, clickable demonstrator that reads a place's results
  file (`<place>_results.json`) and presents it as one continuous editorial
  page (place → stories → signals → check → capital → priorities, with a
  chapter-nav header, scroll-progress rail, Fraunces/Inter bundled fonts,
  and light/dark themes). No backend, no AI calls, no analytics; works
  offline on a plain static host. Design lock: `STYLESEED.md`.
- **`engine/`** — the pipeline that produces results files: listening →
  making sense → consolidating → people check → capital structuring →
  publication.

**Judging?** — the 3- and 8-minute live paths: [`docs/hackathon/JUDGES.md`](docs/hackathon/JUDGES.md).

![Logical architecture](docs/hackathon/demo-assets/architecture.svg)

See **`PRD.md`** for the full product requirements. The demonstrator ships
five **real places**, each produced end-to-end by the live engine from
records consumed by the sibling Springforth project:

- **`data/thorntree_results.json`** — Thorntree, a council estate in east
  Middlesbrough. Stories are verbatim records from the community hub, the
  Sarafu tool-library voucher, and CVL/council plan documents; the plans
  carry real budgets; the place carries a real IMD-2025 decile-1 reading.
- **`data/kenya-coast_results.json`** — the Kenyan coast from Kwale to
  Kilifi. Stories are real Sarafu voucher commitments, possibility cards,
  a completion report and county plan text; the ROLA commitment pool
  (141 vouchers, 1,640 swaps) is a genuine commons instrument.
- **`data/mida-creek_results.json`** — Mida Creek, Kilifi County. A
  possibility to plant 1,200 propagules, its needs/offers, a $500 matching
  round with 12 recorded donations, county + conservation plans, and
  pre-app treegens plots.
- **`data/hebden-bridge_results.json`** — Hebden Bridge, Calderdale. A
  mutual-aid flood-response prep day (needs, offers, participants), a peer
  ValueFlows network's commitments, and a real need↔commitment overlap.
- **`data/dar-es-salaam_results.json`** — the Dar es Salaam coast. App-
  verified and pending Treegens planting records plus pre-app field-team
  plots — an evidence-graded feed where the biggest claims are the least
  verified.

Every story string is verbatim source text — `tools/run-pipeline.mjs`
verifies each against the Springforth corpus before intake and fails the
run otherwise. Verification counts derive from recorded participation,
not a formal facilitated check. `data/utopia_results.json` (the fictional
example) is archived at `docs/source/`. The machine-checkable contract is
`schema/results.schema.json`.

## Layout

```
PRD.md                  product requirements (source of truth)
COMPETITORS.md          landscape + honest gaps + surpass properties
OSS-STACK.md            bill of materials, licences, <5% custom-code accounting
README.md               this file
LICENSE                 AGPL-3.0-only
data/                   results files (the published contract)
schema/                 JSON Schema for results files
tools/                  results-file validator + live-pipeline runner + place specs
docs/source/            original brief + content docs (docx)
site/                   demonstrator — Vite + React + TypeScript + Tailwind
engine/                 pipeline + consoles — Cloudflare Workers/D1/R2
```

## Run the demonstrator

```bash
cd site
npm install
npm run dev        # → http://localhost:5173
npm run build      # → dist/ — upload to any static host; works offline (PWA)
```

The site reads `site/public/data/<place>_results.json`. Every place has its
own clean URL — `/thorntree`, `/nairobi`, `/utopia`, … (`/` is the landing
page; legacy `?place=x#hash` links redirect to `/x#hash`). The header menu
switches places and a sticky step bar walks through each one. To show
another place, drop in a `*_results.json` that passes the validator below
and add it to `PLACES` in `site/src/lib/results.ts`. `npm run check` keeps
`data/`, `site/public/data/`, `PLACES`, and `index.json` in sync:

```bash
node tools/data-sync.mjs          # mirror canonical data/ → site/public/data/
node tools/data-sync.mjs --check  # drift check (CI)
node tools/check-places.mjs       # place-list consistency check (CI)
```

`/:placeId/share` is a public story-submission form posting to the engine's
intake (consent checkbox required; Turnstile when `TURNSTILE_SITE_KEY` is
set on the site build). `npm run a11y:check` gates every route with
axe-core at desktop and mobile viewports.

Landing-page preview images are rendered from each place's diorama and
committed to `site/public/previews/`; regenerate them with the build served
(`cd site && npm run build && npx vite preview --port 4173`) and then
`python3 tools/capture-previews.py` (needs Python Playwright + Pillow).

Deployed on Cloudflare Pages (project `vse-demonstrator`) — live at
**https://vse-demonstrator.pages.dev**:

```bash
cd site && npm run build
CLOUDFLARE_ACCOUNT_ID=46966abcfb8f1245ec055842177edcb2 \
  npx wrangler pages deploy dist --project-name vse-demonstrator
```

## Validate a results file

```bash
npm install        # repo root — installs ajv
npm run validate   # schema (JSON Schema 2020-12) + semantic invariants
# or: node tools/validate-results.mjs <file.json> [--schema path]
```

Layer 1 is structural (JSON Schema); layer 2 is `tools/results-lib.mjs` —
verbatim span slice-equality, bidirectional claim↔signal refs, derived
voices/recurrence, intervention/sip/evidence references, and gate semantics
(a `priced` intervention may never answer a `commons_only` signal). The
engine's publish step runs the same two layers (PRD FR-E24, gates G7–G10).

## Run the engine

```bash
cd engine
npm install
npx wrangler d1 create vse            # put the database_id in wrangler.toml
npx wrangler d1 migrations apply vse  # schema
npx wrangler secret put WHATSAPP_VERIFY_TOKEN
npx wrangler secret put WHATSAPP_TOKEN
npx wrangler secret put WHATSAPP_APP_SECRET  # HMAC-verifies X-Hub-Signature-256 on POST /intake/whatsapp
npx wrangler secret put ANALYST_KEY   # gates /api/consolidate, /api/publish, …
# optional — the service degrades cleanly when unset:
npx wrangler secret put TURNSTILE_SECRET   # gates web intake + session mints
npx wrangler secret put RESEND_API_KEY     # emails magic links (else facilitator hand-off)
npm run dev                           # local dev (miniflare)
npm run typecheck && npm test         # tsc + node --test (node:sqlite-backed D1 stub)
npm run deploy                        # wrangler deploy (host security gate runs)
```

Pipeline: `POST /api/places/:id/stories` (or WhatsApp webhook / voice upload)
→ queue → Whisper (voice) → Workers-AI extraction → mechanical span check
(quarantines paraphrases) → `POST /api/consolidate/:place` proposes clusters →
analyst confirms signals → people-check votes + sticky gates →
`POST /api/publish/:place` assembles, validates, hashes, and stores a
versioned (`YYYY-MM-DD.N`) results file + manifest in R2 — the exact format
`site/` reads. With `{springforth: true}` publish also writes a
`springforth/<place>/<version>-<sha>.json` draft-possibility artifact
(FR-E25).

Boundary guards (migration 0004): story text capped at 20k chars, audio at
25MB, WhatsApp POSTs HMAC-verified, votes rejected cross-place, session
mints Turnstile-gated when configured, `/extract-batch` capped at 50,
exhausted queue jobs recorded in `pipeline_failures`, and `consent` +
`pii_flag` hold unconsented/PII-flagged stories out of extraction and
publication. Participant check links come from `POST /api/check/session`
(facilitated) or `POST /api/check/link` (magic link via Resend).

The analyst's day-to-day surface is `tools/console.mjs` — place/scenario
setup, story listing, claim/signal review, and publish against the live API:

```bash
node tools/console.mjs --help        # commands + required ANALYST_KEY env
```

### Live deployment

The engine is deployed and has completed a real end-to-end run on the
Pressword Cloudflare account (the demonstrator Pages site lives on the
Widespread account — R2 was already enabled on Pressword):

- Worker: `https://vse-engine.delta-git.workers.dev` (`GET /health`)
- Bindings: D1 `vse` (`577dced5-c84c-47c6-81bf-530bb9c9b356`), R2
  `vse-artifacts`, Queue `vse-pipeline`, Workers AI
- Extraction model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` — smaller
  instruct models (7B/8B tier) reliably *elaborate* short fragments instead
  of copying them; the span check quarantined every such proposal, which is
  the gate working as designed. The 70B model copies verbatim and the
  mechanical heal fixes off-by-one spans; micro-stories (≤120 chars) fall
  back to a deterministic whole-text proposal when the model finds nothing.
- All five places ran the full loop — intake → extraction → consolidation
  → analyst-confirmed signals → participant votes/amendments → gates →
  interventions/SIPs → publish → `GET /api/published/<place>` serves each
  versioned artifact from R2. `tools/run-pipeline.mjs` + the specs in
  `tools/places/*.spec.json` reproduce every run.
- A live enforcement check confirmed a `priced` intervention backed by a
  `commons_only` signal is rejected 409 by the API (and the `commons_sticky`
  trigger makes `commons_only → may_be_priced` unrepresentable in D1)
- Every published artifact validates against `tools/validate-results.mjs`
  and is what `site/public/data/` serves — engine output is the canonical
  data on the demonstrator.

### Speed (as of 0003)

A spec-driven place run completes in ~60–90s instead of ~5–10min:

- The queue consumer processes its batch concurrently, not serially.
- `POST /api/extract-batch` re-drives N stories in one call (parallel inside
  the worker); `POST /api/claims/span` inserts an analyst-specified verbatim
  span directly (`proposer='analyst'`) — the spec already knows the text, so
  unmatched spec claims need zero model calls. All three proposers
  (`model`/`analyst`/`fallback`) pass the identical slice-equality gate.
- The runner lints the spec locally before any API call, polls claims
  adaptively, batches thin/claimless re-drives (stories whose only claims
  are <20 chars get one more model pass), and parallelises every
  independent phase. `--deterministic-only` skips model waits entirely for
  spec iteration.
- `UNIQUE(place_id, text)` makes intake idempotent; claim inserts dedupe
  on `(story_id, text)` so re-drives never double-count.

### Social corpus

Public posts from Bluesky, Nostr and Hive can become first-class stories
(`channel: 'social'`, provenance URL in `source`). `tools/social/` exports
candidate posts from the Rooted audience-identity index, a lexicon scan
finds community-economy texture corpus-wide, and specs cite curated
exports via `social_exports` — the same verbatim-corpus check applies.
See `docs/SOCIAL-DATA.md`.

## Licence

AGPL-3.0-only — see `LICENSE`. Dependency licences per `OSS-STACK.md`:
permissive + copyleft acceptable; no SSPL/BSL/Elastic; AI model weights must
be commercially usable.
