#!/usr/bin/env python3
"""Export place-related social posts from the Rooted audience-identity index.

Reads the serving parquet layer (posts/profiles) and emits a candidates file
of posts that are *directly* related to a place — either the post text names
the place (or an alias), or the author's declared profile location matches.

Usage:
  /home/terex/Documents/Rooted/apps/indexer/.venv/bin/python \
    tools/social/export_posts.py --place thorntree \
      --aliases thorntree middlesbrough teesside \
      --author-terms middlesbrough teesside

Output: tools/social/candidates/<place>.json — candidate records for curation.
Curated subsets are copied to tools/social/exports/<place>.json and become the
spec corpus (tools/run-pipeline.mjs verifies story text is verbatim).
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

import duckdb

DEFAULT_INDEXER = "/home/terex/Documents/Rooted/apps/indexer"
BECH32_ALPHABET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"


def _bech32_polymod(values):
    chk = 1
    for v in values:
        top = chk >> 25
        chk = (chk & 0x1FFFFFF) << 5 ^ v
        for i, g in enumerate([0x3B6A57B2, 0x26508E6D, 0x1EA119FA, 0x3D4233DD, 0x2A1462B3]):
            if (top >> i) & 1:
                chk ^= g
    return chk


def _bech32_encode(hrp, data5):
    values = [ord(c) >> 5 for c in hrp] + [0] + [ord(c) & 31 for c in hrp]
    const = _bech32_polymod(values + data5 + [0] * 6) ^ 1
    checksum = [(const >> 5 * (5 - i)) & 31 for i in range(6)]
    return hrp + "1" + "".join(BECH32_ALPHABET[d] for d in data5 + checksum)


def note_id(hex_str):
    """Hex event id -> NIP-19 note1... bech32."""
    b = bytes.fromhex(hex_str)
    data5, acc, bits = [], 0, 0
    for byte in b:
        acc = (acc << 8) | byte
        bits += 8
        while bits >= 5:
            bits -= 5
            data5.append((acc >> bits) & 31)
    if bits:
        data5.append((acc << (5 - bits)) & 31)
    return _bech32_encode("note", data5)


def post_url(row):
    """Canonical public URL for a post record."""
    pid, network, author, handle = row["id"], row["network"], row["author"], row.get("handle")
    if network == "bsky":
        # id: bsky:at://did:plc:X/app.bsky.feed.post/RKEY
        rkey = pid.rsplit("/", 1)[-1]
        who = handle or author
        return f"https://bsky.app/profile/{who}/post/{rkey}"
    if network == "nostr":
        return f"https://njump.me/{note_id(pid.split(':', 1)[1])}"
    if network == "hive":
        # id: hive:author/permlink
        slug = pid.split(":", 1)[1]
        return f"https://hive.blog/@{slug}"
    return pid


def _norm_text(t):
    """Dedup key: syndicated posts repeat verbatim across networks."""
    return " ".join((t or "").lower().split())


def _record(pid, network, author, ts, text, handle, bio, reason):
    rec = {
        "id": pid, "network": network, "author": author,
        "handle": handle or author,
        "ts": datetime.fromtimestamp(ts / 1000 if ts > 1e12 else ts, tz=timezone.utc).isoformat(),
        "text": text, "match_reason": reason,
        "author_bio": (bio or "")[:200],
    }
    rec["url"] = post_url(rec)
    return rec


def export_place(con, posts, profiles, place, aliases, author_terms, min_text, limit):
    """One place's candidates: text-match tier + author-location tier."""
    alias_pred = " OR ".join(f"lower(text) LIKE '%{a.lower().replace(chr(39), '')}%'" for a in aliases)
    tier1 = con.execute(f"""
        SELECT p.id, p.network, p.author, p.ts, p.text,
               coalesce(nullif(pr.name, ''), nullif(pr.author, '')) AS handle,
               pr.bio
        FROM '{posts}' p
        LEFT JOIN '{profiles}' pr ON p.network = pr.network AND p.author = pr.author
        WHERE ({alias_pred}) AND length(p.text) >= {min_text}
        ORDER BY p.ts DESC LIMIT {limit}
    """).fetchall()
    tier2 = []
    if author_terms:
        bio_pred = " OR ".join(f"lower(pr.bio) LIKE '%{t.lower().replace(chr(39), '')}%'" for t in author_terms)
        tier2 = con.execute(f"""
            SELECT p.id, p.network, p.author, p.ts, p.text,
                   coalesce(nullif(pr.name, ''), nullif(pr.author, '')) AS handle,
                   pr.bio
            FROM '{posts}' p
            JOIN '{profiles}' pr ON p.network = pr.network AND p.author = pr.author
            WHERE ({bio_pred}) AND NOT ({alias_pred}) AND length(p.text) >= {min_text}
            ORDER BY p.ts DESC LIMIT {limit}
        """).fetchall()

    seen_ids, seen_texts, records = set(), set(), []
    for rows, reason in ((tier1, "text_match"), (tier2, "author_location")):
        for pid, network, author, ts, text, handle, bio in rows:
            if pid in seen_ids or _norm_text(text) in seen_texts:
                continue
            seen_ids.add(pid)
            seen_texts.add(_norm_text(text))
            records.append(_record(pid, network, author, ts, text, handle, bio, reason))
    return tier1, tier2, records


def export_multi(con, posts, profiles, places, min_text, limit):
    """All places in ONE scan: fetch rows matching any alias/term once,
    then attribute + dedup client-side."""
    all_aliases = [a for pl in places for a in pl["aliases"]]
    all_terms = [t for pl in places for t in pl.get("author_terms", [])]
    alias_pred = " OR ".join(f"lower(text) LIKE '%{a.lower().replace(chr(39), '')}%'" for a in all_aliases)
    cols = ("p.id, p.network, p.author, p.ts, p.text, "
            "coalesce(nullif(pr.name, ''), nullif(pr.author, '')) AS handle, pr.bio")
    text_rows = con.execute(f"""
        SELECT {cols} FROM '{posts}' p
        LEFT JOIN '{profiles}' pr ON p.network = pr.network AND p.author = pr.author
        WHERE ({alias_pred}) AND length(p.text) >= {min_text}
        ORDER BY p.ts DESC LIMIT {limit * len(places)}
    """).fetchall()
    bio_rows = []
    if all_terms:
        bio_pred = " OR ".join(f"lower(pr.bio) LIKE '%{t.lower().replace(chr(39), '')}%'" for t in all_terms)
        bio_rows = con.execute(f"""
            SELECT {cols} FROM '{posts}' p
            JOIN '{profiles}' pr ON p.network = pr.network AND p.author = pr.author
            WHERE ({bio_pred}) AND NOT ({alias_pred}) AND length(p.text) >= {min_text}
            ORDER BY p.ts DESC LIMIT {limit * len(places)}
        """).fetchall()

    out = {}
    for pl in places:
        aliases = [a.lower() for a in pl["aliases"]]
        terms = [t.lower() for t in pl.get("author_terms", [])]
        seen_ids, seen_texts, records = set(), set(), []
        for row, reason in ((text_rows, "text_match"), (bio_rows, "author_location")):
            for pid, network, author, ts, text, handle, bio in row:
                lower, biol = text.lower(), (bio or "").lower()
                if any(a in lower for a in aliases):
                    reason = "text_match"
                elif not any(t in biol for t in terms):
                    continue
                if pid in seen_ids or _norm_text(text) in seen_texts:
                    continue
                seen_ids.add(pid)
                seen_texts.add(_norm_text(text))
                records.append(_record(pid, network, author, ts, text, handle, bio, reason))
        out[pl["place"]] = records
    return out


def write_place(path, place, aliases, author_terms, records, indexer):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc = {
        "place": place, "aliases": aliases, "author_terms": author_terms,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "indexer": indexer, "count": len(records), "candidates": records,
    }
    with open(path, "w") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--place")
    ap.add_argument("--aliases", nargs="+",
                    help="names the place is directly called in post text")
    ap.add_argument("--author-terms", nargs="*", default=[],
                    help="terms that mark an author as place-local in profile bio")
    ap.add_argument("--places-file",
                    help="JSON: [{place, aliases, author_terms}] — one scan for all places")
    ap.add_argument("--indexer", default=DEFAULT_INDEXER)
    ap.add_argument("--out", default=None)
    ap.add_argument("--min-text", type=int, default=40,
                    help="drop posts shorter than this — headlines/links aren't stories")
    ap.add_argument("--limit", type=int, default=500)
    args = ap.parse_args()
    if not args.places_file and not (args.place and args.aliases):
        ap.error("either --place + --aliases, or --places-file")

    serving = os.path.join(args.indexer, "data", "serving")
    posts = os.path.join(serving, "posts.parquet")
    profiles = os.path.join(serving, "profiles.parquet")
    for f in (posts, profiles):
        if not os.path.exists(f):
            sys.exit(f"missing {f} — is the indexer serving layer built?")

    con = duckdb.connect()
    if args.places_file:
        places = json.load(open(args.places_file))
        results = export_multi(con, posts, profiles, places, args.min_text, args.limit)
        for pl in places:
            path = os.path.join("tools/social/candidates", f"{pl['place']}.json")
            write_place(path, pl["place"], pl["aliases"], pl.get("author_terms", []),
                        results[pl["place"]], args.indexer)
            print(f"{pl['place']}: {len(results[pl['place']])} candidates -> {path}")
        return

    out_path = args.out or os.path.join("tools/social/candidates", f"{args.place}.json")
    tier1, tier2, records = export_place(
        con, posts, profiles, args.place, args.aliases, args.author_terms,
        args.min_text, args.limit)
    write_place(out_path, args.place, args.aliases, args.author_terms, records, args.indexer)
    print(f"{args.place}: {len(tier1)} text-match + {len(tier2)} author-location -> {out_path}")


if __name__ == "__main__":
    main()
