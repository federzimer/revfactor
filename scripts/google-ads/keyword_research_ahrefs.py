"""Pull keyword research from Ahrefs for RevFactor's STR pricing niche.

Strategy:
1. Run /keywords-explorer/overview for each seed (gets exact volume + KD + CPC).
2. Run /keywords-explorer/matching-terms for each seed (expansion: phrase-match
   ideas containing the seed).
3. Run /keywords-explorer/related-terms for each seed (expansion: semantically
   related ideas).
4. Deduplicate, fetch overview metrics for all unique discovered keywords,
   rank by volume × commercial intent.

Outputs:
  revfactor_keyword_research_ahrefs.csv  — full result set
  revfactor_keyword_top.md                — campaign-ready top picks
"""

from __future__ import annotations

import csv
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

API_KEY = "M8K_PtZiP3ZMZnJV-cdgGGPioS_J4YxuXS7RQqSv"
BASE = "https://api.ahrefs.com/v3"
COUNTRY = "us"
HERE = Path(__file__).parent

SEEDS = [
    "short term rental pricing strategy",
    "airbnb dynamic pricing",
    "vacation rental revenue management",
    "airbnb pricing tool",
    "pricelabs alternative",
    "airbnb consultant",
    "short term rental consultant",
    "vrbo pricing strategy",
    "str revenue management",
    "airbnb revenue optimization",
]

OVERVIEW_FIELDS = "keyword,volume,difficulty,cpc,clicks,global_volume,parent_topic,traffic_potential,serp_features"
EXPANSION_FIELDS = "keyword,volume,difficulty,cpc,parent_topic"


def get(path: str, params: dict) -> dict:
    qs = urlencode(params)
    req = Request(f"{BASE}{path}?{qs}", headers={"Authorization": f"Bearer {API_KEY}"})
    with urlopen(req, timeout=30) as r:
        import json
        return json.loads(r.read())


def overview(keywords: list[str]) -> list[dict]:
    """Batched overview — Ahrefs accepts comma-separated keywords up to API limit."""
    out = []
    BATCH = 100
    for i in range(0, len(keywords), BATCH):
        chunk = keywords[i : i + BATCH]
        params = {
            "keywords": ",".join(chunk),
            "country": COUNTRY,
            "select": OVERVIEW_FIELDS,
        }
        try:
            data = get("/keywords-explorer/overview", params)
            out.extend(data.get("keywords", []))
        except Exception as e:
            print(f"  overview batch failed: {e}")
        time.sleep(0.2)
    return out


def matching_terms(seed: str, limit: int = 30) -> list[dict]:
    params = {
        "keywords": seed,
        "country": COUNTRY,
        "select": EXPANSION_FIELDS,
        "limit": limit,
        "match_mode": "terms",
    }
    return get("/keywords-explorer/matching-terms", params).get("keywords", [])


def related_terms(seed: str, limit: int = 30) -> list[dict]:
    params = {
        "keywords": seed,
        "country": COUNTRY,
        "select": EXPANSION_FIELDS,
        "limit": limit,
    }
    try:
        return get("/keywords-explorer/related-terms", params).get("keywords", [])
    except Exception:
        return []


def cents_to_dollars(c) -> float:
    if c is None:
        return 0.0
    return round(c / 100, 2)


def commercial_intent(kw: str) -> int:
    """Rough commercial-intent score for ad targeting."""
    kw_l = kw.lower()
    score = 0
    if any(w in kw_l for w in ["consultant", "consulting", "service", "agency", "expert", "manager"]):
        score += 3
    if any(w in kw_l for w in ["tool", "software", "platform", "alternative", "vs ", " vs"]):
        score += 2
    if any(w in kw_l for w in ["how much", "how to", "what is", "guide", "tutorial"]):
        score -= 1
    if "free" in kw_l:
        score -= 2
    if any(w in kw_l for w in ["pricing", "price", "rate", "revenue", "yield"]):
        score += 1
    return score


def main():
    print(f"=== Phase 1: Overview for {len(SEEDS)} seed keywords ===")
    seed_metrics = overview(SEEDS)
    seed_by_kw = {row["keyword"].lower(): row for row in seed_metrics}

    print(f"\n=== Phase 2: Matching terms (phrase-match expansion) ===")
    expanded = set()
    for seed in SEEDS:
        try:
            terms = matching_terms(seed, limit=30)
            for t in terms:
                expanded.add(t["keyword"].lower())
            print(f"  {seed:50s} -> {len(terms)} ideas")
        except Exception as e:
            print(f"  {seed:50s} ERROR {e}")
        time.sleep(0.3)

    print(f"\n=== Phase 3: Related terms (semantic expansion) ===")
    for seed in SEEDS:
        try:
            terms = related_terms(seed, limit=30)
            for t in terms:
                expanded.add(t["keyword"].lower())
            print(f"  {seed:50s} -> {len(terms)} ideas")
        except Exception as e:
            print(f"  {seed:50s} ERROR {e}")
        time.sleep(0.3)

    expanded -= set(seed_by_kw.keys())
    print(f"\nUnique expansion terms: {len(expanded)}")

    print(f"\n=== Phase 4: Pulling full metrics for expansion terms ===")
    expansion_metrics = overview(sorted(expanded))
    by_kw = dict(seed_by_kw)
    for row in expansion_metrics:
        by_kw[row["keyword"].lower()] = row

    rows = []
    for kw_lower, m in by_kw.items():
        rows.append({
            "keyword": m.get("keyword", kw_lower),
            "volume": m.get("volume") or 0,
            "global_volume": m.get("global_volume") or 0,
            "difficulty": m.get("difficulty") or 0,
            "cpc_usd": cents_to_dollars(m.get("cpc")),
            "clicks": m.get("clicks") or 0,
            "traffic_potential": m.get("traffic_potential") or 0,
            "parent_topic": m.get("parent_topic") or "",
            "is_seed": kw_lower in seed_by_kw,
            "commercial_intent": commercial_intent(m.get("keyword", kw_lower)),
        })

    rows = [r for r in rows if r["volume"] >= 10 or r["is_seed"]]
    rows.sort(
        key=lambda r: (r["commercial_intent"], r["volume"], -r["difficulty"]),
        reverse=True,
    )

    csv_path = HERE / "revfactor_keyword_research_ahrefs.csv"
    with csv_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"\nWrote {csv_path}  ({len(rows)} keywords with volume >= 10 or seed)")

    print("\n" + "=" * 100)
    print(f"{'Keyword':<50} {'Vol':>7} {'KD':>4} {'CPC$':>6} {'TP':>6} {'CI':>3} {'Parent topic'}")
    print("=" * 100)
    for r in rows[:50]:
        seed_marker = "*" if r["is_seed"] else " "
        print(
            f"{seed_marker}{r['keyword'][:48]:<49} {r['volume']:>7} {r['difficulty']:>4} "
            f"{r['cpc_usd']:>6} {r['traffic_potential']:>6} {r['commercial_intent']:>3}  "
            f"{r['parent_topic'][:30]}"
        )

    md_path = HERE / "revfactor_keyword_top.md"
    md = ["# RevFactor.io — Keyword Research (Ahrefs, US)\n",
          f"Generated 2026-04-27. Source: Ahrefs Keywords Explorer v3, country=US.\n",
          "Columns: Vol = US monthly searches, KD = Keyword Difficulty (0-100), "
          "CPC = avg paid click cost (USD), TP = traffic potential of #1 page, "
          "CI = commercial intent score (custom).\n",
          "## High-intent prospects (CI >= 2)\n",
          "| Keyword | Vol | KD | CPC | TP | Parent topic |",
          "|---|---:|---:|---:|---:|---|"]
    for r in rows:
        if r["commercial_intent"] >= 2 and r["volume"] >= 10:
            md.append(
                f"| {r['keyword']} | {r['volume']} | {r['difficulty']} | "
                f"${r['cpc_usd']} | {r['traffic_potential']} | {r['parent_topic']} |"
            )
    md.append("\n## Mid-intent / informational (CI 0-1)\n")
    md.append("| Keyword | Vol | KD | CPC | TP | Parent topic |")
    md.append("|---|---:|---:|---:|---:|---|")
    for r in rows:
        if 0 <= r["commercial_intent"] < 2 and r["volume"] >= 50:
            md.append(
                f"| {r['keyword']} | {r['volume']} | {r['difficulty']} | "
                f"${r['cpc_usd']} | {r['traffic_potential']} | {r['parent_topic']} |"
            )
    md_path.write_text("\n".join(md))
    print(f"\nWrote {md_path}")


if __name__ == "__main__":
    main()
