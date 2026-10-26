# Demo script — the live legs inside the 8-minute pitch

Base: https://vse-demonstrator.pages.dev (no login, works on a phone —
the whole site is a static PWA reading published results files).

This is the demo portion of `PITCH-LIVE.md` (~3.5 min inside the pitch,
leaving the business model and close for talk). Each leg ends on a line
that maps to a judging criterion. `*` marks the 2-minute short cut.

1. **Landing** (`/`) — "Every place knows what it needs." Globe of the
   ten places, the four-step strip counting up (191 stories → 283
   excerpts → 60 signals → 51 interventions), and the follow-one-sentence
   thread: quote → signal → intervention. *Criteria: demo, presentation.*
   30s. `*`
2. **The place** (`/thorntree`) — chapter 01 card: "Geographical Area +
   Info · Real data". Official-record strip (IMD-2025 decile 1 —
   score 66.9, rank 461/33,755; 34 EA flood-risk areas ≤15km; 12 Sarafu
   tool-library voucher transactions), globe centred on Teesside, 3D
   diorama of the estate. *Criterion: feasibility — real place, real
   readings.* 35s. `*`
3. **Stories** (`/thorntree#stories`) — the ledger of voices, role +
   channel only. Expand a hub member's story: underlined passages are the
   verbatim excerpts the engine kept; provenance chips name the record
   (hub action, voucher, council plan); social stories carry a
   "public post" chip that links to the original. *Criterion: use of
   datasets.* 40s. `*`
4. **Signals** (`/thorntree#signals`) — six statements with voices +
   excerpts counts and gate dots. Expand "The beck and the marsh need
   hands, reeds and a scheme" → "the exact words behind it" lists every
   supporting quote; tap one and it lands highlighted *in place* inside
   the story. `story.text.slice(span) === claim.text`, mechanically. *
   Criterion: technical implementation — lineage, not vibes.* 40s. `*`
5. **The check** (`/thorntree#check`) — endorse/amend/contest bars per
   signal plus the live vote control: cast an endorse, watch the tally
   move (memory only — reload resets). Gate control offers *May be
   priced / Commons only (never priced) / Not yet*; amendments render as
   quotes. Fixed line on screen: *nothing guides capital until the people
   who told the stories have checked it.* *Criteria: demo + technical —
   the constitutional gate, visible.* 40s.
6. **Where capital goes** (`/thorntree#capital`) — the two-way mirror:
   toggle *From the plans* (one project per need, avg 1.0) ↔ *From the
   place* (multi-need, avg 1.8; Utopia shows the full 3.0). The coral
   "this view never reaches" note names the signals the plans leave out —
   derived, not hard-coded. SIP badges open threshold/node/window panels
   with their own evidence quotes. Commons-gated signals never appear on
   a priced intervention. *Criterion: business idea — joining-up made
   measurable.* 45s. `*`
7. **Utopia** (`/utopia`) — the labelled fictional place: full diorama,
   eight figures. Click "Hill farmer" (figure or the labelled button
   under the scene) → the story card opens → **Listen** plays the
   generated voice. Honesty beat: "Dummy data" is stamped on the chapter
   marker and the landing index — the Welsh-told elder is in there too.
   *Criterion: presentation — the memorable beat.* 30s. `*`
8. **Scale** (`/nairobi`, or back to `/` and hover the place list under
   the globe) — ten places: five from field records (Middlesbrough,
   Kenya coast, Mida Creek, Hebden Bridge, Dar es Salaam), four founded
   entirely on public posts (Puerto la Cruz, Minneapolis, Nairobi,
   Detroit), one fictional. New places ship as a results file, not a
   codebase change. *Criteria: scalability, impact potential.* 20s.
9. **The thread home** (`/#thread`) — follow one sentence end-to-end:
   "We need marsh reeds and planting days volunteers" → the beck/marsh
   signal → the marsh regeneration intervention. Footer links to the
   GitHub repo — schema, validator, specs that reproduce every run.
   *Criteria: feasibility, technical.* 20s. `*`

**Backup:** `docs/hackathon/demo-assets/` screenshots `01`–`09` are
numbered in this order; `10-mobile.png` shows the phone view. If live
hiccups: walk the PNGs and narrate the same beats — the site is an
offline-capable PWA, so a cached tab usually survives bad wifi anyway.
