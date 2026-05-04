"""Pull keyword ideas + metrics for RevFactor seed keywords.

Targets US, English, Google Search. Outputs ranked CSV + a top-N
markdown summary.
"""

import csv
from pathlib import Path

from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")

# Use the MCC for keyword research (Explorer Access permits this on the manager).
CUSTOMER_ID = "8226967901"

SEED_KEYWORDS = [
    "short term rental pricing strategy",
    "airbnb dynamic pricing",
    "vacation rental revenue management",
    "airbnb pricing tool alternative",
    "airbnb revenue management",
    "str dynamic pricing",
    "vacation rental pricing software",
    "pricelabs alternative",
    "airbnb consultant",
    "short term rental consultant",
]

US_GEO = "geoTargetConstants/2840"      # United States
ENGLISH = "languageConstants/1000"      # English
NETWORK = client.enums.KeywordPlanNetworkEnum.GOOGLE_SEARCH

COMPETITION_NAME = {
    0: "UNSPECIFIED",
    1: "UNKNOWN",
    2: "LOW",
    3: "MEDIUM",
    4: "HIGH",
}


def micros_to_dollars(m: int) -> float:
    return round((m or 0) / 1_000_000, 2)


def main():
    keyword_plan_idea_service = client.get_service("KeywordPlanIdeaService")
    request = client.get_type("GenerateKeywordIdeasRequest")
    request.customer_id = CUSTOMER_ID
    request.language = ENGLISH
    request.geo_target_constants.append(US_GEO)
    request.keyword_plan_network = NETWORK
    request.include_adult_keywords = False
    request.keyword_seed.keywords.extend(SEED_KEYWORDS)

    print(f"Generating keyword ideas from {len(SEED_KEYWORDS)} seeds...\n")
    response = keyword_plan_idea_service.generate_keyword_ideas(request=request)

    rows = []
    for idea in response:
        m = idea.keyword_idea_metrics
        rows.append({
            "keyword": idea.text,
            "avg_monthly_searches": m.avg_monthly_searches,
            "competition": COMPETITION_NAME.get(m.competition, "?"),
            "competition_index": m.competition_index,
            "low_top_of_page_bid_usd": micros_to_dollars(m.low_top_of_page_bid_micros),
            "high_top_of_page_bid_usd": micros_to_dollars(m.high_top_of_page_bid_micros),
        })

    rows.sort(key=lambda r: r["avg_monthly_searches"], reverse=True)

    csv_path = HERE / "revfactor_keyword_research.csv"
    with csv_path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {csv_path}  ({len(rows)} keywords)\n")

    print(f"{'Keyword':<55} {'Vol/mo':>10}  {'Comp':<8} {'Low $':>7} {'High $':>7}")
    print("-" * 100)
    for r in rows[:40]:
        print(
            f"{r['keyword'][:54]:<55} {r['avg_monthly_searches']:>10}  "
            f"{r['competition']:<8} {r['low_top_of_page_bid_usd']:>7} "
            f"{r['high_top_of_page_bid_usd']:>7}"
        )


if __name__ == "__main__":
    main()
