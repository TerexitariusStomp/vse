# Value Structuring Engine — Product Requirements Document

Version 0.2 — 2026-10-25. Derived from `VSE_Developer_Brief_v3.docx` (Stuart
Bond, 25 Oct 2026), `Utopia_Demonstrator_Content.docx`, and
`utopia_results.json` — all in `docs/source/`. Audience: build agent or human
implementer (implementable without further guidance) and the VSE team.
Companion files: `data/utopia_results.json` (the reference data contract),
`schema/results.schema.json` (machine-checkable form of §7.2),
`COMPETITORS.md` (landscape + honest gaps), `OSS-STACK.md` (bill of
materials + custom-code accounting).

**What the VSE is:** a system that helps a whole place say what it needs, in a
form that can guide capital to where it is most needed, *without first
reducing it to a price*. People tell stories about what matters where they
live; the engine turns thousands of them into a handful of clear signals; the
people who told them check those signals; and the result helps guide
investment.

**Binding constraints:**

- Every claim is a **verbatim span** of its story:
  `story.text.slice(claim.span[0], claim.span[1]) === claim.text`. This is a
  hard invariant enforced mechanically at every boundary, not a convention.
- **Nothing guides capital until the people who told the stories have checked
  it.** The people-check stage is a constitutional gate, not a feature flag.
- **Counter-evidence is rendered, never hidden.** Amend and contest votes,
  the amendments themselves, and intervention `counter_signal_ids` are
  first-class output.
- Tellers are identified by **role and channel only** — never names — on every
  public surface.
- `gate: commons_only` is a **sticky constitutional flag**: a signal so gated
  can never be priced by any downstream structuring surface. It is enforced at
  publication, not merely displayed.
- The demonstrator makes **zero external calls**: no AI calls, API keys,
  back-end services, database, or analytics. All content comes from the
  results file so the same site can later show another place.
- Licence: **Apache-2.0**. Dependency licences follow `OSS-STACK.md`:
  permissive + copyleft acceptable; **no SSPL, BSL, or Elastic/source-available**;
  AI model weights must be commercially usable (Apache-2.0/MIT defaults).
- Every load-bearing mechanism is anchored in the evidence base (§3) —
  where the science is unsettled, the spec defaults to keeping the human
  decision and recording the doubt.

---

## 1. Context & goals

Place-based investment fails twice: funders get pitch decks and consultants'
syntheses, while the people who live in a place get surveyed, aggregated, and
forgotten. The VSE's move is to keep the **exact words** all the way through —
a signal like "The river stops flooding the town" remains traceable to the
hill farmer's sentence about the bog above his top field. Traceability is not
a UX nicety; it is the legitimacy mechanism that lets capital trust the
signals, and it is what lets a community see itself in the output.

The repository contains two products on one data contract:

1. **The engine** (upstream) — the pipeline that produces a place's results
   file: listening (multi-channel story intake) → making sense (verbatim
   excerpt extraction) → consolidating (signals) → people check (verification
   and gates) → capital structuring (interventions, SIPs, priorities) →
   publication (versioned results file).
2. **The demonstrator** (`site/`) — a static, clickable website that reads one
   results file and presents it so a judge understands the system in two
   minutes. Built first, against fictional Utopia data.

**Goals (measurable):**

- **G1** — A first-time visitor completes the two-minute demo path (§13.1) on
  a laptop or phone with no instruction.
- **G2** — Every signal in any published results file resolves to ≥1 verbatim
  claim whose slice-equality invariant passes; validation rejects any file
  where it fails.
- **G3** — Every published file passes `schema/results.schema.json` plus the
  semantic invariants in §4.1 with zero errors.
- **G4** — The demonstrator works fully offline after first load and from a
  plain static host; Lighthouse-style audit shows zero third-party requests.
- **G5** — Engine extraction produces candidate claims that pass the
  slice-equality invariant ≥95% of the time after constrained generation;
  100% of published claims pass it (rejected candidates never ship).
- **G6** — A signal gated `commons_only` cannot appear in an intervention
  flagged for a priced instrument; the publisher hard-fails on violation.
- **G7** — A visitor can trace any signal to a quoted excerpt (and back into
  its story) in under 10 seconds — deep links everywhere, tested in the
  demo-path check.
- **G8** — A third party can re-render or re-verify a results file with
  independent code, using only `schema/results.schema.json` + the validator —
  the artifact is open, not our rendering of it.
- **G9** — Withdrawal correctness: after a teller withdraws a story and the
  file is republished, none of its claims appear anywhere in the artifact;
  signals that lose support are marked, not silently weakened.
- **G10** — Surpass coverage: every property a–g in §6 is bound to at least
  one requirement; unbound properties are flagged, not asserted.

**Non-goals:** the site does not perform analysis; the engine does not move
money; nothing in this repository custodies funds, issues tokens, or prices
commons-gated signals.

## 2. Personas & workflows

| Persona | Needs | Never asked to |
|---|---|---|
| **Storyteller / participant** | Tell a story in their own words, in their language, on the channel they already use; later, check what the engine claims the place is saying — and withdraw if they choose | Write formally, learn a tool, reveal their name publicly, surrender their words irrevocably |
| **Facilitator** | Run a room or a phone tree; enter session transcripts; register tellers by role; mediate verification in person | Edit JSON, run software beyond a browser |
| **Sensemaker / analyst** (VSE team) | Review machine-proposed excerpts, group them into signals, write signal statements, map interventions, author SIPs and priorities | Do extraction by hand at scale; compute voices/recurrence manually |
| **Place steward** (owning org) | Own the results file; confirm gates; trigger publication | Understand the pipeline internals |
| **Visitor** (judge, funder, community member) | Understand the system in two minutes; trace any signal to exact words; try the check and the capital toggle themselves | Install anything, create an account, trust a black box |

### Engine workflow

```
LISTEN ──► EXTRACT ──► CONSOLIDATE ──► CHECK ──► STRUCTURE ──► PUBLISH
stories    claims      signals         verified   interventions    results
(raw)      (spans)     (draft→final)   +gates     + SIPs +         file
                                               priorities       (immutable)
```

- **LISTEN:** stories arrive by WhatsApp, voice note, web form, or facilitated
  session. Every story records `place_id`, `channel`, `teller_role`, `text`,
  `language`, `consent`. Consent is required before processing (NFR-2), and a
  teller may withdraw at any time (FR-E26).
- **EXTRACT:** an LLM proposes candidate claims; the validator keeps only
  verbatim spans; an analyst accepts/edits/rejects in the review console.
- **CONSOLIDATE:** embedding clusters propose groupings; the analyst writes
  the signal statement and confirms `supporting_claim_ids`. `voices` and
  `recurrence` are **derived** at publish, never hand-entered.
- **CHECK:** participants (the tellers) respond to each signal — endorse /
  amend / contest — with optional amendment text, and settle the gate.
- **STRUCTURE:** analysts map interventions in both views (`from_plans`,
  `from_place`), attach SIPs, link counter-signals (harms), author priorities.
- **PUBLISH:** the publisher validates all invariants, computes derived
  counts, writes an immutable, versioned, hash-manifested results file.

## 3. Evidence base

Every load-bearing mechanism cites current research or established method.
"Consequence" records what the science licenses — and what it limits.

| VSE element | Evidence / theory | Consequence in spec |
|---|---|---|
| People check on derived signals | Respondent validation / member checking (Lincoln & Guba); deliberative polling (Fishkin); OECD deliberative-democracy evidence reviews | Verification is a constitutional stage (§4.6), not UX garnish; amendments are first-class data |
| AI-assisted consolidation | **Tessler et al., Science 2024** ("Habermas Machine", N=5,734): AI-drafted common-ground statements outrated human mediators on informativeness/clarity/fairness, incorporated dissent, replicated in a virtual citizens' assembly | AI/analyst may draft signal statements (FR-E13–E14); but the HM synthesizes *new* text — VSE keeps verbatim claims underneath and lets the check decide, which is precisely where we differ |
| Verbatim-span invariant | Attribution/ALCE-class citation-verified generation literature; legibility critique (Scott, *Seeing Like a State*) | Slice-equality hard invariant (FR-E2); quotes never paraphrased |
| SIPs (threshold/node/window) | Meadows' leverage points; **positive tipping points** — Lenton et al. (Global Tipping Points Report 2023), operationalisation (Global Sustainability 2023), the **IPTiP methodology** (Sustainability Science 2025), OECD 2025; Otto et al., PNAS 2020 social tipping elements | SIP proposals carry an enabling-conditions / reinforcing-feedback assessment (FR-E21); `time_to_show` = expected trigger horizon |
| Commons gate | **IPBES Values Assessment 2022** — only ~6% of valuation studies address relational values; monetisation framing distorts them; **Gould et al. 2024** relational values after Spash's monetary-valuation critiques; Ostrom commons governance → knowledge-commons extension | `commons_only` is a *category distinction* (relational/constitutive value), not price = 0 (FR-E18, G6) |
| Withdrawal & teller data rights | CARE principles; Indigenous Data Sovereignty literature; GDPR erasure | FR-E26 — withdrawal propagates to claims; affected signals re-derive or are marked contested |
| Intervention harms | Gould et al. 2024 "disvalues" — the Pentre-fields-flooded critique of the flood wall is literally one | FR-E27 `counter_signal_ids` — harms link to verified signals and are rendered as counter-evidence |
| Stories as evidence units | Most Significant Change (Davies & Dart); participatory narrative inquiry (Kurtz) | Raw text preserved whole; role-only attribution |
| Two-view structuring | Participatory systems mapping (Barbrook-Johnson & Penn); the joining-up failure literature that sig7 encodes | Both views computed; coverage gaps derived, never asserted |
| Listening channels | The broad-listening research programme (Nishio / AI Objectives Institute, 2025) | WhatsApp/voice/session parity (§4.3) |

**Unsettled science (carried to §14 risks):** opt-in verification vs sampled
representativeness is unresolved in the deliberation literature; AI
consensus-writing studies are short-horizon — the long-run effect of
AI-mediated statements on minority views is unknown. That is why the verbatim
layer and the check exist as *load-bearing* structure rather than garnish.

## 4. Functional requirements

Requirement IDs: `FR-D-n` (demonstrator), `FR-E-n` (engine). "Results file"
means a JSON document conforming to §7.2 (e.g. `utopia_results.json`).

### 4.1 Results-file contract & validator

- **FR-E1 — Schema.** `schema/results.schema.json` (JSON Schema 2020-12)
  covers every key in §7.2 including enums: `channel`, `gate`, `sip.kind`,
  `interventions` view keys. The file `data/utopia_results.json` validates
  against it with zero errors.
- **FR-E2 — Validator.** `tools/validate-results` (or `engine/pipeline/
  validate.ts`) checks, in order:
  1. JSON Schema conformance (ajv).
  2. **Span integrity:** for every claim, `story.text` exists and
     `story.text.slice(span[0], span[1]) === claim.text`; `span` bounds are
     within the text.
  3. **Referential integrity:** every `claim.story_id`, `claim.signal_id`,
     `signal.supporting_claim_ids[]`, `intervention.signal_ids[]`,
     `intervention.counter_signal_ids[]`, `intervention.sip_id`,
     `sip.evidence_claim_ids[]` resolves.
  4. **Bidirectionality:** every `claim.signal_id` appears in that signal's
     `supporting_claim_ids` and vice versa.
  5. **Derived counts:** `signal.voices` = number of distinct `story_id`s
     among its claims; `signal.recurrence` = claim count; `pipeline[].count`
     matches actual `stories`/`claims`/`signals`/participant counts.
  6. **Verification tally:** `endorse + amend + contest ≤ participants`;
     `gate ∈ enum`.
  7. **Gate enforcement (G6):** no intervention carrying `priced: true`
     references a signal gated `commons_only` in `signal_ids` — and
     `counter_signal_ids` may only reference verified signals.
  8. **Withdrawal integrity (G9):** no claim may trace to a withdrawn story;
     republished files carry the withdrawn-check in the validator report.
  Exit non-zero with a human-readable finding list on any failure.
- **FR-E3 — Versioning.** Published files carry
  `meta: {place_id, version, published_at, manifest_sha256}`; filenames are
  `results-<place_id>-<version>.json`. Published files are immutable —
  corrections ship a new version.

### 4.2 Demonstrator site (`site/`)

Static build; React + TypeScript + Tailwind on Vite. All FR-D items render
exclusively from the loaded results file — no copy hard-coded per place.

- **FR-D1 — Data loading.** On start, fetch `data/<place>_results.json`
  (same-origin static asset; default place `utopia`, overridable by build
  config), parse with a zod model mirroring §7.2, and render a clear error
  state on failure. A PWA service worker precaches app shell + data so the
  site works fully offline after first load (G4); `vite build` output runs
  from GitHub Pages or any static host.
- **FR-D2 — The place (screen 1).** Renders `place.name`, `place.kind`,
  `place.summary`; the four `pipeline` stages in order with their `detail`,
  `count`, `unit`; a **Run** button that animates the stages in turn —
  counting up each number (8 stories → 49 excerpts → 7 signals → 52
  participants) so the audience sees stories become signals — then reveals
  `scale_note`. Note: the brief's prose says "48 excerpts"; the data file
  (49) is authoritative — the screen must render the file's number.
- **FR-D3 — Stories (screen 2).** List of stories showing `teller_role` and
  `channel` only. Opening a story renders its full `text` with each claim
  highlighted in place using `span` offsets (overlapping-adjacent spans
  handled by boundary sorting). Hover/tap on a highlighted excerpt shows the
  statement of the signal it feeds (`claim.signal_id → signal.statement`),
  linking to that signal's detail view.
- **FR-D4 — What the place is saying (screen 3).** Seven signal cards:
  `statement`, `voices` (labelled "voices"), `recurrence` (labelled
  "excerpts"). Opening a signal lists every supporting claim as a quotation
  with the teller's role attribution, each linking back to its story scrolled
  to and highlighted at that excerpt (deep-link anchor per claim id; G7
  target <10 s). This traceability is the heart of the demo.
- **FR-D5 — People check (screen 4).** Per signal: a stacked horizontal bar
  of `verification.endorse / amend / contest` against `participants`; every
  entry of `verification.amendments[]` rendered as a quotation; a visitor
  vote control (endorse/amend/contest) that adds to the displayed tally
  **in memory only**; a gate control initialized from `verification.gate`
  offering `May be priced` / `Commons only (never priced)` / `Not yet`,
  changeable by the visitor, with a plain-language line per state. A fixed
  note on this screen: *nothing guides capital until the people who told the
  stories have checked it.*
- **FR-D6 — Where capital goes (screen 5).** Toggle between
  `interventions.from_plans` and `interventions.from_place`. A bipartite
  network diagram drawn as SVG (dagre layout): signal nodes one side,
  intervention nodes the other, edges from `signal_ids`; toggling re-lays-out
  without reload. Per intervention card: `name`, `note`, count of needs
  answered, counter-evidence rows for each `counter_signal_ids[]` (rendered
  visibly — e.g. "moves water onto Pentre fields" linking to the flood
  signal), and — when `sip_id` present — a "could tip the system" badge
  opening a SIP panel: `kind` rendered as Threshold / Node / Window in time,
  `title`, `what_changes`, `time_to_show`, and each `evidence_claim_ids[]`
  claim as a linked quotation. The screen shows the per-view average
  needs-answered (derived: 1.0 plans vs 3.0 place) and a note naming every
  signal the current view leaves out (derived, not hard-coded — for Utopia,
  `from_plans` leaves out sig5 *and* sig7).
- **FR-D7 — Where capital is most needed (screen 6).** Renders
  `priorities.title`, `priorities.intro`, and `priorities.items[]`
  (each `{heading, text}`). Empty `items` renders a designed empty state, not
  an error — the VSE team fills this in before the demo.
- **FR-D8 — Look & feel.** Palette tokens: deep teal `#155E6E`, sage
  `#2A8A6A`, coral `#C4473F` (sparingly — contested/destructive accents),
  sand `#EFE4D4`, near-white background; a complete dark theme; serif for
  story text, clean sans for UI. Fully responsive to phone width; touch
  targets ≥44px; motion respects `prefers-reduced-motion` (Run animation
  degrades to instant reveal).
- **FR-D9 — Interaction model.** All visitor interactions (votes, gates,
  toggles) live in page memory (React context); nothing is persisted, sent,
  or measured. A reload resets to file state — desired for repeated demos.
- **FR-D10 — Fiction disclaimer.** A footer/summary line derived from
  `_about` renders on the place screen: Utopia is fictional; all stories and
  figures are invented.

### 4.3 Story intake (`engine/api/`)

- **FR-E4 — Intake API.** `POST /places/:place/stories` accepts
  `{channel, teller_role, text?, media_ref?, language?, consent}`; channels:
  `web_form | whatsapp | voice | session`. Stories land in D1; media in R2.
  `consent !== true` → 422, story stored only as a pending record.
- **FR-E5 — Web form.** A static form (hosted beside the demonstrator or
  standalone) + Turnstile spam check posts to FR-E4. No account needed.
- **FR-E6 — WhatsApp.** Meta WhatsApp Business Cloud API webhook → Worker →
  normalised story record (`channel: whatsapp`). Voice-note attachments
  download to R2 and route through FR-E7. Number→participant mapping is
  recorded privately for the later people-check invite.
- **FR-E7 — Voice.** Uploaded/attached audio → R2 → Queue → Workers AI
  Whisper transcription → story text with `media_ref` preserved. Original
  audio retained for audit; transcripts flagged low-confidence go to the
  review console before becoming stories.
- **FR-E8 — Sessions.** Facilitator console: paste/enter transcript text,
  assign `teller_role`, `channel: session`, `language` (incl. Welsh —
  originals kept; translation stored alongside, source language displayed
  with a "translated" marker as in the data).
- **FR-E9 — Consent & PII gate.** Every story record carries consent state;
  intake runs a PII flag pass (`redact-pii`/`@redactpii/node` + email/phone/
  name regexes); flagged stories are held for human review and never reach
  extraction or any public surface unreviewed.
- **FR-E26 — Withdrawal (teller data rights).** A teller may withdraw a
  story at any time via the same channel they told it on or via a
  facilitator; withdrawal marks the story `withdrawn`, excludes it and all
  its claims from the next publication (validator check 8 / G9), and flags
  every signal that loses claims — a signal left with zero claims is marked
  `contested` in the next file, never silently dropped. Withdrawal never
  deletes audit history; it removes the words from the published artifact.

### 4.4 Extraction — making sense (`engine/pipeline/`)

- **FR-E10 — Candidate extraction.** Per story, a schema-guided LLM call
  (Workers AI instruct model on Apache-2.0/MIT weights per OSS-STACK policy;
  structured JSON output) proposes candidate claims `{text, span,
  suggested_signal_label?}`. Prompt requires verbatim quotation and character
  offsets; max claims per story ≈ 10.
- **FR-E11 — Mechanical filtering.** Every candidate is checked against the
  slice-equality invariant; failures are re-prompted once with the error,
  then dropped and logged. Only passing candidates enter the review queue
  (G5).
- **FR-E12 — Review console.** Analyst sees story text with candidate
  highlights; accept / adjust span / reject / merge. Every console edit is
  re-validated. Accepted claims get stable `c###` ids and initial
  `signal_id` assignment (or `unassigned`).

### 4.5 Consolidation — signals

- **FR-E13 — Draft signals.** Claim embeddings (Workers AI bge) cluster
  claims across stories; clusters surface to the analyst as draft signals
  with member claims listed. AI may also draft `statement` candidates
  (Habermas-Machine evidence, §3) — always analyst-edited.
- **FR-E14 — Analyst consolidation.** Console: create/rename signals, move
  claims between them, split/merge. `statement` is authored prose (e.g. "The
  school stays open"). A claim may feed exactly one signal (current schema);
  unassigned claims are listed, not lost.
- **FR-E15 — Derived metrics.** `voices` (distinct stories) and `recurrence`
  (claims) are computed at publish time by the validator — never stored as
  editable fields.

### 4.6 People check — verification & gates

- **FR-E16 — Participant verification.** Each participant (a teller) sees
  each signal with its evidence excerpts and responds: **endorse**, **amend**
  (requires amendment text), or **contest**. One response per participant per
  signal; responses are stored as `verification_event` rows and tallied into
  `verification.{endorse,amend,contest}` at publish.
- **FR-E17 — Lightweight identity.** Participants authenticate by magic link
  or phone OTP tied to their intake contact; no passwords, no public
  identity. **FR-E17a — Facilitated mode:** a facilitator can record a
  participant's response in person (session channel), attributed to that
  participant.
- **FR-E18 — Gate decision.** Verification includes a per-signal gate
  question (may this signal's value ever be priced?): participant gate votes
  + steward confirmation resolve `gate ∈ {may_be_priced, commons_only,
  not_yet}`. `commons_only` is sticky: once resolved, only a new verification
  round can change it, and the publisher enforces G6 downstream.
- **FR-E19 — Check completeness.** Publication warns (non-blocking) if any
  signal reached <50% of participants, and blocks (hard) if zero
  verification events exist — nothing guides capital unchecked.

### 4.7 Capital structuring

- **FR-E20 — Interventions.** Analyst CRUD for interventions in two named
  views: `from_plans` (conventional one-project-per-need) and `from_place`
  (place-derived, multi-need). Each: `{id, name, signal_ids[], note,
  sip_id?, counter_signal_ids?, priced?}`. `signal_ids` may reference any
  verified signal.
- **FR-E27 — Counter-signals (disvalues as data).** Any intervention may
  declare `counter_signal_ids[]` — verified signals the intervention harms
  or trades off (per Gould et al. 2024's disvalues: Utopia's flood wall
  "pushes water onto the fields at Pentre"). Rendered as visible
  counter-evidence on the capital screen (FR-D6) — never hidden, per the
  binding constraint.
- **FR-E21 — SIPs.** System Intervention Points: `{id, kind ∈
  threshold|node|window, title, what_changes, time_to_show,
  evidence_claim_ids[]}` — evidence must be verbatim claims, same invariant.
  A SIP proposal carries a positive-tipping-point assessment (enabling
  conditions, reinforcing feedback, who triggers it — per IPTiP, §3);
  `time_to_show` records the expected trigger horizon.
- **FR-E22 — Priorities.** Steward-authored `{title, intro, items[{heading,
  text}]}` — empty `items` is a valid published state.

### 4.8 Publication

- **FR-E23 — Publish run.** `publish --place <id>` → assemble results file →
  run FR-E2 validator → derive counts → write
  `results-<place>-<version>.json` + `manifest_sha256` → commit into
  `site/public/data/` (+ optional OpenTimestamps anchor, the PlaceProof
  convention). Deploy = static asset update only.
- **FR-E24 — Scale.** Pipeline is queue-driven end-to-end so thousands of
  stories process as batch jobs; per-place publication is one command. The
  Utopia demo (8 stories) exercises the same code path.

### 4.9 Estate seam — Springforth

- **FR-E25 — Springforth adapter.** Publish optionally emits, alongside the
  results file, **possibility-card drafts** and **verified-need nodes** for
  the Springforth coordination layer (`~/Documents/springforth`, AGPL-3.0 —
  pattern/protocol reuse only, no copied code):
  - `from_place` intervention → possibility-card draft (name → title,
    `signal_ids` → linked needs, `note` → description, place → geo/H3);
  - verified signal → eligible need node for a FundingRound — Springforth
    allocates on "verified demand"; VSE is what produces it;
  - `sip.kind=threshold` ↔ card quorum semantics (bind-at-quorum is a
    threshold SIP); `sip.time_to_show` ↔ an oracle-monitored evidence
    expectation; `priorities.items` ↔ round eligibility lists.
  The seam is **data-only**: VSE ships first and alone; the adapter is an
  optional emit target, never a runtime dependency.

## 5. Non-functional requirements

| ID | Requirement | Rationale |
|---|---|---|
| NFR-1 | **Offline demonstrator** — PWA precache; all assets same-origin; `file://` fallback via bundled import acceptable | demo-day wifi is not a dependency |
| NFR-2 | **Consent & PII minimisation** — consent required before processing; PII flagged at intake and held for review; public surfaces show role+channel only; withdrawal honoured (FR-E26) | stories are personal data; trust is the product |
| NFR-3 | **Bilingual readiness** — stories keep original language + translation; UI string table i18n-ready with parity tests (springforth en/sw/fr pattern → en/cy); Welsh is a first-class intake language | Welsh appears in the demo data itself |
| NFR-4 | **Deterministic published artifact** — validator + derived counts + content hash; same inputs → byte-identical file | verifiability; diffable publications |
| NFR-5 | **Counter-evidence surfaced** — contest votes, amendments, and `counter_signal_ids` rendered wherever signals/interventions are shown | legitimacy (Gould et al. disvalues, §3) |
| NFR-6 | **No analytics/tracking** anywhere in the demonstrator | brief constraint; visitor trust |
| NFR-7 | **Mobile-first responsive**, WCAG 2.1 AA; axe-core gate at both viewports (springforth convention) | judges open the link on phones |
| NFR-8 | **Memory-only visitor state** — no storage, no cookies | brief constraint; clean repeat demos |
| NFR-9 | **Graceful engine degradation** — any channel down degrades to manual entry; LLM extraction down → analysts can still hand-enter claims | community work can't wait on a vendor |
| NFR-10 | **Licence hygiene** — Apache-2.0 repo; deps audited to `OSS-STACK.md` (no SSPL/BSL/Elastic; model weights commercially usable) | consistency with the estate |
| NFR-11 | **State-plane simplicity** — D1 (structured) + R2 (media) + Queues (jobs) only; no new datastore classes | matches megaplan state-plane audit |
| NFR-12 | **Optional privacy-bounded inference** — sensitive stories may route extraction through poi-compute INTERNAL lane instead of Workers AI | safeguarding lane already exists in the estate |
| NFR-13 | **<5% custom code** — measured per `OSS-STACK.md` accounting; authored artifacts carry LOC caps | megaplan compose-don't-build doctrine |

## 6. Surpass properties & gates (binding)

Imports `COMPETITORS.md`. Properties **a–g** are system requirements woven
through §4–§5 — each names its binding requirements. Phase reviews (§9)
measure the gates; a gate missed is a gap filed, not a number rounded.

| | Property | Bound by |
|---|---|---|
| a | **Verbatim lineage is load-bearing** — every signal resolves to exact quoted spans, machine-verified and hash-manifested; never statistics about stories | FR-E2, FR-E10–E12, G2, G3, G7 |
| b | **The people check is a constitutional gate** — tellers endorse/amend/contest what the engine claims before anything guides capital | §4.6, FR-E19, binding constraint |
| c | **The commons gate** — `commons_only` is a category distinction enforced as data at publish, not displayed sentiment | FR-E18, FR-E2(7), G6 |
| d | **Two-view capital structuring** — the same signals rendered as siloed plans vs place-derived multi-need interventions, with the join-up multiplier and coverage gaps *derived* | FR-D6, FR-E20, FR-E27 |
| e | **SIPs as first-class objects** — threshold/node/window leverage points carrying their own evidence excerpts, methodologically anchored (IPTiP, §3) | FR-E21, FR-D6 |
| f | **Open replayable artifact** — the results file is versioned, schema-validated, hash-manifested JSON any third party can render or re-verify | FR-E3, FR-E23, NFR-4, G8 |
| g | **Voice-channel inclusivity** — WhatsApp/voice/session-first, incl. Welsh — not literate-web-only | FR-E4–E8, NFR-3 |

**Closest-neighbour note.** Talk to the City already ships open-source LLM
extraction + clustering + theme→quote drill-down — properties a/f are where
we converge; b/c/d/e are where they cannot follow without becoming VSE.
Cortico is nearest in spirit (voice-first, human-steered) with no capital
path. The durable edge is the **verification + commons-gate + open-artifact
trio** — extraction quality commoditises; legitimacy machinery doesn't.

## 7. Data model

### 7.1 Engine entities (D1)

| Entity | Key fields |
|---|---|
| Place | id, name, kind, summary, languages[] |
| Story | id, place_id, channel, teller_role, text, language, translated_from?, media_ref?, consent, pii_flags, participant_id, status (live\|withdrawn), created_at |
| Claim | id, story_id, text, span[2], signal_id\|unassigned, proposed_by (model\|analyst), review_state |
| Signal | id, place_id, statement, supporting_claim_ids[] (join table), status (draft\|ready\|verified\|contested) |
| Participant | id, place_id, contact_ref (private), story_ids[] |
| VerificationEvent | id, signal_id, participant_id, response (endorse\|amend\|contest), amendment_text?, gate_vote?, via (self\|facilitator), created_at |
| Intervention | id, place_id, view (from_plans\|from_place), name, note, signal_ids[], counter_signal_ids[], sip_id?, priced |
| SIP | id, place_id, kind, title, what_changes, time_to_show, enabling_conditions?, reinforcing_feedback?, evidence_claim_ids[] |
| Publication | id, place_id, version, manifest_sha256, results_json, published_at, validator_report |

### 7.2 Results-file schema (published contract)

Mirrors `data/utopia_results.json`; enforced by `schema/results.schema.json`.

| Key | Type | Notes |
|---|---|---|
| `_about` | string | provenance/fiction line |
| `place` | `{id, name, kind, summary}` | |
| `pipeline` | `[{stage, detail, count, unit}]` | exactly 4 stages in order |
| `scale_note` | string | |
| `stories` | `[{id, teller_role, channel, text}]` | no names, ever |
| `claims` | `[{id, story_id, text, span:[start,end], signal_id}]` | verbatim-span invariant |
| `signals` | `[{id, statement, supporting_claim_ids[], voices, recurrence, verification}]` | voices/recurrence derived |
| `signals[].verification` | `{participants, endorse, amend, contest, amendments[], gate}` | gate ∈ `may_be_priced\|commons_only\|not_yet` |
| `interventions` | `{from_plans[], from_place[]}` | items: `{id, name, signal_ids[], counter_signal_ids?[], note, sip_id?, priced?}` |
| `sips` | `[{id, kind, title, what_changes, time_to_show, evidence_claim_ids[]}]` | kind ∈ `threshold\|node\|window` |
| `priorities` | `{title, intro, items:[{heading, text}]}` | `items` may be `[]` |
| `meta` | `{place_id, version, published_at, manifest_sha256}` | added at publication |

## 8. Architecture

```
 WHATSAPP ─┐
 VOICE ────┤   ┌─────────────── engine (Cloudflare) ───────────────┐
 WEB FORM ─┼─► │ api (Workers+Hono) → D1 stories/claims/signals    │
 SESSIONS ─┘   │ media → R2 · jobs → Queues                        │
               │ pipeline: extract (Workers AI, span-checked)      │
               │   → consolidate (bge clusters) → publish          │
               │ console (Pages): review · signals · check · SIPs  │
               └───────────────┬───────────────────────────────────┘
                               │ results-<place>-<v>.json (+sha256)
                    ┌──────────▼──────────┐      ┌────────────────┐
                    │  site/ static build │      │ Springforth    │
                    │  React+TS+Tailwind  │      │ (estate seam,  │
                    │  PWA, zero external │      │  FR-E25 — cards│
                    │  calls              │      │  + need nodes) │
                    └──────────┬──────────┘      └────────────────┘
                               ▼  visitor (judge / funder / community)
```

Internal assets reused from the estate: **poi-compute** (optional INTERNAL
inference lane, NFR-12), **PlaceProof conventions** (manifest + OTS anchoring
for publications), **Springforth** (downstream consumer via FR-E25;
reuse-by-pattern only — AGPL-3.0 vs Apache-2.0 means no copied code), and the
**wrangler/git gates** on this host (deploys and pushes are scanned — see
`~/Documents/docker/AGENTS.md`).

## 9. Phased delivery

| Phase | Scope | Exit gate |
|---|---|---|
| **P0 — Demonstrator + contract** | `schema/`, validator (FR-E1–E3 subset: schema+invariants on the file), `site/` all six screens (FR-D1–D10), README, LICENSE | G1–G4, G7 measured on Utopia file; demo path §13.1 passes |
| **P1 — Engine spine** | places/stories (web_form + session intake), extraction + review console (FR-E4/5/8–E12, E26), consolidation (E13–E15), publish (E23) | reproduce `utopia_results.json` class output for a second fictional place end-to-end through the engine; withdrawal drill (G9) passes |
| **P2 — People check + remaining channels** | verification app (E16–E19), WhatsApp + voice (E6–E7), facilitated mode | a real facilitated check produces a publishable verified file |
| **P3 — Structuring + estate seam + multi-place** | interventions/SIP/priorities workbench (E20–E22, E27), steward publish flow, FR-E25 adapter, second-place render on same site | two places' files published; site switches cleanly; a possibility-card draft round-trips into springforth staging |

## 10. Custom-code budget

Hard cap **<5% authored share**, measured per `OSS-STACK.md` (lockfiles and
vendored copies excluded, per the megaplan `oss-audit` methodology).

| Artifact | Cap (LOC) | Purpose |
|---|---|---|
| `tools/validate-results` | 350 | schema + span/ref/gate/withdrawal invariants |
| `engine/api` | 600 | intake + webhooks |
| `engine/pipeline` | 800 | extraction orchestration, clustering, publish |
| `engine/console` | 1,800 | review + people-check + structuring surfaces |
| `engine/adapters/springforth` | 300 | FR-E25 emit targets |
| `site/` | 2,500 | six screens + loader + PWA |
| **Total** | **~6,350** | ≈ **<2%** vs ≥400k LOC deployed OSS |

Rules: any artifact exceeding its cap triggers spec revision, not silent
growth; a capability with no OSS row is either out-of-scope or a flagged gap
— the composed-not-built evaluation table in `OSS-STACK.md` records what was
considered and rejected.

## 11. External integrations

| Service | Use | Failure mode |
|---|---|---|
| Meta WhatsApp Business Cloud API | WhatsApp intake webhook | channel degrades to web form + sessions |
| Workers AI — Whisper | voice transcription | manual transcript entry (FR-E8) |
| Workers AI — instruct (Apache-2.0/MIT weights per OSS-STACK) | claim extraction + statement drafts | analyst hand-entry path always exists |
| Workers AI — bge embeddings | consolidation clustering | analyst grouping without drafts |
| Turnstile | web-form spam control | form temporarily gated to sessions |
| MailChannels / Resend | magic-link / OTP delivery | facilitated check only (FR-E17a) |
| OpenTimestamps (optional) | publication hash anchoring | manifest hash still emitted |
| **Springforth (estate)** | possibility cards, funding rounds, oracle monitoring, 360Giving/IATI emitters, EigenTrust weighting (optional), Telegram intake lane, i18n parity + design/a11y gate conventions | none — data-only seam, FR-E25 |

## 12. Out of scope

- Moving money, custody, payments, tokens, or executing investments
  (Springforth does that, downstream).
- Pricing `commons_only` signals — structurally excluded (G6).
- The demonstrator performing any analysis — it renders the results file.
- Real-place deployment hardening during P0 (fictional data only).
- Per-participant public profiles, social features, persistence of visitor
  interaction.

## 13. Acceptance criteria

### 13.1 The two-minute demo path (P0 acceptance, from the brief)

1. Open the link on laptop or phone — loads with no errors, no third-party
   requests.
2. The place: press **Run**; stages animate and count up; `scale_note`
   appears.
3. Open signal "The school stays open" → trace to the head teacher's and the
   elder's exact words; follow a claim link back into its story highlighted
   in place (G7: under 10 seconds).
4. People check: cast an endorse vote (tally visibly +1), read an amendment,
   set a gate to each of its three states.
5. Where capital goes: toggle plans↔place; observe 1.0 vs 3.0 averages and
   the unreached-signal note; open a "could tip the system" badge → SIP panel
   with kind, time_to_show, evidence quotes.
6. Where capital is most needed renders its (possibly empty) state cleanly.

### 13.2 Engineering acceptance

- `npx ajv validate --spec draft2020 -s schema/results.schema.json -d
  data/utopia_results.json` — zero errors.
- Validator run over `data/utopia_results.json` — zero findings (49 claims'
  slices equal, all refs resolve, tallies ≤ 52, counts derived-match).
- `cd site && npm run build` green; `tsc --noEmit` clean.
- Offline smoke: load once, disable network, full demo path still works.
- Withdrawal drill (P1): mark a story withdrawn, republish, confirm its
  claims vanish and dependent signals are marked (G9).
- `README.md`: what it is, how to run, licence, credit.
- `gitleaks detect --source .` clean before any push (host gate).
- `OSS-STACK.md` accounting rerun at each phase boundary — authored share
  stays <5% (NFR-13).

## 14. Risks & open questions

1. **`priorities` content** — intentionally empty in the file; the VSE team
   supplies it before the demo. Site must carry the empty state well until
   then. *(Owner: Stuart/team.)*
2. **Repository home & credit** — brief asks where the repo lives and how the
   builder is credited. Assumed: public GitHub repo under the project's org;
   builder credited in README + demonstrator footer if wanted.
   *(Decision for Stuart.)*
3. **Brief/data discrepancy** — brief prose says "48 excerpts"; the file has
   49 claims and the content doc lists 49. The file is authoritative; site
   renders file numbers. Flagged to the team.
4. **`from_plans` coverage note** — the content doc names only sig5 as
   unreached by the plans view; the data also leaves sig7 ("Joining it up")
   unreached. PRD requires the note to be derived (both appear), which is
   more accurate — confirm that's wanted.
5. **Gate governance** — who settles a contested gate (participant majority?
   steward? threshold rules?) is a governance question the engine records
   but doesn't adjudicate.
6. **WhatsApp onboarding** — Cloud API requires business verification and
   template approval; lead time is outside our control. P2 risk.
7. **Deploy gate** — host `wrangler deploy` runs security scans
   (trufflehog/trivy/semgrep); engine deploys must expect the gate.
8. **Real-story governance** — before any non-fictional place: consent
   wording, Welsh-language handling, participant safeguarding, data
   retention, and withdrawal UX (FR-E26) need a one-page protocol. Not
   blocking P0–P1.
9. **AGPL/Apache boundary** — Springforth is AGPL-3.0; this repo is
   Apache-2.0. Reuse is pattern/protocol level only (the results-file seam).
   Any code-level sharing needs an explicit dual-licence decision by the
   owner.
10. **Closest-neighbour convergence** — Talk to the City and Cortico are
    open-source and adjacent. Our durable edge is b+c+f (checked-by-tellers,
    commons gate, open artifact), not extraction quality — keep watching
    upstream for convergence.
11. **Model-weight licences** — instruct models must clear the OSS-STACK
    commercial-usability policy (Apache-2.0/MIT defaults; Llama-class weights
    need explicit sign-off). Recheck whenever the Workers AI catalogue
    changes.
12. **Verification representativeness** — opt-in checks vs sampled
    representation is unsettled science (§3). Current design records who
    checked; a representative-sample mode is a candidate post-P2
    enhancement, not silently presumed.

## Appendix A — Traceability (brief → requirements)

| Brief element | Satisfied by |
|---|---|
| §2 "static, clickable site reading one file; no backend; offline; JSON-driven" | FR-D1, NFR-1, NFR-6, G4 |
| §3.1 The place + Run animation + scale_note | FR-D2 |
| §3.2 Stories; role+channel only; span highlights; tap→signal | FR-D3 |
| §3.3 Signal cards; voices/recurrence; excerpt traceability | FR-D4, FR-E15, G2, G7 |
| §3.4 Verification bars; amendments; visitor vote; editable gate; the "nothing guides capital" line | FR-D5 |
| §3.5 Plans/place toggle; network; averages; unreached signals; SIP badge+panel | FR-D6 |
| §3.6 Priorities closing screen, empty by design | FR-D7 |
| §4 data-file field list | §7.2, FR-E1/E2 |
| §5 palette, serif/sans, dark theme, phone | FR-D8, NFR-7 |
| §7 judge flow + README + licence | §13.1–13.2, README, LICENSE |
| §8 licence + repo home agreement | Apache-2.0 decided; §14.2 |
| Pipeline stages Listening→People check | §4.3–4.6 (FR-E4–E19, E26) |
| "designed for thousands of stories" | FR-E24, NFR-9 |
| "the people who told them check those signals" | §4.6, binding constraint, FR-E19 |
| *(science-driven additions beyond the brief)* | §3; FR-E25/26/27; §6 gates |

## Appendix B — Utopia reference data (verified against the file)

- 8 stories (roles: hill farmer, head teacher, young person, flood volunteer,
  elder [Welsh, translated], café organiser, social prescriber, councillor).
- 49 claims across stories s1–s8; ids `c001`–`c049`.
- 7 signals sig1–sig7; gates: sig1 `not_yet`, sig2/3/4/6 `may_be_priced`,
  sig5 `commons_only`, sig7 `not_yet`. All verified by 52 participants.
- Interventions: 5 `from_plans` (1 signal each — avg 1.0), 5 `from_place`
  (3 each — avg 3.0); `from_place` B1–B3 carry sip_id sip3/sip2/sip1.
- 3 SIPs: sip1 threshold (school roll 38 vs review line 40), sip2 node
  (school hall), sip3 window (subsidy transition, ≥3 yrs).
- `priorities.items` = `[]` — empty by design.
