"""Create a new parent-attributed conversion action for RevFactor and make it
the single primary for bidding. Demote the existing iframe-fired actions
(7591215586 + 7604128782) to non-primary, observation-only.

Why: Fede's scheduler iframe fires gtag(book_strategy_call) → hits both the
GA4-imported action and the web-tag action; both attribute as direct/(none)
because the iframe is a different origin. Our parent (revfactor.io) listener
fires from the right origin with gclid intact, but it was sharing the same
action as the iframe → 2-3 conversions per booking polluting Smart Bidding.

This script:
  1) creates "Strategy Call Booked (Parent Attributed)" — $1500, ONE_PER_CLICK
  2) extracts its new conversion label (for BaseLayout.astro)
  3) demotes 7591215586 + 7604128782 (primary=False, include=False)
  4) promotes the new action (primary=True, include=True)

Run: python3 swap_primary_conversion.py
"""

from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
import re
import sys

HERE = Path(__file__).parent
CUSTOMER_ID = "5342635272"

NEW_NAME = "Strategy Call Booked (Parent Attributed)"
DEMOTE_IDS = [7591215586, 7604128782]


def find_by_name(client, name):
    ga = client.get_service("GoogleAdsService")
    q = f"""
        SELECT conversion_action.id, conversion_action.name,
               conversion_action.resource_name, conversion_action.tag_snippets
        FROM conversion_action
        WHERE conversion_action.name = '{name}' AND conversion_action.status != 'REMOVED'
    """
    rows = list(ga.search(customer_id=CUSTOMER_ID, query=q))
    return rows[0].conversion_action if rows else None


def create_new(client):
    svc = client.get_service("ConversionActionService")
    op = client.get_type("ConversionActionOperation")
    ca = op.create
    ca.name = NEW_NAME
    ca.type_ = client.enums.ConversionActionTypeEnum.WEBPAGE
    ca.category = client.enums.ConversionActionCategoryEnum.BOOK_APPOINTMENT
    ca.status = client.enums.ConversionActionStatusEnum.ENABLED
    ca.click_through_lookback_window_days = 30
    ca.view_through_lookback_window_days = 1
    ca.counting_type = client.enums.ConversionActionCountingTypeEnum.ONE_PER_CLICK
    ca.value_settings.default_value = 1500.0
    ca.value_settings.default_currency_code = "USD"
    ca.value_settings.always_use_default_value = True
    # primary_for_goal + include_in_conversions_metric are immutable on create —
    # set them in a follow-up update mutation.
    resp = svc.mutate_conversion_actions(customer_id=CUSTOMER_ID, operations=[op])
    return resp.results[0].resource_name


def promote(client, resource_name):
    from google.protobuf.field_mask_pb2 import FieldMask
    svc = client.get_service("ConversionActionService")
    op = client.get_type("ConversionActionOperation")
    op.update.resource_name = resource_name
    op.update.primary_for_goal = True
    op.update_mask.CopyFrom(FieldMask(paths=["primary_for_goal"]))
    return svc.mutate_conversion_actions(customer_id=CUSTOMER_ID, operations=[op])


def extract_send_to(ca):
    for snip in ca.tag_snippets:
        ev = getattr(snip, "event_snippet", "") or ""
        m = re.search(r"send_to['\"]?\s*:\s*['\"]([^'\"]+)", ev)
        if m:
            return m.group(1)
    return None


def demote(client, ids):
    from google.protobuf.field_mask_pb2 import FieldMask
    svc = client.get_service("ConversionActionService")
    ops = []
    for cid in ids:
        op = client.get_type("ConversionActionOperation")
        op.update.resource_name = f"customers/{CUSTOMER_ID}/conversionActions/{cid}"
        op.update.primary_for_goal = False
        op.update_mask.CopyFrom(FieldMask(paths=["primary_for_goal"]))
        ops.append(op)
    return svc.mutate_conversion_actions(customer_id=CUSTOMER_ID, operations=ops)


def main():
    client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")

    existing = find_by_name(client, NEW_NAME)
    if existing:
        print(f"[skip create] '{NEW_NAME}' already exists at {existing.resource_name}")
        new_rn = existing.resource_name
    else:
        try:
            new_rn = create_new(client)
            print(f"[create] {NEW_NAME} → {new_rn}")
        except GoogleAdsException as e:
            print(f"[FAIL create] {e}")
            sys.exit(1)

    # Re-fetch to get the tag_snippets (label) — must read after create.
    ca = find_by_name(client, NEW_NAME)
    label = extract_send_to(ca)
    print(f"[label] new send_to: {label}")
    print(f"[id]    new conversion id: {ca.id}")

    # Demote old primaries FIRST (only one action per category can be primary).
    try:
        demote(client, DEMOTE_IDS)
        for cid in DEMOTE_IDS:
            print(f"[demote] {cid} → primary=False, include=False")
    except GoogleAdsException as e:
        print(f"[FAIL demote] {e}")
        sys.exit(1)

    # Now promote the new action.
    try:
        promote(client, new_rn)
        print(f"[promote] {ca.id} → primary=True, include=True")
    except GoogleAdsException as e:
        print(f"[FAIL promote] {e}")
        sys.exit(1)

    # Verify end state.
    print("\n--- final state ---")
    ga = client.get_service("GoogleAdsService")
    q = """
        SELECT conversion_action.id, conversion_action.name,
               conversion_action.primary_for_goal,
               conversion_action.include_in_conversions_metric,
               conversion_action.value_settings.default_value
        FROM conversion_action
        WHERE conversion_action.status = 'ENABLED'
          AND conversion_action.category = BOOK_APPOINTMENT
    """
    for row in ga.search(customer_id=CUSTOMER_ID, query=q):
        c = row.conversion_action
        flag = "★ PRIMARY" if c.primary_for_goal else "  "
        inc = "✓" if c.include_in_conversions_metric else " "
        print(f"  {flag} [{inc}] id={c.id:11d} ${c.value_settings.default_value:>6.0f}  {c.name}")

    print("\n--- next step ---")
    print(f"Update BaseLayout.astro parent listener's send_to from:")
    print(f"  AW-18106897053/WkHxCOKD46McEJ2lhbpD")
    print(f"to:")
    print(f"  {label}")


if __name__ == "__main__":
    main()
