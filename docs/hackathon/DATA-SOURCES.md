# Data sources — per-place provenance

Every story in every published results file is **verbatim source text** —
`tools/run-pipeline.mjs` verifies each against its corpus before intake
and fails the run otherwise. No story is paraphrased at the boundary.
This file complements `docs/SOCIAL-DATA.md` (the social-corpus
methodology) rather than duplicating it.

Totals (live `site/public/data/index.json`, regenerated at publish):
**10 places · 191 stories · 283 verbatim excerpts · 60 signals ·
51 interventions.**

## Field-record places (Springforth-consumed corpora)

| Place | Stories | What's in it | Source records |
|---|---|---|---|
| **Thorntree** (east Middlesbrough council estate) | 22 (14 facilitated + 8 social) | Community-hub records, a Sarafu tool-library voucher, council/CVL plan documents, Teesside public posts | `holons:thorntree` hub offer/need/action/membrane; `oneplanet:plan-cvl-thorntree`; `csv:` Middlesbrough Council + CVL community-needs; `sarafu.network` voucher TTOOL; 8 bsky posts |
| **Kenya coast** (Kwale → Kilifi) | 28 (20 facilitated + 8 social) | Sarafu voucher commitments, possibility cards + completion report, county plan text, the ROLA commitment pool (141 vouchers, 1,640 swaps — a real commons instrument) | 9 `sarafu.network` vouchers + pool ROLA; `possibility`/`plannode` records (kwale-mangrove, mida-creek); `csv:kilifi-county` outcome + action; `treegens:live`; ledger entry; 8 nostr/bsky posts |
| **Mida Creek** (Kilifi County) | 19 facilitated | The 1,200-propagule mangrove planting: needs, offers, a $500 matching round with 12 recorded donations, county + conservation plans | `treegens:archive` plannodes; `poss-mida-creek-mangrove` card + need/offer nodes; `round-mida-creek`; `oneplanet:plan-mida-creek`; `csv:kilifi-county` |
| **Hebden Bridge** (Calderdale) | 12 facilitated | A mutual-aid flood-response prep day (needs, offers, participants) plus a peer ValueFlows network's commitments — a real need↔commitment overlap | `poss-hebden-flood-response` card + plannodes; `vf:playnet-demo` ValueFlows intents/commitments |
| **Dar es Salaam** (coast) | 34 (26 facilitated + 8 social) | Treegens planting records — app-verified *and* pre-app field-team — plus civic voice posts; an evidence-graded feed where the biggest claims are the least verified | `treegens:` records (app + field team); bsky/nostr/hive posts |

## Social-founded places (public posts only)

Public posts from Bluesky, Nostr and Hive, drawn from the Rooted
audience-identity index (~5.7M posts, 90-day window). Place-relation is
**text_match first** (the post names the place in its own text);
`author_location` is weaker and always labelled. Every story's `source`
is the canonical public URL — click-through provenance on the site.
Attribution is to *channel*, never to a person.

| Place | Stories | Corpus |
|---|---|---|
| **Puerto la Cruz** | 17 | Hive residents on power rationing, pensioner protests, ferry fares; nostr regional-press relays |
| **Minneapolis** | 18 | bsky posts on Operation Metro Surge — the Stolen Neighbors Quilt, Minnesota 15, volunteer ALPR mapping |
| **Nairobi** | 19 | nostr + bsky: Kanairo CBD street hustle and Kibera's Bitcoin circular economy under water cuts |
| **Detroit** | 14 | bsky: jobs moved to the suburbs, neighborhood institutions, residents documenting their own city |

Social stories also enrich three field-record places: thorntree +8,
kenya-coast +8, dar-es-salaam +8 — see `docs/SOCIAL-DATA.md` for coverage
honesty (the 90-day window is uneven; places with no matching posts get
none rather than padding).

## The fictional place — labelled everywhere

| Place | Stories | Status |
|---|---|---|
| **Utopia** | 8 | **Invented.** The schema's reference example: hill farmer, head teacher, young person, flood volunteer, elder (told in Welsh, translated), café organiser, social prescriber, councillor. Labelled "Dummy data" on its chapter marker and the landing index; the eight diorama voices are generated audio (`site/public/audio/utopia/`). |

## Official-record readings (context layer)

`place.readings` renders the official record beside the place's own
words — context, never a gate:

| Place | Reading | Source |
|---|---|---|
| Thorntree | IMD deprivation decile **1/10** (score 66.9, rank 461/33,755, LSOA Middlesbrough 010D) | English Indices of Deprivation 2025 — OGL |
| Thorntree | 34 flood-risk areas within 15km | EA Flood Monitoring — OGL (fetched 2026-10-25) |
| Thorntree | 12 tool-library voucher transactions | sarafu.network public indexer |
| Dar es Salaam | app planting records vs pre-app field-team plots | Treegens registry |
| Social places | candidate counts in the indexer window | `tools/social/density_scan.py` |

## Facilitated vs recorded — the honesty line

- **Verification counts derive from recorded participation**, not a
  formal facilitated check — `_about` and the site label them as such.
  For the social-founded places the check reflects recorded responses
  gathered by the pipeline, not a convened room.
- **Amendments and contest votes render** — counter-evidence is output,
  not moderation.
- Every published file carries `meta.manifest_sha256`; re-verify with
  `node tools/validate-results.mjs <file>` — schema + span + refs +
  derived counts + gates + withdrawal integrity.
