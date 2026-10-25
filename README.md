# Value Structuring Engine (VSE)

The VSE helps a whole place say what it needs, in a form that can guide
capital to where it is most needed — without first reducing it to a price.
People tell stories about what matters where they live; the engine turns
thousands of them into a handful of clear signals; the people who told them
check those signals; and the result helps guide investment.

This repository holds two products on one data contract:

- **`site/`** — a static, clickable demonstrator that reads a place's results
  file (`<place>_results.json`) and presents it. No backend, no AI calls, no
  analytics; works offline on a plain static host.
- **`engine/`** — the pipeline that produces results files: listening →
  making sense → consolidating → people check → capital structuring →
  publication.

See **`PRD.md`** for the full product requirements. The reference data file
is `data/utopia_results.json` (Utopia is fictional; every story, figure and
vote is invented for demonstration). Its machine-checkable contract is
`schema/results.schema.json`.

## Layout

```
PRD.md                  product requirements (source of truth)
COMPETITORS.md          landscape + honest gaps + surpass properties
OSS-STACK.md            bill of materials, licences, <5% custom-code accounting
README.md               this file
LICENSE                 Apache-2.0
data/                   results files (the published contract)
schema/                 JSON Schema for results files
tools/                  results-file validator (schema + semantic invariants)
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

The site reads `site/public/data/utopia_results.json`. To show a different
place, drop in another `*_results.json` that passes the validator below —
nothing else needs to change.

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
npx wrangler secret put ANALYST_KEY   # gates /api/consolidate, /api/publish, …
npm run dev                           # local dev (miniflare)
npm run typecheck && npm test         # tsc + node --test
npm run deploy                        # wrangler deploy (host security gate runs)
```

Pipeline: `POST /api/places/:id/stories` (or WhatsApp webhook / voice upload)
→ queue → Whisper (voice) → Workers-AI extraction → mechanical span check
(quarantines paraphrases) → `POST /api/consolidate/:place` proposes clusters →
analyst confirms signals → people-check votes + sticky gates →
`POST /api/publish/:place` assembles, validates, hashes, and stores a
versioned results file + manifest in R2 — the exact format `site/` reads.

## Licence

Apache-2.0 — see `LICENSE`. Dependency licences per `OSS-STACK.md`:
permissive + copyleft acceptable; no SSPL/BSL/Elastic; AI model weights must
be commercially usable.
