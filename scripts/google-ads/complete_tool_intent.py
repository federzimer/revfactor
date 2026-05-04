"""Add the missing ad groups + keywords + RSAs to the existing partial Tool Intent campaign."""

import sys
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from campaigns_config import CAMPAIGNS
from deploy_campaigns import (
    create_ad_group,
    add_keywords,
    create_rsa,
    existing_campaigns,
)

CUSTOMER_ID = "5342635272"


def main():
    client = GoogleAdsClient.load_from_storage(
        str(HERE / "google-ads.yaml"), version="v24"
    )

    spec = next(c for c in CAMPAIGNS if c["name"] == "RF — Search — Tool Intent")
    campaigns = existing_campaigns(client)
    campaign_rn = campaigns[spec["name"]]
    print(f"Tool Intent campaign: {campaign_rn}")

    # Check existing ad groups in this campaign
    ga = client.get_service("GoogleAdsService")
    existing_ag_names = set()
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query=f"SELECT ad_group.name, ad_group.status FROM ad_group WHERE ad_group.campaign = '{campaign_rn}' AND ad_group.status != 'REMOVED'",
    ):
        existing_ag_names.add(row.ad_group.name)
    print(f"Existing ad groups: {existing_ag_names or 'none'}")

    for ag_spec in spec["ad_groups"]:
        if ag_spec["name"] in existing_ag_names:
            print(f"  [skip] {ag_spec['name']}")
            continue
        ag_rn = create_ad_group(client, campaign_rn, ag_spec, spec["default_max_cpc_usd"])
        add_keywords(client, ag_rn, ag_spec["keywords"])
        try:
            create_rsa(
                client, ag_rn, spec["rsa"],
                ag_spec.get("final_url", spec["final_url_default"]),
            )
            print(f"  [ok] {ag_spec['name']} ({len(ag_spec['keywords'])} kws + RSA)")
        except GoogleAdsException as e:
            print(f"  [PARTIAL] {ag_spec['name']} — kws added, RSA failed: {e}")

    print("\nDone.")


if __name__ == "__main__":
    main()
