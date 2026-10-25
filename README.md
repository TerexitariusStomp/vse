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
tools/                  validator and publisher
docs/source/            original brief + content docs (docx)
site/                   demonstrator — Vite + React + TypeScript + Tailwind
engine/                 pipeline + consoles — Cloudflare Workers/D1/R2
```

## Validate the data contract

```bash
npx ajv validate --spec draft2020 \
  -s schema/results.schema.json -d data/utopia_results.json
```

Semantic invariants (verbatim spans, referential integrity, derived counts,
gate enforcement) are enforced by the validator per PRD §4.1 / FR-E2.

## Licence

Apache-2.0 — see `LICENSE`. Dependency licences per `OSS-STACK.md`:
permissive + copyleft acceptable; no SSPL/BSL/Elastic; AI model weights must
be commercially usable.
