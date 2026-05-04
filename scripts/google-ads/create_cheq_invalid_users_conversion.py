"""Create the 'CHEQ for PPC - Invalid Users' conversion action in Google Ads.

ClickCease (CHEQ Essentials) needs this conversion to exist so its tracking
script can fire it whenever a bot/invalid click is detected. Google Ads
then builds a remarketing audience from those firings, and ClickCease
pushes that audience as an exclusion to all campaigns.

Important settings (per CHEQ guidelines):
- Category: PAGE_VIEW (not Lead — this is a tracking signal, not a conv)
- Status: ENABLED
- Counting: ONE_PER_CLICK (we don't want every page-load to fire)
- include_in_conversions_metric: False (excluded from Smart Bidding)
- include_in_client_account_conversions_metric: False
- value: 0 (no $$, this is a flag)
- click-through window: 30 days (default)

Run:  python3 create_cheq_invalid_users_conversion.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from google.ads.googleads.client import GoogleAdsClient

CID = "5342635272"
NAME = "CHEQ for PPC - Invalid Users"


def find_existing(ga, name):
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT conversion_action.id, conversion_action.name,
                   conversion_action.resource_name, conversion_action.tag_snippets
            FROM conversion_action
            WHERE conversion_action.name = '{name}'
              AND conversion_action.status != 'REMOVED'
        """,
    ):
        return r.conversion_action
    return None


def create(client):
    ga = client.get_service("GoogleAdsService")
    existing = find_existing(ga, NAME)
    if existing:
        print(f"Already exists: {existing.resource_name}")
        return existing.resource_name

    op = client.get_type("ConversionActionOperation")
    ca = op.create
    ca.name = NAME
    ca.category = client.enums.ConversionActionCategoryEnum.PAGE_VIEW
    ca.type_ = client.enums.ConversionActionTypeEnum.WEBPAGE
    ca.status = client.enums.ConversionActionStatusEnum.ENABLED
    ca.counting_type = client.enums.ConversionActionCountingTypeEnum.ONE_PER_CLICK
    ca.click_through_lookback_window_days = 30
    ca.value_settings.default_value = 0
    ca.value_settings.always_use_default_value = True

    svc = client.get_service("ConversionActionService")
    res = svc.mutate_conversion_actions(customer_id=CID, operations=[op])
    return res.results[0].resource_name


def fetch_tag_snippets(ga, resource_name):
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT conversion_action.id, conversion_action.name,
                   conversion_action.tag_snippets
            FROM conversion_action
            WHERE conversion_action.resource_name = '{resource_name}'
        """,
    ):
        return r.conversion_action
    return None


if __name__ == "__main__":
    client = GoogleAdsClient.load_from_storage(
        str(Path(__file__).parent / "google-ads.yaml")
    )
    rn = create(client)
    print(f"Resource: {rn}")

    ga = client.get_service("GoogleAdsService")
    ca = fetch_tag_snippets(ga, rn)
    if not ca:
        sys.exit("Could not fetch the new action.")

    print(f"\nID: {ca.id}")
    print(f"Name: {ca.name}")
    print(f"\nFor ClickCease 'Audience Exclusion' form:")
    for snip in ca.tag_snippets:
        # Look at the global_site_tag / event_snippet / page_load
        if snip.type_.name == "WEBPAGE" and snip.event_snippet:
            # Conversion ID and Label embedded in the gtag event snippet
            import re
            m = re.search(r"send_to:\s*['\"]([^'\"/]+)/([^'\"/]+)['\"]", snip.event_snippet)
            if m:
                print(f"  Conversion ID:    {m.group(1)}")
                print(f"  Conversion Label: {m.group(2)}")
                print(f"\n  Paste both into the ClickCease 'Set Up Audience Exclusion' modal.")
                break
