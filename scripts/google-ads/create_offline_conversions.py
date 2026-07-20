#!/usr/bin/env python3
"""Create RevFactor offline (upload-from-clicks) conversion actions for the
Hub → Google Ads pipeline. Idempotent: skips if a same-name action exists.
Prints each action's id so the uploader can target it.
"""
import sys
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

CID = "5342635272"
WANT = [
    # name, category, default_value, ctc_window_days
    ("RevFactor — Booked Call (offline)", "BOOK_APPOINTMENT", 300.0, 90),
    ("RevFactor — Won Deal (offline)",    "PURCHASE",         1000.0, 90),
]

def main():
    c = GoogleAdsClient.load_from_storage("google-ads.yaml")
    svc = c.get_service("GoogleAdsService")
    ca_svc = c.get_service("ConversionActionService")
    # existing by name
    existing = {}
    for r in svc.search(customer_id=CID, query="SELECT conversion_action.id, conversion_action.name FROM conversion_action"):
        existing[r.conversion_action.name] = r.conversion_action.id
    for name, cat, val, win in WANT:
        if name in existing:
            print(f"exists: {existing[name]} | {name}")
            continue
        op = c.get_type("ConversionActionOperation")
        ca = op.create
        ca.name = name
        ca.type_ = c.enums.ConversionActionTypeEnum.UPLOAD_CLICKS
        ca.category = getattr(c.enums.ConversionActionCategoryEnum, cat)
        ca.status = c.enums.ConversionActionStatusEnum.ENABLED
        ca.value_settings.default_value = val
        ca.value_settings.always_use_default_value = False
        ca.counting_type = c.enums.ConversionActionCountingTypeEnum.ONE_PER_CLICK
        ca.click_through_lookback_window_days = win
        try:
            resp = ca_svc.mutate_conversion_actions(customer_id=CID, operations=[op])
            rn = resp.results[0].resource_name
            print(f"created: {rn.split('/')[-1]} | {name}")
        except GoogleAdsException as e:
            print(f"ERROR creating {name}: {e.failure.errors[0].message if e.failure.errors else e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
