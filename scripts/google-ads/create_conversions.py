"""Create the 5 RevFactor conversion actions defined in revfactor_campaign_blueprint.md §1.

Idempotent: if a conversion action with the same name already exists, it skips creation
and just prints the existing resource name + tag snippet.

Run: python3 create_conversions.py
Output: prints the conversion label for each action (needed for gtag firing).
"""

from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

HERE = Path(__file__).parent
CUSTOMER_ID = "5342635272"  # RevFactor.io

CONVERSIONS = [
    {
        "name": "Strategy Call Booked",
        "category": "BOOK_APPOINTMENT",
        "value": 1500.00,
        "primary": True,
        "include_in_conversions_metric": True,
        "type": "WEBPAGE",
        "counting": "ONE_PER_CLICK",
        "click_through_window_days": 30,
        "view_through_window_days": 1,
    },
    {
        "name": "Strategy Call Page View",
        "category": "PAGE_VIEW",
        "value": 50.00,
        "primary": False,
        "include_in_conversions_metric": False,
        "type": "WEBPAGE",
        "counting": "ONE_PER_CLICK",
        "click_through_window_days": 30,
        "view_through_window_days": 1,
    },
    {
        "name": "Lead Magnet Download",
        "category": "SUBMIT_LEAD_FORM",
        "value": 200.00,
        "primary": False,
        "include_in_conversions_metric": False,
        "type": "WEBPAGE",
        "counting": "ONE_PER_CLICK",
        "click_through_window_days": 30,
        "view_through_window_days": 1,
    },
    {
        "name": "Blog Read 75%",
        "category": "ENGAGEMENT",
        "value": 5.00,
        "primary": False,
        "include_in_conversions_metric": False,
        "type": "WEBPAGE",
        "counting": "ONE_PER_CLICK",
        "click_through_window_days": 30,
        "view_through_window_days": 1,
    },
    {
        "name": "Phone Click",
        "category": "PHONE_CALL_LEAD",
        "value": 100.00,
        "primary": False,
        "include_in_conversions_metric": False,
        "type": "WEBPAGE",
        "counting": "ONE_PER_CLICK",
        "click_through_window_days": 30,
        "view_through_window_days": 1,
    },
]


def list_existing(client, customer_id):
    ga = client.get_service("GoogleAdsService")
    query = """
        SELECT conversion_action.id, conversion_action.name,
               conversion_action.resource_name, conversion_action.tag_snippets
        FROM conversion_action
    """
    return {
        row.conversion_action.name: row.conversion_action
        for row in ga.search(customer_id=customer_id, query=query)
    }


def create_conversion(client, customer_id, spec):
    ca_service = client.get_service("ConversionActionService")
    op = client.get_type("ConversionActionOperation")
    ca = op.create

    ca.name = spec["name"]
    ca.type_ = client.enums.ConversionActionTypeEnum[spec["type"]]
    ca.category = client.enums.ConversionActionCategoryEnum[spec["category"]]
    ca.status = client.enums.ConversionActionStatusEnum.ENABLED
    ca.click_through_lookback_window_days = spec["click_through_window_days"]
    ca.view_through_lookback_window_days = spec["view_through_window_days"]
    ca.counting_type = client.enums.ConversionActionCountingTypeEnum[spec["counting"]]

    ca.value_settings.default_value = spec["value"]
    ca.value_settings.default_currency_code = "USD"
    ca.value_settings.always_use_default_value = True
    # primary_for_goal + include_in_conversions_metric are managed via
    # CustomerConversionGoal / CampaignConversionGoal in v24 — set those after creation.

    response = ca_service.mutate_conversion_actions(
        customer_id=customer_id, operations=[op]
    )
    return response.results[0].resource_name


def main():
    client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
    existing = list_existing(client, CUSTOMER_ID)

    results = []
    for spec in CONVERSIONS:
        if spec["name"] in existing:
            ca = existing[spec["name"]]
            print(f"[skip] {spec['name']} — already exists ({ca.resource_name})")
            results.append((spec["name"], ca.resource_name, "existed"))
        else:
            try:
                rn = create_conversion(client, CUSTOMER_ID, spec)
                print(f"[ok]   {spec['name']} → {rn}")
                results.append((spec["name"], rn, "created"))
            except GoogleAdsException as e:
                print(f"[FAIL] {spec['name']}: {e}")
                results.append((spec["name"], None, f"error: {e}"))

    print("\n--- tag snippets (for Cal.com confirmation page + page view triggers) ---")
    final = list_existing(client, CUSTOMER_ID)
    for spec in CONVERSIONS:
        ca = final.get(spec["name"])
        if not ca:
            continue
        # tag_snippets has multiple snippets — webpage event_snippet is what we need
        snippets = list(ca.tag_snippets)
        for snip in snippets:
            event = getattr(snip, "event_snippet", "") or ""
            if "send_to" in event:
                # extract the conversion label from send_to: 'AW-XXX/LABEL'
                import re
                m = re.search(r"send_to['\"]?\s*:\s*['\"]([^'\"]+)['\"]", event)
                if m:
                    print(f"  {spec['name']:35s} → send_to: {m.group(1)}")
                    break


if __name__ == "__main__":
    main()
