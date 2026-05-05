#!/usr/bin/env python3
"""List every active keyword grouped by ad group + match type.

Aaron uses this to know what strings to type into Google Ads' Ad Preview
& Diagnosis tool (Tools → Planning → Ad Preview & Diagnosis) — the right
way to verify ads are serving WITHOUT firing impressions.

DO NOT manually Google these keywords. Every "search-and-don't-click" tanks
your CTR → Quality Score → CPC. The Ad Preview tool simulates the search
without recording the impression.
"""

import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from google.ads.googleads.client import GoogleAdsClient

CID = "5342635272"


def main():
    client = GoogleAdsClient.load_from_storage(
        str(Path(__file__).parent / "google-ads.yaml")
    )
    ga = client.get_service("GoogleAdsService")

    by_ag = defaultdict(list)
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT campaign.name, campaign.status,
                   ad_group.name, ad_group.status,
                   ad_group_criterion.keyword.text,
                   ad_group_criterion.keyword.match_type
            FROM keyword_view
            WHERE ad_group_criterion.status = 'ENABLED'
              AND campaign.name LIKE 'RF%'
        """,
    ):
        if r.campaign.status.name == "REMOVED":
            continue
        if r.ad_group.status.name != "ENABLED":
            continue
        by_ag[r.ad_group.name].append(
            (
                r.ad_group_criterion.keyword.match_type.name,
                r.ad_group_criterion.keyword.text,
            )
        )

    print("# Keywords to test in Ad Preview & Diagnosis")
    print()
    print(
        "Open Google Ads → Tools (left rail) → Planning → "
        "Ad Preview & Diagnosis. Set location = United States, "
        "language = English, device = Desktop. Type the keyword. "
        "It tells you whether your ad WOULD serve, without firing "
        "an impression.\n"
    )
    print("**Do NOT search these on Google itself** — every "
          "search-and-don't-click hurts your Quality Score.\n")

    for ag in sorted(by_ag):
        print(f"\n## {ag}")
        for mt, text in sorted(by_ag[ag]):
            print(f"  - [{mt}] {text}")


if __name__ == "__main__":
    main()
