# Competitive landscape — where VSE stands

Benchmarked against the platforms that overlap our scope. Verdicts are
honest: where a competitor beats us today, the row says so.

## Narrative & community sensemaking

| Competitor | What they do | Where we stand |
|---|---|---|
| **SenseMaker** (The Cynefin Co) | Proprietary SaaS for micro-narratives with self-signification — respondents mark their own story's meaning on triads/dyads; distributed capture at scale | Their self-signification is the closest prior art to our people check, but it happens **at capture** (teller scores their own story) — never verification of *derived* claims by the tellers. Output is patterns; the words get abstracted away. No capital structuring, no open artifact, proprietary. |
| **NarraFirma** | FOSS participatory narrative inquiry toolkit (Kurtz/Fernhout) | Proved OSS narrative inquiry is viable. Catalysis is manual, UX is desktop-era, no verification gate, no capital side. We absorb its PNI discipline (see PRD §3) without its tooling. |
| **Cortico / Local Voices Network** (MIT Center for Constructive Communication) | Recorded small-group conversations → human-led, AI-assisted sensemaking → voice portals. 300+ partners, 40+ US states, 60+ countries | Nearest in spirit: voice-first, AI-supports-not-replaces, "conversation record shared back with participants." But output is understanding/highlights — no verbatim-span verification of derived signals, no gates, no interventions, no capital structuring. They stop exactly where our differentiator starts. |
| **Talk to the City** (AI Objectives Institute) | Open-source LLM pipeline: claim extraction → clustering → theme tree → interactive report with quote drill-down; ingests surveys, transcripts, Polis data | Nearest technically — extraction + clustering + traceability already exist as OSS. Stops at the report: no people-check, no commons gate, no interventions/SIPs/priorities, no published immutable artifact. Inputs transit third-party LLM APIs; we can run privacy-bounded lanes (NFR-12). Their polish is a real bar for our traceability UX. |

## Civic engagement & participatory democracy

| Competitor | What they do | Where we stand |
|---|---|---|
| **Decidim / CONSUL** | Municipal-grade open-source participation platforms: proposals, debates, participatory budgets, voting | Proved institutional adoption at city scale. Citizens deliberate options someone else framed; no story→signal derivation, no verbatim lineage, no check back to the tellers. Heavyweight infra (Ruby/Postgres) — evaluated and rejected as our people-check base (see OSS-STACK). |
| **Polis** | Open-source statement-voting consensus mapping | Proved scaled deliberation with real-world use (Taiwan). Participants react to short statements — there are no stories, no spans, no verification of derived output, no capital path. Its cluster-visualisation grammar doesn't fit verbatim-span evidence. |
| **Ethelo** | Group decision optimisation over defined option spaces + constraints | Proved structured group decisions. Requires pre-defined options — VSE's whole point is that the options emerge from voice. |
| **Go Vocal/CitizenLab, Bang the Table, Cap Collectif, Consider.it, Cobudget** | Engagement workflow SaaS: surveys, ideation, PB modules, mapping | Proved municipal demand and channel reach. Analysis is keyword/NLP aggregation into themes; citizens see results as charts, not checkable lineage; nothing reaches capital allocation. |

## Social value & outcomes platforms (capital-facing)

| Competitor | What they do | Where we stand |
|---|---|---|
| **Social Value Portal** (TOM System™) | The dominant UK social-value procurement standard — monetised measures across Work/Economy/Community/Planet, 24k+ orgs | Proved monetised measurement institutionalises. But TOMs are procurement-side proxies: the place's own voice never enters, and *everything* is priced — there is no commons concept. IPBES/Gould science (PRD §3) is explicit that this flattens exactly the values VSE protects. |
| **Social Value Engine** | SROI workflow + portfolio evidence for commissioners/funders | Same monetise-everything frame; robust evidence attachment, no deliberative check, no place-voiced signals. |
| **OutcomesX** | Marketplace that standardises, **prices**, trades and verifies units of social impact | Proved outcome contracting exists. It is the philosophical antithesis of the commons gate: every value becomes a tradable unit. |
| **Sopact** | Impact/ESG portfolio reporting with source-linked indicators | Nearest capital-side provenance practice — every figure names its source. But indicators are funder-framed and top-down; no stories, no people check, no gates. |
| **60 Decibels / Keystone** | Lean Data beneficiary-feedback surveys → benchmarks | Proved comparable feedback at scale. Survey aggregates; no verbatim lineage; feedback never structures capital. |

## The actual incumbent: the status quo

| Competitor | What it is | Where we stand |
|---|---|---|
| **Consultant-written bids into siloed pots** | Every fund wants a separate bid; flood/school/housing/farm each proved on its own; Utopia's councillor spent £60k on consultants and "nobody funds the joining up" | This is what deployments actually replace. The two-view comparison (1.0 vs 3.0 needs-per-intervention) is the argument made visible. |

## Relation to the estate

**Springforth** (`~/Documents/springforth`, AGPL-3.0) is
downstream-complementary, not a competitor: its funding layer allocates
against "verified demand," and VSE is what produces verified demand from
voice — see PRD FR-E25 (results file → possibility-card drafts → funding
rounds). Its capital-side competitors (Gitcoin/Allo, Giveth, Coordinape,
Karma GAP, Octant) are surfaces VSE output can *feed*, not rivals.
**PlaceProof** supplies the manifest+OTS-anchoring convention our
publisher reuses.

## Honest gaps

- **Talk to the City's** theme→quote drill-down is shipped, open source,
  and polished. Our verbatim-span + people-check is the differentiator;
  their interaction polish is the bar we have to match (NFR-7).
- **SenseMaker's self-signification** captures semantic metadata (triad
  placements) we don't. Optional signification fields are a candidate
  post-P1 enhancement, filed as an open question.
- **Polis/Decidim** carry decades of municipal deployment trust. We are
  unproven in institutions; the Utopia demo exists to earn the first
  look.
- **SVP/OutcomesX** have live procurement and funding rails today. We
  deliberately have none — the Springforth seam is the answer, and it is
  data-only.

## Where we surpass — summary

Seven properties no incumbent combines; each is bound to requirements in
**PRD §6**: (a) verbatim lineage is load-bearing, (b) the people check is
a constitutional gate, (c) the commons gate enforced as data, (d)
two-view capital structuring with derived join-up multiplier, (e) SIPs
as first-class evidence-linked objects, (f) an open replayable results
artifact, (g) voice-channel inclusivity.
