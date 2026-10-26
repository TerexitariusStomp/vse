# Social data → VSE

Public posts from Bluesky, Nostr and Hive enrich existing places and can
found new ones. The rule that makes this honest: a social post is a story
exactly the way a WhatsApp message is — its text must reach the artifact
**verbatim**, and its `source` is the canonical public URL.

## Source

`/home/terex/Documents/Rooted/apps/indexer` — the "Audience & Identity
Index" (separate data-acquisition repo). Serving layer:

| file | contents |
|---|---|
| `data/serving/posts.parquet` | ~5.7M posts — bsky ~3.5M, nostr ~2.1M, hive ~95k; 90-day window |
| `data/serving/profiles.parquet` | author handles + bios (declared locations live here) |
| `data/serving/entities.parquet` | 167M identity entities (country, address, occupation) |

Posts have **no geo column**. Place-relation is derived two ways:

- **text_match** — the post names the place (or an alias) in its own text.
  This is the strict tier: the words that locate the post are the same
  words that reach the artifact.
- **author_location** — the author's profile bio declares the place; the
  post itself need not name it. Weaker — used sparingly, always labelled
  in the candidates file.

## Provenance

`stories.source` for a social story is the canonical public URL:

- bsky `at://did:plc:X/app.bsky.feed.post/R` → `https://bsky.app/profile/<did>/post/<R>`
- nostr `<hex>` → bech32 `note1…` → `https://njump.me/note1…` (verified
  against `nostr-tools` — see `tools/social/export_posts.py:note_id`)
- hive `author/permlink` → `https://hive.blog/@author/permlink`

The site renders these as linked provenance chips ("bsky · bsky.app") —
a judge can click through to the original public post. Author handles are
public by the platform's own contract; `teller_role` still labels them by
network + role, not identity.

## Tooling (`tools/social/`)

- **`export_posts.py`** — parquet → per-place `candidates/<place>.json`.
  `--places-file places.json` scans the corpus **once** for all places
  (one OR'd query, client-side attribution); normalized-text dedup
  collapses syndicated cross-posts.
- **`density_scan.py`** — raw mention counts per place (coverage report).
- **`community_scan.py`** — corpus-wide community-economy scan: a ~90-term
  EN/ES/PT lexicon (mutual aid, commons, cooperatives, social currencies…)
  filters posts, then a geonames cities5000 gazetteer resolves place
  anchors through locative-context and multi-word matching. The lexicon
  rowset is cached (`.cache/`, keyed on parquet mtime + terms hash) so
  gazetteer tuning is free. Writes `community-report.md` +
  `community-posts.json`.

## Into the engine

Curated candidates are copied to `tools/social/exports/<place>.json` and
referenced from a place spec:

```json
"social_exports": ["tools/social/exports/thorntree.json"],
"stories": [ {"id":"soc-01","teller_role":"bsky · resident","channel":"social",
  "source":"https://bsky.app/…","text":"…verbatim post text…"} ]
```

`tools/run-pipeline.mjs` verifies every story — Springforth or social —
appears verbatim in its corpus before intake, so no post is paraphrased
at the boundary.

## Coverage honesty

The index is a 90-day window with uneven density. Real counts (Oct 2026):
thorntree ~70, kenya-coast ~76, dar-es-salaam ~103, puerto-la-cruz ~124,
hebden-bridge 2, mida-creek ~0. Places with no matching posts get none —
coverage gaps stay documented rather than padded.

## Current social-bearing places

- **puerto-la-cruz** — first social-native place: 17 stories, all public
  posts (Hive residents on power outages, pensioner protests, ferry fares;
  nostr regional press relays).
- **thorntree** — +8 social stories (Teesside news/community posts).
- **kenya-coast** — +8 (Kilifi County flood response, digital hubs).
- **dar-es-salaam** — +8 (Tanzanian civic voice alongside the planting
  records).
