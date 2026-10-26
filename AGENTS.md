# VSE — agent working rules

## Verification commands (run before claiming done)

```bash
npm run check          # root gate: validate, data drift, places sync, engine typecheck+tests, site lint+build
npm test               # alias for the engine suite
npm run validate       # schema + semantic validation of every data/*_results.json
npm run site:build     # vite build
npm run a11y:check     # axe-core × Playwright, 4 routes × 2 viewports — 0 serious/critical
```

Engine-local: `cd engine && npm run typecheck && npm test` — tests are
`node --test test/` (Node 22 type stripping) against a `node:sqlite`
`DatabaseSync`-backed D1 stub in `test/helpers.ts`; real SQL incl. triggers
(`commons_sticky`) runs in tests. Add new route tests there.

## Invariants that must never regress

- **Verbatim lineage**: every claim `text` is an exact `slice` of its story
  (`span` equality is mechanical, in `tools/results-lib.mjs`). Claims that
  fail are quarantined — never "fixed" by editing story text to match.
- **`commons_only` is sticky**: the `commons_sticky` D1 trigger makes
  `commons_only → may_be_priced` unrepresentable; a `priced` intervention
  answering a `commons_only` signal is 409 at the API AND rejected by the
  validator. Do not add a path that relaxes this.
- **Place isolation**: votes, signals→claims, interventions→signals all
  verify same-place before writing. Silent SQL no-ops were replaced with
  explicit 4xx checks — keep that pattern.
- **Consent/PII/withdrawal**: stories with `consent != 'granted'`,
  `pii_flag = 1`, or `withdrawn = 1` never reach extraction or publication.
- **Canonical data**: `data/` is the source of truth;
  `site/public/data/` is a mirror (`tools/data-sync.mjs`). Never edit the
  mirror directly.
- **Back-compat**: every existing `data/*_results.json` must keep passing
  `npm run validate`; migration defaults preserve live rows.

## Security gates (machine-enforced)

- `wrangler deploy` / `wrangler pages deploy` run TruffleHog + Trivy +
  Semgrep first; HIGH/CRITICAL findings block. No `SECURITY_SKIP` without
  explicit user approval.
- `git push` runs Gitleaks on the pushed range. Never commit secrets —
  engine secrets go through `wrangler secret put`.

## Layout notes for edits

- `engine/src/intake.ts` — boundary caps (20k story chars / 25MB audio),
  Turnstile, WhatsApp HMAC, PII flag, consent default.
- `engine/src/index.ts` — timing-safe analyst auth, `/extract-batch` cap
  (50), queue consumer + `pipeline_failures` recording.
- `engine/src/check.ts` — votes verify participant↔signal place;
  `/check/session` (facilitated) vs `/check/link` (Resend magic link).
- `engine/src/publish.ts` — `YYYY-MM-DD.N` versions, `status → published`
  transition, unchecked/contested warnings, `springforthArtifact` emit.
- `tools/results-lib.mjs` — shared semantic validator: imported by BOTH
  the CLI validator and the Worker's publish step. Edit once, both agree.
- `tools/console.mjs` — analyst CLI (`ANALYST_KEY` env) for all
  analyst-gated routes.
- `site/` — React + wouter; `/` landing, `/:placeId` place page,
  `/:placeId/share` public story form. Design lock: `STYLESEED.md`.
- `site/src/components/Globe.tsx` — cobe canvas is `absolute inset-0`
  inside `contain:size` wrapper: cobe's `update({width})` multiplies by
  dpr internally AND the canvas attribute must never feed layout (it once
  grew a page to ~350 viewports). Pass CSS pixels; never write size per
  frame.
