# OSS Stack

VSE is a thin layer over open infrastructure. This file inventories what
we build on, under which licence, and where the seams are. Package
licences verified against the npm registry (2026-10-25).

## Licence policy

Permissive + copyleft both acceptable. **Excluded class: SSPL, BSL,
Elastic/source-available** — anything that restricts offering the
software as a service or demands a commercial licence at scale.

**Model weights** must be commercially usable. Defaults: Apache-2.0 or
MIT-weighted models only (Mistral-7B-Instruct / Qwen2.5-7B for
extraction, BGE for embeddings, Whisper for voice). Meta Llama community
licence is commercially usable below ~700M MAU but is not OSI — prefer
not; any non-OSI weight needs explicit sign-off before use.

## Runtime & state plane

| Component | Licence | Used for |
|---|---|---|
| Cloudflare Workers + D1 + R2 + Queues | proprietary platform (Apache-2.0 workerd runtime) | edge API, stories/claims/signals store, media, job queues |
| wrangler | Apache-2.0 | dev + deploy |
| TypeScript | Apache-2.0 | language |
| Hono | MIT | worker routing |
| drizzle-orm | Apache-2.0 | D1 schema + migrations |
| zod | MIT | boundary validation everywhere data enters |
| ajv | MIT | results-file schema validation (`schema/results.schema.json`) |

## Pipeline

| Component | Licence | Used for |
|---|---|---|
| Workers AI — Whisper | MIT weights | voice-note → transcript (FR-E7) |
| Workers AI — BGE embeddings | MIT weights | claim-clustering proposals (FR-E13) |
| Workers AI — instruct (Mistral-7B / Qwen2.5-7B) | Apache-2.0 weights | extraction candidates + signal-statement drafts (FR-E10/E14) |
| ml-kmeans | MIT | embedding cluster proposals |
| redact-pii / @redactpii/node | MIT | intake PII flagging (FR-E9) |
| @secretlint/core + preset-recommend | MIT | payload lint before any inference call |

## Demonstrator site (`site/`)

| Component | Licence | Used for |
|---|---|---|
| Vite | MIT | static build |
| React + react-router-dom | MIT | UI + six screens |
| Tailwind CSS v4 + @tailwindcss/vite | MIT (build-time dep lightningcss is MPL-2.0 — file-level copyleft, no runtime reach) | styles |
| vite-plugin-pwa + workbox-* | MIT | offline precache (NFR-1, G4) |
| dagre | MIT | bipartite signal↔intervention layout (FR-D6) |
| Newsreader + Inter (self-hosted) | OFL-1.1 | serif stories / sans UI (FR-D8) |

## Test & quality gates

| Component | Licence | Used for |
|---|---|---|
| vitest | MIT | unit tests |
| @cloudflare/vitest-pool-workers | MIT | worker tests |
| Playwright | Apache-2.0 | two-minute demo path + offline checks (dev-only) |
| axe-core | MPL-2.0 | a11y assertions at 1440×900 and 390×844 (dev-only) |

## Services (terms, not licences — no vendored code)

| Service | Use | Failure mode |
|---|---|---|
| Meta WhatsApp Business Cloud API | WhatsApp intake webhook (FR-E6) | degrade to web form + sessions |
| Cloudflare Turnstile | web-form spam control (FR-E5) | form gated to sessions |
| MailChannels / Resend | magic-link / OTP delivery (FR-E17) | facilitator-mediated check (FR-E17a) |
| OpenTimestamps public calendars | optional publication anchoring (FR-E23) | manifest sha256 still emitted |

## Zero-dependency boundaries (by convention)

- WhatsApp webhook signature + participant magic-link tokens:
  `crypto.subtle` HMAC — no package.
- OTS anchoring is a plain POST to a public calendar — no SDK.
- Slice-equality verification is `String.prototype.slice` —
  deliberately un-libraried; the invariant must stay trivially auditable.

## Composed-not-built evaluation

Per the megaplan doctrine, a capability with no OSS row is either
out-of-scope or a flagged gap — never an excuse to write a platform
piece. Evaluated candidates:

| Candidate | Licence | Verdict |
|---|---|---|
| Doccano (span annotation) | MIT | **Rejected** — the review console exists to enforce VSE invariants (slice equality, claim↔signal bidirectionality, gate semantics); a plugin layer reproduces the same LOC without the guarantees |
| Label Studio | Apache-2.0 | **Rejected** — same reason; plus a second state plane |
| Decidim (people-check platform) | AGPL-3.0 | **Rejected** — municipal PB suite; no verbatim-span or gate semantics; heavyweight (Ruby/Postgres/accounts) for a three-state response |
| Directus (data plane) | BSL-1.1 | **Excluded by licence policy** |
| Baserow (data plane) | MIT | **Rejected** — second state plane conflicts with NFR-11 |
| ODK Collect / KoboToolbox | Apache-2.0 / AGPL | **Optional later lane** — offline field intake adapter, post-P2 |
| Polis (verification surfaces) | AGPL-3.0 | **Rejected** — deliberation grammar mismatched (statements vs verbatim spans) |

## Interop formats & standards

| Standard | Lane |
|---|---|
| JSON Schema 2020-12 | results-file contract (`schema/`) |
| 360Giving / IATI | springforth emitters reused for interventions/priorities (FR-E25) |
| OpenTimestamps | publication anchoring (optional) |
| Well-being of Future Generations (Wales) Act 2015 framing | statutory context for Welsh deployments |

## Custom-code accounting

| Artifact | Cap (LOC) | Note |
|---|---|---|
| `tools/validate-results` | 350 | irreducible — the span/ref/gate invariants ARE the product |
| `engine/api` | 600 | intake + webhooks |
| `engine/pipeline` | 800 | extraction orchestration, clustering glue, publish |
| `engine/console` | 1,800 | review + check + structure surfaces |
| `engine/adapters/springforth` | 300 | results file → possibility-card drafts |
| `site/` | 2,500 | six screens + loader + PWA |
| **Total authored** | **~6,350** | vs ≥400k LOC deployed OSS ≈ **<2%** (cap: 5%) |

Irreducible custom core: verbatim-span validator, gate semantics,
results-file publication — no OSS base exists for these invariants.
Rules: any artifact exceeding its cap triggers spec revision, not silent
growth; measure with `git ls-files | xargs wc -l` per the megaplan
methodology (lockfiles and vendored copies excluded).
