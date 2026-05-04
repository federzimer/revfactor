"""Pull live Google Keyword Planner metrics for the Consultant Intent campaign keywords.

Outputs the actual auction CPC ranges Google sees vs. the Ahrefs estimates we
used in the blueprint, so we can validate budget assumptions before flipping
the campaign ON.
"""

import csv
from pathlib import Path

from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")

CUSTOMER_ID = "8226967901"  # Demand Gen MCC, has Explorer Access

# Keywords actually deployed in Campaign 02 (Consultant Intent) + a few signal-multi-property variants
SEED_KEYWORDS = [
    # Exact match deployed
    "short term rental consultant",
    "airbnb consultant",
    "airbnb consultant near me",
    "vacation rental consultant",
    "str consultant",
    "airbnb revenue consultant",
    "vacation rental revenue consultant",
    # Phrase deployed
    "airbnb revenue management",
    "vacation rental revenue management",
    "str revenue management",
    "short term rental revenue management",
    "airbnb pricing consultant",
    # Multi-property / portfolio variants — for the "bigger fish" test
    "short term rental portfolio management",
    "airbnb portfolio management",
    "vacation rental portfolio manager",
    "professional airbnb manager",
    "airbnb property manager",
    "short term rental property manager",
    "str portfolio manager",
    "multi property airbnb",
]

US_GEO = "geoTargetConstants/2840"
ENGLISH = "languageConstants/1000"
NETWORK = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH

COMPETITION_NAME = {0: "?", 1: "?", 2: "LOW", 3: "MED", 4: "HIGH"}


def micros_to_dollars(m):
    return round((m or 0) / 1_000_000, 2)


def main():
    svc = client.get_service("KeywordPlanIdeaService")
    request = client.get_type("GenerateKeywordIdeasRequest")
    request.customer_id = CUSTOMER_ID
    request.language = ENGLISH
    request.geo_target_constants.append(US_GEO)
    request.keyword_plan_network = NETWORK
    request.include_adult_keywords = False
    request.keyword_seed.keywords.extend(SEED_KEYWORDS)

    response = svc.generate_keyword_ideas(request=request)

    seed_lower = {k.lower() for k in SEED_KEYWORDS}
    deployed_rows = []
    related_rows = []

    for idea in response:
        m = idea.keyword_idea_metrics
        row = {
            "keyword": idea.text,
            "vol_mo": m.avg_monthly_searches,
            "comp": COMPETITION_NAME.get(m.competition, "?"),
            "comp_idx": m.competition_index,
            "low_bid_usd": micros_to_dollars(m.low_top_of_page_bid_micros),
            "high_bid_usd": micros_to_dollars(m.high_top_of_page_bid_micros),
        }
        if idea.text.lower() in seed_lower:
            deployed_rows.append(row)
        else:
            related_rows.append(row)

    deployed_rows.sort(key=lambda r: r["vol_mo"], reverse=True)
    related_rows.sort(key=lambda r: r["vol_mo"], reverse=True)

    out = HERE / "consultant_intent_live.csv"
    with out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["keyword", "vol_mo", "comp", "comp_idx", "low_bid_usd", "high_bid_usd", "category"])
        w.writeheader()
        for r in deployed_rows:
            w.writerow({**r, "category": "DEPLOYED"})
        for r in related_rows[:60]:
            w.writerow({**r, "category": "RELATED"})

    print("\n=== KEYWORDS DEPLOYED IN CAMPAIGN 02 ===")
    print(f"{'Keyword':<45} {'Vol/mo':>8} {'Comp':<5} {'Low $':>7} {'High $':>7}")
    print("-" * 80)
    for r in deployed_rows:
        print(f"{r['keyword'][:44]:<45} {r['vol_mo']:>8} {r['comp']:<5} {r['low_bid_usd']:>7} {r['high_bid_usd']:>7}")

    print("\n=== TOP 30 RELATED IDEAS (Google's expansion) ===")
    print(f"{'Keyword':<45} {'Vol/mo':>8} {'Comp':<5} {'Low $':>7} {'High $':>7}")
    print("-" * 80)
    for r in related_rows[:30]:
        print(f"{r['keyword'][:44]:<45} {r['vol_mo']:>8} {r['comp']:<5} {r['low_bid_usd']:>7} {r['high_bid_usd']:>7}")

    total_vol = sum(r["vol_mo"] for r in deployed_rows)
    avg_low = sum(r["low_bid_usd"] for r in deployed_rows if r["low_bid_usd"]) / max(1, sum(1 for r in deployed_rows if r["low_bid_usd"]))
    avg_high = sum(r["high_bid_usd"] for r in deployed_rows if r["high_bid_usd"]) / max(1, sum(1 for r in deployed_rows if r["high_bid_usd"]))
    print(f"\nTotal monthly volume across deployed keywords: {total_vol:,}")
    print(f"Avg top-of-page bid range: ${avg_low:.2f} - ${avg_high:.2f}")


if __name__ == "__main__":
    main()
