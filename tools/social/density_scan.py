#!/usr/bin/env python3
"""Scan the social index for place-name mention density.

Single pass over all serving posts, counting direct mentions of candidate
place names. Writes tools/social/coverage-report.md ranking candidates —
used to pick a new VSE place where the social corpus is dense.

Usage:
  /home/terex/Documents/Rooted/apps/indexer/.venv/bin/python tools/social/density_scan.py \
      [--candidates-file tools/social/place-candidates.json] [--out tools/social/coverage-report.md]
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

import duckdb

DEFAULT_INDEXER = "/home/terex/Documents/Rooted/apps/indexer"

# Seed list — regen/community-economy relevant places + known-dense metros.
# Extend via --candidates-file {"place": [aliases...]}.
DEFAULT_CANDIDATES = {
    "denver": ["denver", "boulder", "colorado springs"],
    "detroit": ["detroit"],
    "nairobi": ["nairobi", "kibera", "mathare"],
    "barcelona": ["barcelona", "catalunya"],
    "johannesburg": ["johannesburg", "joburg", "soweto"],
    "cambridge": ["cambridge uk", "cambridge, uk"],
    "hebden-bridge": ["hebden bridge", "calder valley", "mytholmroyd"],
    "glastonbury": ["glastonbury"],
    "totnes": ["totnes"],
    "mombasa": ["mombasa"],
    "camargue": ["camargue", "the crau"],
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--candidates-file", default=None)
    ap.add_argument("--indexer", default=DEFAULT_INDEXER)
    ap.add_argument("--out", default="tools/social/coverage-report.md")
    ap.add_argument("--min-text", type=int, default=40)
    args = ap.parse_args()

    places = DEFAULT_CANDIDATES
    if args.candidates_file:
        places = json.load(open(args.candidates_file))

    posts = os.path.join(args.indexer, "data", "serving", "posts.parquet")
    if not os.path.exists(posts):
        sys.exit(f"missing {posts}")

    con = duckdb.connect()
    # one pass: pull id, network, text once; match in python (cheap for ~6M rows)
    rows = con.execute(
        f"SELECT id, network, lower(text) FROM '{posts}' WHERE length(text) >= {args.min_text}"
    ).fetchall()

    # alias -> place lookup; count per place/network, collect 5 sample ids
    hits = {p: {"total": 0, "bsky": 0, "nostr": 0, "hive": 0, "samples": []} for p in places}
    norm = {p: [a.lower() for a in aliases] for p, aliases in places.items()}
    for pid, network, text in rows:
        for place, aliases in norm.items():
            for a in aliases:
                if a in text:
                    h = hits[place]
                    h["total"] += 1
                    h[network] = h.get(network, 0) + 1
                    if len(h["samples"]) < 5:
                        h["samples"].append((pid, text[:100]))
                    break  # one alias hit per place per post

    ranked = sorted(hits.items(), key=lambda kv: -kv[1]["total"])
    lines = [
        "# Social corpus place coverage",
        "",
        f"_generated {datetime.now(timezone.utc).isoformat()} from {posts} "
        f"({len(rows)} posts ≥{args.min_text} chars, 90-day serving window)_",
        "",
        "| place | posts | bsky | nostr | hive |",
        "|---|---|---|---|---|",
    ]
    for place, h in ranked:
        lines.append(f"| {place} | {h['total']} | {h.get('bsky',0)} | {h.get('nostr',0)} | {h.get('hive',0)} |")
    lines.append("")
    lines.append("Direct text-name mentions only — no author-location or thematic matches.")
    lines.append("News-bot reposts inflate counts; `export_posts.py` output must be curated.")

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        f.write("\n".join(lines) + "\n")
    for place, h in ranked:
        print(f"{place:16} {h['total']:5}  bsky={h.get('bsky',0)} nostr={h.get('nostr',0)} hive={h.get('hive',0)}")
    print(f"\n-> {args.out}")


if __name__ == "__main__":
    main()
