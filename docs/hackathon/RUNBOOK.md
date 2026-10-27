# Pitch-morning runbook — Oct 28

> **Schedule** (per the sibling springforth runbook, same event):
> submissions **Oct 27, 2–3 PM** · pitches **Oct 28, 10 AM–12 PM** ·
> judging 1–2 PM · awards 3–4 PM. **8 minutes per team**, hard stop —
> `PITCH-LIVE.md` targets 7:30; `DEMO-SCRIPT.md` is the live portion.
> The 2:30 captioned video is the fallback.

## Pre-flight (10 min before)

```bash
cd ~/CascadeProjects/vse

# 1. Verify the live surfaces are green
curl -s https://vse-engine.delta-git.workers.dev/health        # {"ok":true}
curl -s -o /dev/null -w "%{http_code}\n" \
  https://vse-demonstrator.pages.dev/                          # 200

# 2. All ten place routes (one page per place)
for p in thorntree kenya-coast mida-creek hebden-bridge dar-es-salaam \
         puerto-la-cruz minneapolis nairobi detroit utopia; do
  curl -s -o /dev/null -w "%{http_code} /$p\n" \
    "https://vse-demonstrator.pages.dev/$p"
done

# 3. Engine artifacts still served from R2
curl -s https://vse-engine.delta-git.workers.dev/api/published/thorntree \
  | python3 -c "import json,sys; d=json.load(sys.stdin); \
    print(d['meta']['version'], d['meta']['manifest_sha256'][:12])"

# 4. Published files still validate
npm run validate        # all ten: valid

# 5. QR for the room — opens the landing page
xdg-open docs/hackathon/demo-assets/join-qr.png

# 6. Legacy links still work (judge may have an old ?place= URL)
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://vse-demonstrator.pages.dev/?place=thorntree"        # 200
```

## If the live site hiccups

- The site is a **static PWA** — a tab that already loaded works fully
  offline. Open `/thorntree` and `/utopia` in tabs *before* the pitch.
- Pages redeploy: `cd site && npm run build && npx wrangler pages deploy
  dist --project-name vse-demonstrator` (needs the Widespread account).
- Full fallback: `demo-assets/` screenshots numbered in demo-script
  order, or `demo-assets/walkthrough.mp4` (2:30, captioned `.srt`).
- If `index.json` counts drifted since these docs were written, re-derive
  them (`python3 - <<…` sum `counts` per place) and re-record the video
  (`python3 tools/record-demo-video.py`).

## During the pitch

- Demo order: `DEMO-SCRIPT.md` (nine legs; `*` marks the 2-min short cut).
- Landing: let the step strip count up — 191 stories, 283 excerpts,
  60 signals, 51 interventions are *derived from the data*, not copy.
- Thorntree card: the readings strip is the treasurer beat — IMD
  decile 1 and 34 flood-risk areas sit next to the residents' sentences.
- `#signals`: tap a quote, land inside the story highlighted — that's the
  invariant, say it out loud.
- `#check`: cast a vote live; name the three gate states; say the commons
  gate is enforced in the database and at publish (409), not displayed.
- `#capital`: toggle the views; read the "never reaches" note aloud.
- `/utopia`: say *labelled fictional* before pressing Listen — the honesty
  is part of the demo.
- Close on `/#thread`: one sentence, traced end to end; repo in footer.

## Submission pack — Shared tab, Oct 27 2–3 PM

- [ ] `docs/hackathon/BMC.md` — Business Model Canvas (their 9 blocks)
- [ ] `docs/hackathon/PITCH.md` — pitch notes (rubric-mapped)
- [ ] `docs/hackathon/ARCHITECTURE.md` + `demo-assets/architecture.svg`
      — logical architecture
- [ ] `docs/hackathon/DATA-SOURCES.md` — per-place provenance matrix
- [ ] Live demo URL: `https://vse-demonstrator.pages.dev`
- [ ] `demo-assets/walkthrough.mp4` — 2:30 captioned walkthrough
- [ ] Repo link: github.com/TerexitariusStomp/vse (AGPL-3.0-only)

### Ready-to-paste post

> **PS1 submission: VSE — the Value Structuring Engine**
>
> VSE helps a whole place say what it needs — in its own exact words —
> in a form that can guide capital without first reducing it to a price.
> Every signal keeps the verbatim excerpt it came from (a mechanical
> slice check, enforced at extraction, at publish, and by a standalone
> validator); the people who told the stories check the signals before
> anything guides capital; and signals gated commons-only are
> structurally unpriceable — the publish step returns 409 if a priced
> intervention touches one.
>
> - **Live demo**: https://vse-demonstrator.pages.dev — ten places,
>   191 verbatim stories; `/thorntree#signals` shows the lineage,
>   `/thorntree#capital` the two-way mirror, `/utopia` the generated
>   voices (labelled fictional)
> - **Code + docs**: https://github.com/TerexitariusStomp/vse
>   (AGPL-3.0-only; BMC, pitch, architecture, data sources under
>   `docs/hackathon/`; engine live at
>   `vse-engine.delta-git.workers.dev/health`)
> - **Walkthrough video** (2:30, captioned): attached / link below
>
> Happy to walk any reviewer through the validator or a live place spec.

## After

- Re-anchor or republish nothing unless content changed — published
  files are immutable; corrections ship a new version.
- File the demo-count deltas (if any) back into `site/public/data/
  index.json` via `node tools/build-places-index.mjs`.
