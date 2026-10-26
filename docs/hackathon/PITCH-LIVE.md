# Live pitch — 8 minutes (Emerging class)

Timing target: 7:30, leaving buffer. Rehearse with a visible timer; the
demo legs are scripted in `DEMO-SCRIPT.md`. Hard stop at 8:00.

## 0:00–0:40 — The one sentence

> "Place-based investment hears consultants, not the place. VSE helps a
> whole place say what it needs — in its own exact words — in a form that
> can guide capital, without first reducing it to a price. This is the
> live deployment. Ten places, a hundred ninety one real stories, and not
> one of them paraphrased."

Show `/` landing for ~15s — headline, globe, place index.

## 0:40–1:20 — The invariant

> "Every signal keeps the exact words it came from — a mechanical slice
> check, not a promise. When smaller models embellished the source text,
> the gate quarantined every single proposal. That's the moat: lineage you
> can verify, not tone you have to trust."

Point at the step strip on the landing: stories → exact words kept →
the place checks → it guides decisions.

## 1:20–4:50 — Live demo (scripted legs)

Follow `DEMO-SCRIPT.md`. Click path with the one line per leg:

1. `/` — landing, "follow one sentence" thread (30s)
2. `/thorntree` — place card: IMD decile 1, EA flood readings, globe,
   diorama (35s)
3. `/thorntree#stories` — expand a story; underlined excerpts are
   verbatim spans; provenance chips click through to the public post (40s)
4. `/thorntree#signals` — expand a signal; "the exact words behind it";
   tap one, it lands highlighted inside the story (40s)
5. `/thorntree#check` — cast an endorse vote; gate control
   (may be priced / commons only / not yet) (40s)
6. `/thorntree#capital` — toggle From the plans ↔ From the place;
   unreached-signal note; SIP badge → evidence quotes (45s)
7. `/utopia` — diorama, click a figure, Listen (30s) — **say it is
   labelled dummy data; voices are generated**
8. `/nairobi` (or the landing globe) — ten places, four founded entirely
   on public posts (20s)
9. `/#thread` — follow one sentence end to end; repo link (20s)

## 4:50–6:10 — Business model

> "The capital screen is the business case: the same verified signals
> rendered as siloed plans — one project per need — versus place-derived
> interventions answering several at once. Customers are the people who
> already pay for this synthesis badly: community funders, councils,
> place-based investors, philanthropy. The core is open source — Apache-2.0
> — the revenue lane is service and integration: facilitated runs,
> hosted engine deployments, steward tooling. Canvas is in the pack."

## 6:10–7:00 — Feasibility + honesty

> "Deployed, not mocked — the engine ran every place you're seeing
> end-to-end on Cloudflare, and each artifact is hash-manifested in R2.
> Two honest caveats, by design: the verification counts derive from
> recorded participation, not a formal facilitated check — and Utopia is
> fictional, labelled everywhere it appears. The check stage is a
> constitutional gate, so we'd rather show you real provenance than a
> staged vote."

## 7:00–7:30 — Close on impact

> "The criteria ask for demo, business idea, technical implementation,
> datasets, presentation, feasibility, scalability, impact. You just
> watched a live engine turn a hundred ninety one verbatim stories into
> capital legibility — and watched the one thing a market can't buy stay
> protected as a commons. The place already knows what it needs. We built
> the machine that keeps its words intact."

## Judge-Q&A pocket answers

- **"Isn't this just surveys + dashboards?"** — Dashboards aggregate away
  the words. Every claim here is a byte-slice of its story; the validator
  rejects anything else. And a dashboard never asks the tellers whether it
  got it right — ours can't publish unless they check.
- **"Why can't a funder just run an LLM over consultation responses?"**
  — They can; smaller models did exactly that and invented phrasing — our
  span gate caught all of them. Extraction quality commoditises; the
  verification + commons-gate + open-artifact trio doesn't.
- **"What stops a commons signal being priced anyway?"** — Not sentiment:
  a D1 trigger makes the `commons_only → may_be_priced` transition
  unrepresentable, and publish hard-fails 409 if a priced intervention
  references one. It's enforced as data.
- **"Who checked the signals?"** — Recorded participants — tellers via
  magic-link/OTP or a facilitator in the room. Counts are labelled as
  recorded participation, not oversold as a formal deliberation.
- **"Where does the money move?"** — Nowhere here. VSE produces verified
  demand; downstream systems (our sibling Springforth does quorum-bound
  funding) allocate against it. The seam is data-only.
- **"Team?"** — Assembled around this hackathon; engine, schema, validator
  and demonstrator are Apache-2.0, ~2% custom code over a vendored OSS
  stack.
