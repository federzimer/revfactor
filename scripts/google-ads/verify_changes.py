"""Verify Steps 0-2 of the Monday launch walkthrough are actually live."""
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from collections import defaultdict

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
svc = client.get_service("GoogleAdsService")
CID = "5342635272"

print("=" * 70)
print("STEP 0 — Pmax Campaign #1 removed?")
print("=" * 70)
q = """
SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type
FROM campaign
WHERE campaign.advertising_channel_type = PERFORMANCE_MAX
"""
found = False
for row in svc.search(customer_id=CID, query=q):
    found = True
    c = row.campaign
    print(f"  [{c.status.name}] {c.name} (id={c.id})")
if not found:
    print("  ✅ No Pmax campaigns at all — fully cleaned up")

print()
print("=" * 70)
print("STEP 1a — Conversion actions: Primary vs Secondary")
print("=" * 70)
q = """
SELECT conversion_action.id, conversion_action.name,
       conversion_action.status, conversion_action.primary_for_goal,
       conversion_action.category,
       conversion_action.value_settings.default_value
FROM conversion_action
WHERE conversion_action.status != 'REMOVED'
ORDER BY conversion_action.primary_for_goal DESC, conversion_action.name
"""
prim_count = 0
sec_count = 0
for row in svc.search(customer_id=CID, query=q):
    ca = row.conversion_action
    badge = "PRIMARY  " if ca.primary_for_goal else "secondary"
    if ca.primary_for_goal:
        prim_count += 1
    else:
        sec_count += 1
    val = ca.value_settings.default_value
    print(f"  [{badge}] [{ca.status.name}] {ca.name}  (${val:.0f}, {ca.category.name})")
print(f"\n  Total: {prim_count} primary, {sec_count} secondary")
if prim_count == 1:
    print("  ✅ Only one Primary action — correct")
elif prim_count > 1:
    print(f"  ❌ Still {prim_count} Primary actions — should be 1 (Strategy Call Booked)")

print()
print("=" * 70)
print("STEP 1b — Account-default goals: only Book Appointment biddable?")
print("=" * 70)
q = """
SELECT customer_conversion_goal.category,
       customer_conversion_goal.origin,
       customer_conversion_goal.biddable
FROM customer_conversion_goal
"""
biddable_cats = []
for row in svc.search(customer_id=CID, query=q):
    g = row.customer_conversion_goal
    badge = "PRIMARY  " if g.biddable else "secondary"
    print(f"  [{badge}] {g.category.name} / {g.origin.name}")
    if g.biddable:
        biddable_cats.append(g.category.name)
if biddable_cats == ["BOOK_APPOINTMENT"]:
    print("\n  ✅ Only Book Appointment is biddable — correct")
else:
    print(f"\n  ❌ Biddable categories: {biddable_cats} (should be only BOOK_APPOINTMENT)")

print()
print("=" * 70)
print("STEP 3 — GA4 link present?")
print("=" * 70)
linked = False
for q in ["SELECT data_link.resource_name, data_link.type, data_link.status FROM data_link",
          "SELECT account_link.resource_name, account_link.type, account_link.status FROM account_link"]:
    try:
        for row in svc.search(customer_id=CID, query=q):
            linked = True
            print(f"  {row}")
    except Exception:
        pass
if not linked:
    print("  ❌ No data/account links visible from Ads side")
else:
    print("  ✅ Link present")

print()
print("=" * 70)
print("STEP 2 — Enhanced conversions enabled?")
print("=" * 70)
q = """
SELECT customer.id, customer.descriptive_name,
       customer.conversion_tracking_setting.accepted_customer_data_terms,
       customer.conversion_tracking_setting.enhanced_conversions_for_leads_enabled
FROM customer
WHERE customer.id = 5342635272
"""
for row in svc.search(customer_id=CID, query=q):
    cs = row.customer.conversion_tracking_setting
    print(f"  Accepted customer-data terms: {cs.accepted_customer_data_terms}")
    print(f"  Enhanced conversions enabled: {cs.enhanced_conversions_for_leads_enabled}")
    if cs.accepted_customer_data_terms and cs.enhanced_conversions_for_leads_enabled:
        print("  ✅ Enhanced conversions ON")
    elif cs.accepted_customer_data_terms and not cs.enhanced_conversions_for_leads_enabled:
        print("  ⚠️  Terms accepted but enhanced conversions toggle still OFF")
    else:
        print("  ❌ Customer-data terms not accepted yet — enhanced conversions can't be on")
