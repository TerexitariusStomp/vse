# Video walkthrough script — ~2:30 auto-recorded

**Rendered output:** `demo-assets/walkthrough.mp4` (1080p, TTS narration
via espeak-ng, recorded against the live deployment) + `walkthrough.srt`.
Re-record with `python3 tools/record-demo-video.py` (needs a Chrome-family
browser on CDP `:9222`; the script PULSEs the compositor so static pages
still emit frames). The `.srt` is regenerated from section timings.

Narration is written for speaking — never spell the URL out loud.
Pause between sections is the edit point.

## Shot list + narration

**(01) Landing** (`/`) — "Every place knows what it needs. The Value
Structuring Engine turns the stories a place tells into signals it has
checked, and the signals into capital legibility. This is the live
deployment — ten places, a hundred ninety one stories, not one
paraphrased." [scroll the step strip + globe]

**(02) A real place** (`/thorntree`) — "Thorntree, a council estate in
east Middlesbrough. Beside its own words sits the official record:
deprivation decile one, thirty four flood-risk areas within fifteen
kilometres, tool-library vouchers on the ledger." [place card + readings
+ diorama]

**(03) Stories** (`/thorntree#stories`) — "The stories arrive as records —
hub notes, vouchers, plan documents, public posts. Underlined passages
are the exact excerpts the engine kept. Provenance chips name the record;
a public post links back to itself." [expand a story]

**(04) Signals** (`/thorntree#signals`) — "Excerpts consolidate into a
handful of signals. Open one and it shows the exact words behind it —
tap a quote and it lands highlighted inside its story. Every claim is a
mechanical slice of the source text; the validator rejects anything
else." [expand a signal, click a quote back to the story]

**(05) The check** (`/thorntree#check`) — "Nothing guides capital until
the people who told the stories have checked it. Endorse, amend, contest
— and a gate: may be priced, commons only, or not yet. Commons is not
price zero; it is a category the system structurally cannot price."
[cast an endorse vote; read the gate control]

**(06) Capital** (`/thorntree#capital`) — "The same verified signals,
structured two ways. From the plans: one project per need. From the
place: interventions answering several at once — and the view names what
it leaves out. Intervention points mark where the system could tip."
[toggle the two views]

**(07) Utopia** (`/utopia`) — "One place is fictional and says so
everywhere. Its diorama carries eight generated voices — press listen and
hear the hill farmer, or the elder's story told in Welsh." [click a
figure under the scene; Listen button if it renders]

**(08) Scale** (`/nairobi`) — "Four of the ten places are founded entirely
on public posts — Nairobi, Detroit, Minneapolis, Puerto la Cruz —
attributed to channel, never to a person. A new place ships as a results
file, not a codebase change." [nairobi card + globe]

**(09) Follow one sentence** (`/#thread`) — "Follow one sentence end to
end: 'we need marsh reeds and planting days volunteers' becomes a signal
the place checked, becomes a marsh regeneration scheme a funder can
answer. The schema, the validator, and every place spec are in the public
repo." [thread row + footer repo link]

## Fallback notes

- If the live site hiccups mid-record: keep narration; the numbered
  screenshots in `demo-assets/` follow the same leg order.
- The Listen beat needs WebGL + the story card to open; the script clicks
  the "Hill farmer" chip under the diorama then the Listen button —
  defensive, skips cleanly if the card doesn't render.
- Never fake the check: visitor votes are memory-only by design; the
  video just casts one.
