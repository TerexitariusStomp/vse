#!/usr/bin/env python3
"""Community-economy texture scan.

Two-stage corpus processing over the social index:
  1. filter all posts by a commons/mutual-aid/community-economy lexicon
     (EN + ES/PT — the corpus is heavily LATAM);
  2. resolve which PLACES those posts anchor to: capitalized n-grams in the
     post text checked against a geonames gazetteer (cities5000), plus the
     author's declared bio location as a secondary anchor.

Output:
  tools/social/community-report.md  — places ranked by community-econ posts
  tools/social/community-posts.json — matched posts with resolved places

Usage:
  /home/terex/Documents/Rooted/apps/indexer/.venv/bin/python tools/social/community_scan.py
"""

import json
import os
import re
import sys
import zipfile
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone

import duckdb

INDEXER = "/home/terex/Documents/Rooted/apps/indexer"
GAZ_DIR = "tools/social/gazetteer"
GAZ_TXT = os.path.join(GAZ_DIR, "cities5000.txt")
GAZ_ZIP_URL = "https://download.geonames.org/export/dump/cities5000.zip"

# ---- community-economy lexicon -------------------------------------------
TERMS = [
    # mutual aid & commons
    "mutual aid", "ayuda mutua", "auxílio mútuo", "economía solidaria",
    "economia solidária", "solidarity economy", "gift economy",
    "commoning", "the commons", "los comunes", "bienes comunes",
    # collective provisioning
    "community fridge", "nevera solidaria", "heladera solidaria",
    "olla común", "olla popular", "comedor comunitario", "community kitchen",
    "soup kitchen", "food pantry", "banco de alimentos", "food bank",
    "community garden", "huerta comunitaria", "huerto comunitario",
    "horta comunitária", "community orchard", "gleaning",
    # exchange & credit
    "tool library", "biblioteca de herramientas", "repair cafe", "repair café",
    "time bank", "banco de tiempo", "mutual credit", "crédito mutuo",
    "local currency", "moneda social", "moneda comunitaria", "moeda social",
    "complementary currency", "community currency", "commitment pool",
    "trueque", "seed swap", "clothing swap", "buy nothing", "freecycle",
    "little free pantry", "give box",
    # cooperative structures
    "cooperative", "cooperativa", "co-operative", "workers co-op",
    "worker cooperative", "housing co-op", "food co-op", "cooperative store",
    "community land trust", "cohousing", "ecovillage", "ecoaldea",
    "intentional community", "transition town", "permaculture",
    "consejo comunal", "junta de vecinos", "asamblea vecinal",
    "minga", "mutirão", "tequio", "faena comunitaria", "autogestión",
    "economía popular", "mercado campesino", "feria solidaria",
    "ropero solidario", "solidarity fund", "fondo solidario",
    # everyday collective work
    "community cleanup", "limpieza comunitaria", "community potluck",
    "block party", "neighborhood association", "community organizing",
    "mutual benefit", "meal train", "community resilience",
    "community supported agriculture", "csa farm",
]

# Names that collide with ordinary language or are too generic to anchor.
AMBIGUOUS = {
    "la", "el", "san", "de", "del", "los", "las", "santa", "victoria",
    "reading", "peru", "georgia", "washington", "clinton", "aurora",
    "concord", "salem", "mobile", "nice", "split", "orange", "corona",
    "hope", "union", "liberty", "harmony", "progress", "centro", "norte",
    "sur", "este", "oeste", "central", "nueva", "nuevo", "alta", "baja",
    "puerto", "playa", "villa", "pueblo", "san jose", "santa rosa",
    "valle", "lago", "rio", "monte", "monte alto", "santo", "jose",
    "media", "verde", "robles", "cruz", "flores", "palma", "palmas",
}
# multiword phrases that are safe despite containing ambiguous parts
SAFE_PHRASES = {"puerto la cruz", "mida creek", "dar es salaam", "hebden bridge"}

CAP_NGRAM = re.compile(r"(?<![a-záéíóúñü])([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:[ -][A-ZÁÉÍÓÚÑÜa-záéíóúñü]+){0,3})")

# locative prepositions in the languages the corpus actually speaks
LOCATIVE = re.compile(
    r"(?:^|[\s\"'(\[{])(?:in|en|em|at|de|from|desde|near|cerca de|at|por|para|"
    r"dans|à|zu|im|bei|uit|naar|van|di|a|da|of|based in|living in|here in|"
    r"ubicad[oa]s? en|radicad[oa]s? en)\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü']+"
    r"(?:[ -][A-ZÁÉÍÓÚÑÜa-záéíóúñü']+){0,4})",
    re.UNICODE | re.MULTILINE,
)

# extra words that are capitalized for non-place reasons in posts
FALSE_NAMES = AMBIGUOUS | {
    "real", "mexico", "august", "best", "como", "welcome", "casino",
    "green", "most", "palestine", "brazil", "china", "colombia", "columbia",
    "luxembourg", "street", "stone", "friendly", "midori", "kazygurt",
    "inđija", "india", "indien", "inde", "mora", "el banco", "la cañada",
    "marquette", "wörth am rhein", "trans-en-provence", "madison",
    "muerte", "tierra", "madre", "compassion", "community", "mutual",
    "solidarity", "cooperative", "américa", "america", "venezuela", "cuba",
    "argentina", "chile", "peru", "canada", "panama", "jamaica", "bolivia",
    "ecuador", "paraguay", "uruguay", "guinea", "togo", "benin", "mali",
    "chad", "niger", "congo", "sudan", "jordan", "lebanon", "ireland",
    "turkey", "greece", "cyprus", "malta", "monaco", "trinidad", "barbados",
    "grenada", "dominica", "samoa", "tonga", "fiji", "vanuatu", "kiribati",
    "palau", "nauru", "tuvalu", "georgia", "guiana", "guyana", "haiti",
    "honduras", "nicaragua", "salvador", "bahamas", "belize", "suriname",
    "senegal", "gambia", "angola", "zambia", "malawi", "rwanda", "uganda",
    "kenya", "tanzania", "somalia", "eritrea", "djibouti", "ethiopia",
    "cameroon", "gabon", "liberia", "ghana", "nigeria", "burundi",
    "mauritania", "tunisia", "algeria", "morocco", "libya", "egypt",
    "israel", "syria", "iraq", "iran", "yemen", "oman", "qatar",
    "bahrain", "kuwait", "emirates", "arabia", "afghanistan", "pakistan",
    "bangladesh", "nepal", "bhutan", "maldives", "lanka", "myanmar",
    "thailand", "laos", "vietnam", "cambodia", "malaysia", "indonesia",
    "philippines", "taiwan", "korea", "japan", "mongolia", "kazakhstan",
    "uzbekistan", "turkmenistan", "kyrgyzstan", "tajikistan", "armenia",
    "azerbaijan", "belarus", "ukraine", "russia", "poland", "hungary",
    "romania", "bulgaria", "serbia", "croatia", "bosnia", "albania",
    "macedonia", "montenegro", "slovenia", "slovakia", "moldova",
    "lithuania", "latvia", "estonia", "finland", "sweden", "norway",
    "denmark", "iceland", "portugal", "spain", "france", "italy",
    "austria", "switzerland", "belgium", "netherlands", "germany",
    "austria", "ireland", "wales", "scotland", "england", "britain",
    "australia", "zealand", "africa", "europe", "asia", "homeland",
    "muerte", "palestine", "israel", "gaza", "jerusalem",
}


def load_gazetteer():
    if not os.path.exists(GAZ_TXT):
        os.makedirs(GAZ_DIR, exist_ok=True)
        zp = os.path.join(GAZ_DIR, "cities5000.zip")
        print("fetching geonames cities5000…")
        urllib.request.urlretrieve(GAZ_ZIP_URL, zp)
        zipfile.ZipFile(zp).extractall(GAZ_DIR)
    names = {}  # normalized -> (display, country, pop)
    with open(GAZ_TXT, encoding="utf-8") as f:
        for line in f:
            c = line.rstrip("\n").split("\t")
            if len(c) < 19:
                continue
            name, asci, alts, country, pop = c[1], c[2], c[3].split(","), c[8], int(c[14] or 0)
            for n in [name, asci, *alts[:6]]:
                if not n or len(n) < 4:
                    continue
                key = n.lower()
                if key in AMBIGUOUS and key not in SAFE_PHRASES:
                    continue
                # keep the highest-pop record per name
                if key not in names or pop > names[key][2]:
                    names[key] = (name, country, pop)
    return names


def _candidates(span):
    """right-trim a capitalized span into candidate name keys, longest first."""
    words = span.replace("-", " ").split()
    return [" ".join(words[:k]).lower() for k in range(len(words), 0, -1)]


def places_in(text, names):
    """A place anchors only if (a) it follows a locative preposition, or
    (b) it is a multi-word name that isn't an ordinary-language phrase."""
    found = []
    # (a) locative-context matches — single words allowed
    for m in LOCATIVE.finditer(text):
        for cand in _candidates(m.group(1)):
            if cand in FALSE_NAMES:
                break
            if cand in names:
                found.append(names[cand])
                break
    # (b) capitalized n-grams — multi-word names are distinctive; single words
    # need ≥5 chars (catches Frome/Detroit, drops Best/Como/Most)
    for m in CAP_NGRAM.finditer(text):
        for cand in _candidates(m.group(1)):
            if cand in FALSE_NAMES:
                break
            if " " not in cand and len(cand) < 5:
                continue
            if cand in names:
                found.append(names[cand])
                break
    for phrase in SAFE_PHRASES:
        if phrase in text.lower() and phrase in names:
            found.append(names[phrase])
    seen, out = set(), []
    for name, cc, pop in found:
        if (name, cc) not in seen:
            seen.add((name, cc))
            out.append((name, cc, pop))
    return out


def main():
    posts = os.path.join(INDEXER, "data/serving/posts.parquet")
    profiles = os.path.join(INDEXER, "data/serving/profiles.parquet")
    names = load_gazetteer()
    print(f"{len(names)} place names loaded")

    # The lexicon LIKE pass over 5.7M rows is the expensive part; the
    # geonames matching that follows is what gets iterated on. Cache the
    # matched rowset keyed on corpus mtime + lexicon so re-tuning filters
    # is free.
    import hashlib, pickle
    cache_key = hashlib.sha1(
        (str(os.path.getmtime(posts)) + "|" + "|".join(sorted(TERMS))).encode()
    ).hexdigest()[:16]
    cache_path = f"tools/social/.cache/community-rows-{cache_key}.pkl"
    if os.path.exists(cache_path):
        with open(cache_path, "rb") as f:
            rows = pickle.load(f)
        print(f"{len(rows)} community-economy posts (cached rowset)")
    else:
        con = duckdb.connect()
        like = " OR ".join(f"lower(text) LIKE '%{t}%'" for t in TERMS)
        rows = con.execute(
            f"SELECT p.id, p.network, p.author, p.ts, p.text, pr.bio "
            f"FROM '{posts}' p LEFT JOIN '{profiles}' pr "
            f"ON p.network=pr.network AND p.author=pr.author WHERE {like}"
        ).fetchall()
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, "wb") as f:
            pickle.dump(rows, f)
        print(f"{len(rows)} community-economy posts")

    by_place = defaultdict(list)   # (name, cc) -> post idx list
    matched_posts = []
    for i, (pid, network, author, ts, text, bio) in enumerate(rows):
        places = places_in(text, names)
        reason = "text_match"
        if not places and bio:
            places = places_in(bio, names)
            reason = "author_location"
        if not places:
            continue
        for name, cc, pop in places:
            by_place[(name, cc)].append(i)
        matched_posts.append({
            "id": pid, "network": network, "author": author,
            "ts": ts, "text": text, "match_reason": reason,
            "places": [{"name": n, "country": c, "pop": p} for n, c, p in places],
        })

    ranked = sorted(by_place.items(), key=lambda kv: -len(kv[1]))
    print(f"{len(matched_posts)} posts anchored to {len(by_place)} places")
    print(f"\n{'place':<28} {'cc':<3} {'posts':>6}")
    for (name, cc), idxs in ranked[:40]:
        print(f"{name:<28} {cc:<3} {len(idxs):>6}")

    with open("tools/social/community-posts.json", "w") as f:
        json.dump({"generated": datetime.now(timezone.utc).isoformat(),
                   "scanned": len(rows), "anchored": len(matched_posts),
                   "posts": matched_posts}, f, indent=1, ensure_ascii=False)

    lines = ["# Community-economy voice coverage", "",
             f"_{datetime.now(timezone.utc).isoformat()} · {len(rows)} posts matched lexicon, "
             f"{len(matched_posts)} anchored to {len(by_place)} places_", "",
             "| place | cc | posts |", "|---|---|---|"]
    lines += [f"| {n} | {c} | {len(i)} |" for (n, c), i in ranked[:60]]
    with open("tools/social/community-report.md", "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
