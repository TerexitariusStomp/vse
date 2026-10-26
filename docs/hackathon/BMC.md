# VSE — Business Model Canvas (PS1)

| Block | |
|---|---|
| **Customer segments** | Place-based funders who must justify allocation to lived reality: community foundations, councils/combined authorities, philanthropy, place-based investors, development funds (primary, paying). Places and their stewarding organisations (community hubs, anchor institutions, conservation groups) — the supply side, served free. Researchers/auditors consuming verified place evidence |
| **Value propositions** | Funders: evidence-grade place voice — every signal traceable to the teller's exact words, checked by the tellers before it guides capital; joining-up made measurable (the two-view structuring); `commons_only` protected structurally, so relational value isn't silently flattened into price (IPBES 2022). Places: heard in their own words, role-and-channel attribution only, withdrawal honoured. Stewards: an owned, versioned, hash-manifested artifact — the place's answer in a form it controls |
| **Channels** | The results-file contract itself (any consumer renders it), the static demonstrator (zero-install, offline), `GET /api/published/<place>`, and the Springforth seam (verified-need nodes → funding rounds). WhatsApp/voice/session intake channels are where tellers already are |
| **Customer relationships** | Facilitated first deployments (a facilitator + a steward + our analyst tooling); thereafter self-serve against the open schema. Retention compounds: each published corpus raises the value of the next run in the same place |
| **Revenue streams** | 1. **Facilitated runs** — a priced engagement per place cycle (listen → check → publish); the product is the verified artifact. 2. **Hosted engine** — managed deployments for funders/councils running many places (the demonstrator stays free software). 3. **Consented evidence products** — aggregates and releases a place's steward chooses to license; verbatim stories are never sold. 4. **Structuring services** — SIP/priority workbench time. Honest note: the moat is the invariant + the check, not data lock-in — the artifact is open by design |
| **Key resources** | The verbatim-span gate (mechanically enforced, trivially auditable); the people-check machinery (a constitutional stage competitors treat as garnish); `schema/results.schema.json` + validator (the open contract); the engine (D1/Queue/R2/Workers AI); corpus adapters (`tools/places/*.spec.json`, `tools/social/`); ~7,150 LOC authored over ≥400k OSS (<2%) |
| **Key activities** | Facilitation + intake; analyst consolidation (AI drafts, humans author); running the people check; structuring interventions/SIPs; publishing + anchoring artifacts; maintaining the schema/validator and corpus adapters |
| **Key partnerships** | Springforth corpus & estate seam (FR-E25 — verified demand feeds funding rounds); Sarafu/CLC (commitment-pool records); Treegens (planting evidence); OnePlanet + county/council plan documents; Rooted index (public social corpus); Meta WhatsApp + Cloudflare (channels/infra); facilitators and place stewards in each deployment |
| **Cost structure** | Cloudflare edge (Workers/D1/R2/Queue — near-zero marginal cost), Workers AI inference, facilitation + analyst time per run (the real cost — it *is* the product), engineering |

## Why this wins at unit level

- A facilitated run replaces consulting synthesis — the competitor row is
  "consultant-written bids into siloed pots", and the two-view screen is
  the comparison made literal (Utopia: 1.0 vs 3.0 needs answered per
  intervention).
- The artifact sells itself downstream: verified signals are exactly what
  funding rounds, 360Giving/IATI emitters, and the Springforth seam
  consume — demand verification is the scarce input.
- The moat compounds procedurally, not by lock-in: every run deepens a
  place's corpus and the facilitators' practice; the schema stays open
  because verification *is* the product.

## Benefits Dependency Network

Read right-to-left, per the SF Live template: investment drivers on the
right, benefits on the left, every dependency explicit.

| Investment objective | Business change | Enabling change | Benefit |
|---|---|---|---|
| Fund what a place actually needs, not who writes the best bid | Allocations key on verified, people-checked signals | Verbatim-span lineage + constitutional people check + published artifact | Funders see claims a place stands behind; the tellers' words survive to the term sheet |
| Fund joining-up, not siloed pots | Interventions scored on how many verified needs they answer | Two-view capital structuring (`from_plans` vs `from_place`) with derived coverage gaps | Multi-need interventions become legible and comparable; the unreached-signal note exposes what silos miss |
| Protect relational value while pricing what's priceable | Commons signals excluded from priced instruments *by construction* | `commons_only` sticky gate: D1 trigger + publish-time 409 | A funder can underwrite the priced surface without being accused of monetising the commons |
| See tipping leverage, not just lists | SIPs (threshold/node/window) attached to interventions with evidence | IPTiP-anchored SIP proposals carrying verbatim evidence claims | Capital can aim at leverage points with a stated trigger horizon |
| Trust the input enough to automate downstream | Results files are deterministic, versioned, hash-manifested | Two-layer validator; third-party re-render/re-verify (G8) | The artifact is infrastructure others build on — wallets, rounds, registries |

**Dependencies / enabling technologies:** Cloudflare edge · Workers AI
(70B instruct, bge, Whisper) · JSON Schema + the semantic validator ·
`tools/run-pipeline.mjs` spec-driven runs · Rooted social-corpus tooling ·
Springforth emit targets · (optional) OpenTimestamps anchoring.

## Go-to-market — work-back plan

Working back from the first paying deployment:

1. **Pilot place.** A UK community foundation or combined authority
   piloting a place-based round; Thorntree is the working example — the
   corpus, readings, and published artifact already exist.
2. **Proposition training.** The facilitator playbook is the productised
   lane: intake channels → review console → facilitated check → publish.
   The engine is already deployed; a pilot exercises it, not builds it.
3. **Commercial model.** Facilitated runs first (pays for the real cost:
   people time), then hosted deployments once a funder wants many places,
   then steward-consented evidence products once corpora are deep enough
   to matter.
4. **Onboarding.** A funder joins by commissioning a run and reading a
   results file — not by deploying software. The demonstrator is the
   sales surface: static, offline, free to open.
5. **Iterate.** Every run feeds the spec/adapter library; each new corpus
   makes the next place cheaper to listen to.
