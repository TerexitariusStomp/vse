#!/usr/bin/env python3
"""Generate VSE place specs from curated social-corpus candidates.

Each place's PICK maps signal keys to verbatim substrings that identify the
candidate posts; stories are emitted verbatim (the runner re-verifies them
against the export corpus anyway). Provenance URL flows through `source`.

Usage:
  /home/terex/Documents/Rooted/apps/indexer/.venv/bin/python tools/social/build_specs.py
"""
import json, os, sys
from datetime import datetime, timezone

ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
CAND = os.path.join(ROOT, "tools/social/candidates")


def role(c):
    h = (c.get("handle") or "").split("@")[-1][:24]
    return f"{c['network']} · {h}" if h else f"{c['network']} · poster"


def pick(cands, needles):
    out, used = [], set()
    for n in needles:
        hits = [c for c in cands if n.lower() in c["text"].lower() and c["id"] not in used]
        if not hits:
            sys.exit(f"no candidate matches {n[:60]!r}")
        c = hits[0]
        used.add(c["id"])
        out.append(c)
    return out


def make(place, signals_votes):
    """signals_votes: [(key, statement, gate, [needles], votes, amendment?)]"""
    cands = json.load(open(os.path.join(CAND, f"{place['id']}.json")))["candidates"]
    stories, story_of, signals, votes, gates, amendments, curated = {}, {}, [], {}, {}, {}, []
    for key, stmt, gate, needles, vts, amend in signals_votes:
        posts = pick(cands, needles)
        ids = []
        for c in posts:
            if c["id"] not in stories:
                stories[c["id"]] = {
                    "teller_role": role(c), "channel": "social",
                    "source": c["url"], "text": c["text"],
                }
                curated.append(c)
            ids.append(c["id"])
        signals.append({
            "key": key, "statement": stmt,
            "claim_texts": [stories[i]["text"] for i in ids],
        })
        votes[key], gates[key] = vts, gate
        if amend:
            amendments[key] = amend
    spec = {
        "place": place,
        "participants": 8,
        "social_exports": [f"tools/social/exports/{place['id']}.json"],
        "stories": list(stories.values()),
        "signals": signals,
        "votes": votes,
        "amendments": amendments,
        "gates": gates,
        "interventions": INTERVENTIONS[place["id"]],
        "sips": SIPS[place["id"]],
    }
    exp = {
        "place": place["id"], "curated_from": f"tools/social/candidates/{place['id']}.json",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "count": len(curated), "candidates": curated,
    }
    os.makedirs(os.path.join(ROOT, "tools/social/exports"), exist_ok=True)
    with open(os.path.join(ROOT, f"tools/social/exports/{place['id']}.json"), "w") as f:
        json.dump(exp, f, indent=1, ensure_ascii=False)
    with open(os.path.join(ROOT, f"tools/places/{place['id']}.spec.json"), "w") as f:
        json.dump(spec, f, indent=1, ensure_ascii=False)
    print(f"{place['id']}: {len(stories)} stories, {len(signals)} signals")


V_ENDORSE = ["endorse"] * 6 + [None, None]
V_MIXED = ["endorse", "endorse", "amend", "endorse", "endorse", "contest", None, None]
V_STRONG = ["endorse"] * 8


MINNEAPOLIS = {
    "id": "minneapolis",
    "name": "Minneapolis under Metro Surge",
    "kind": "city, Minnesota, USA — public posts, Sept–Oct 2026",
    "summary": "A federal enforcement surge and the city's response: neighbors abducted, a quilt counting the missing, activists on trial, volunteers mapping surveillance — and care work continuing alongside.",
    "geo": {"lat": 44.9778, "lon": -93.265},
    "readings": [
        {"label": "Public posts naming Minneapolis in the indexer window",
         "value": "~796 posts · 90-day window", "source": "Rooted audience-identity index"},
        {"label": "Stolen Neighbors Quilt",
         "value": "11,000 squares — one per person taken by ICE in Minnesota",
         "source": "public post, revealed at the State Capitol"},
    ],
}
MINNEAPOLIS_SIG = [
    ("sig-harm", "People are being taken and hurt — abductions, unlawful force, and fear expressed in first person.",
     "not_yet",
     ["His ICE gestapo have murdered 2 people in Minneapolis",
      "documenting human rights violations in ICE operations in the Twin Cities",
      "they can just murder me, in downtown Minneapolis",
      "permit quick third-country deportations"],
     V_ENDORSE, None),
    ("sig-memorial", "The city counts and grieves its missing — a quilt of 11,000 squares, built by a hundred hands.",
     "commons_only",
     ["This is the Stolen Neighbors Quilt",
      "The Stolen Neighbors Quilt was revealed this week at the Minnesota State Capitol",
      "Old National Bank volunteers pack 1,600 comfort kits"],
     V_STRONG, None),
    ("sig-resistance", "The city resists through courts, charges, and the streets — an agent arrested, activists on trial, a judge's rebuke.",
     "not_yet",
     ["Minnesota arrested the ICE agent",
      "Minnesota 15",
      "grave threat to the rule of law",
      "ICE must be shut down",
      "ReneeGood #ICEOutForGood",
      "Amnesty International calls for abolition"],
     V_MIXED, "Resistance is also legal: the charges and the judge's rebuke are part of the same response."),
    ("sig-watch", "Residents document the watchers — volunteer ALPR mapping while officials draw scrutiny too.",
     "commons_only",
     ["license plate readers just reported around Cottage Grove",
      "rake in even more overtime pay"],
     V_ENDORSE, None),
    ("sig-civic", "Civic muscle keeps working — registration drives, anxious election judges, candidates asking for the seat.",
     "may_be_priced",
     ["election judge & feeling anxious",
      "Check your registration, make a voting plan",
      "running for state senate"],
     V_ENDORSE, None),
]

NAIROBI = {
    "id": "nairobi",
    "name": "Nairobi street economy & parallel rails",
    "kind": "city, Kenya — public posts, Sept–Oct 2026",
    "summary": "Two economies in one city: the CBD's matatus, hawkers and street food; and Kibera's Bitcoin circular economy. Underneath both, water cuts, drainage warnings and civic pressure.",
    "geo": {"lat": -1.2921, "lon": 36.8219},
    "readings": [
        {"label": "Public posts naming Nairobi in the indexer window",
         "value": "~388 posts · 90-day window", "source": "Rooted audience-identity index"},
        {"label": "Kibera circular economy",
         "value": "3.78M sats reported circulating locally across 11 projects",
         "source": "public nostr post (Blink/BTC Map report)"},
    ],
}
NAIROBI_SIG = [
    ("sig-street", "The CBD runs on informal hustle — matatus, hawkers, street food, surprise expenses; the economy works but at survival odds.",
     "may_be_priced",
     ["Ate kebabs and smocha in the streets of Kanairo",
      "Nairobi CBD is a very strange place",
      "I have boarded matatus",
      "introducing new expenses you never planned for",
      "matatus, buses fitted with sound systems"],
     V_ENDORSE, None),
    ("sig-money", "A parallel economy runs underneath — sats spent at Ruth Shop, a circular economy in Kibera, women building the rails.",
     "commons_only",
     ["spent them on lunch ingredients at Ruth Shop Kibera",
      "the ONLY asset you can own",
      "AfriBit Kibera is building a Bitcoin circular economy",
      "a whole community in Kibera that uses Bitcoin day-to-day",
      "3.78M sats circulating locally across 11 projects",
      "women only Bitcoin building space in Nairobi"],
     V_STRONG, None),
    ("sig-infra", "Basic infrastructure is failing — 17 neighbourhoods lose water, drainage criticised ahead of El Niño, matatu safety kills.",
     "not_yet",
     ["17 Nairobi neighborhoods to lose water for 26 hours",
      "drainage issues as El Niño worsens",
      "Eastleigh traders call for action after buses block",
      "Matatu collision kills five",
      "braces for heavy rains as El Niño threatens flood"],
     V_MIXED, "The water cut is scheduled maintenance, not failure — but 26 hours is still 26 hours."),
    ("sig-civic", "Civic pressure continues — protests planned over the Besigye detention, police warning against the CBD rally.",
     "not_yet",
     ["Activists in Nairobi plan Monday protest over Kizza Besigye",
      "Human rights defenders in Nairobi plan to protest",
      "police warn against CBD rally"],
     V_ENDORSE, None),
]

DETROIT = {
    "id": "detroit",
    "name": "Detroit — neighborhoods carry the city",
    "kind": "city, Michigan, USA — public posts, Sept–Oct 2026",
    "summary": "A city where the jobs moved to the suburbs and the neighborhoods carry what remains: local businesses, a garden teaching young men, photographers documenting the streets — under institutional strain.",
    "geo": {"lat": 42.3314, "lon": -83.0458},
    "readings": [
        {"label": "Public posts naming Detroit in the indexer window",
         "value": "~1000 candidates · 90-day window", "source": "Rooted audience-identity index"},
        {"label": "Latino-owned businesses (Michigan)",
         "value": "~25,000 — many in southwest Detroit",
         "source": "public post, Hispanic Heritage campaign"},
    ],
}
DETROIT_SIG = [
    ("sig-barrier", "The jobs are in the suburbs and 'reliable transportation' is the gate — distance and cost keep residents out of work.",
     "not_yet",
     ["detroit is STILL a poor city and most of the jobs are in the suburbs",
      "diesel was over $7.00 a gallon in Detroit",
      "post-bankruptcy PTSD"],
     V_MIXED, "Suburban employers require cars — transit is the real barrier, not willingness."),
    ("sig-institutions", "Neighborhood institutions carry the revival — Latino businesses, a garden teaching young men, institutions old and new.",
     "may_be_priced",
     ["25,000 #Latino-owned businesses, many in southwest Detroit",
      "community garden project to teach young men life skills",
      "sweet potato sensations, a neighborhood institution",
      "beloved Portland bakery is coming to Detroit’s Core City",
      "Detroit Black Film Festival is back for year seven"],
     V_ENDORSE, None),
    ("sig-memory", "The city documents itself — photographers on the blocks, a tour guide's blunt history, communities numbered.",
     "commons_only",
     ["Bruise Violet (b.1916)",
      "In the Russell Woods neighborhood",
      "historic tour guide here in Detroit",
      "15,000 to 20,000 #Macedonian Americans by the 1980s"],
     V_ENDORSE, None),
    ("sig-accountability", "Institutional accountability is contested — a prediction-market logo on a water tower, a steam project's 'diversity card'.",
     "not_yet",
     ["Polymarket logo recently appeared on a Detroit water tower",
      "playing the diversity card"],
     V_MIXED, "The Thermal emails are documented, not alleged — the permit violation is the city's own finding."),
]

INTERVENTIONS = {
    "minneapolis": [
        {"view": "from_plans", "name": "Operation Metro Surge",
         "note": "Federal enforcement surge — the plan applied to the city; its costs are the signals below.",
         "signals": ["sig-harm"], "counter": ["sig-resistance"], "priced": True},
        {"view": "from_place", "name": "Neighborhood response network",
         "note": "Quilt-makers, comfort-kit volunteers, ALPR mappers, legal observers — community response running on donated time.",
         "signals": ["sig-memorial", "sig-watch"], "counter": ["sig-harm"], "priced": False},
    ],
    "nairobi": [
        {"view": "from_plans", "name": "Nairobi water & drainage programme",
         "note": "County maintenance and El Niño preparedness — scheduled but leaving 17 neighbourhoods dry for 26 hours.",
         "signals": ["sig-infra"], "priced": True},
        {"view": "from_place", "name": "Kibera circular-economy rails",
         "note": "AfriBit, Dada Devs, BTC Map merchants — a parallel economy the banking system can't see.",
         "signals": ["sig-money"], "counter": ["sig-infra"], "priced": False},
    ],
    "detroit": [
        {"view": "from_plans", "name": "Detroit Three industrial plan",
         "note": "Auto concentration keeps the metro's fortunes tied to a shrinking market share.",
         "signals": ["sig-barrier"], "priced": True},
        {"view": "from_place", "name": "Neighborhood institutions network",
         "note": "Southwest businesses, gardens, festivals and documenters — the city's actual resilience layer.",
         "signals": ["sig-institutions", "sig-memory"], "counter": ["sig-barrier"], "priced": False},
    ],
}

SIPS = {
    "minneapolis": [
        {"kind": "node", "title": "Documentation is the leverage point",
         "what_changes": "Every accountability outcome — the agent's arrest, the judge's rebuke — began with someone recording. Protect the documenters.",
         "time_to_show": "one court cycle", "evidence_signals": ["sig-watch", "sig-resistance"]},
        {"kind": "threshold", "title": "Care work at scale",
         "what_changes": "11,000 quilt squares and 1,600 comfort kits are the visible tip of care work that must not burn out.",
         "time_to_show": "months", "evidence_signals": ["sig-memorial"]},
    ],
    "nairobi": [
        {"kind": "node", "title": "The parallel rails are the hedge",
         "what_changes": "When 17 neighbourhoods lose water and the CBD runs on hustle, the sats economy in Kibera is a working fallback — invisible to the formal system.",
         "time_to_show": "weeks", "evidence_signals": ["sig-money", "sig-street"]},
        {"kind": "threshold", "title": "The 26-hour water test",
         "what_changes": "If scheduled cuts stretch or repeat, water becomes the city's binding constraint before drainage fails in the rains.",
         "time_to_show": "this rain season", "evidence_signals": ["sig-infra"]},
    ],
    "detroit": [
        {"kind": "node", "title": "Transport is the jobs bottleneck",
         "what_changes": "Residents name 'reliable transportation' as the gate, not skills. A transit answer unlocks the suburban jobs without moving anyone.",
         "time_to_show": "one hiring cycle", "evidence_signals": ["sig-barrier"]},
        {"kind": "node", "title": "Institutions compound",
         "what_changes": "Each documented street, taught cohort, and opened shop raises the floor the next one starts from — the revival is the network.",
         "time_to_show": "years", "evidence_signals": ["sig-institutions", "sig-memory"]},
    ],
}

for place, sigs in ((MINNEAPOLIS, MINNEAPOLIS_SIG), (NAIROBI, NAIROBI_SIG), (DETROIT, DETROIT_SIG)):
    make(place, sigs)
