"""Check if Aaron's test booking fired a Strategy Call Booked conversion."""
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
svc = client.get_service("GoogleAdsService")
CID = "5342635272"

print("=" * 70)
print("CONVERSION COUNTS — last 7 days, all conv actions, ALL traffic")
print("=" * 70)
# Use customer-level metrics with conversion_action segmentation
q = """
SELECT segments.date,
       segments.conversion_action_name,
       metrics.all_conversions,
       metrics.all_conversions_value
FROM customer
WHERE segments.date DURING LAST_7_DAYS
  AND metrics.all_conversions > 0
ORDER BY segments.date DESC
"""
any_row = False
for row in svc.search(customer_id=CID, query=q):
    any_row = True
    d = row.segments.date
    name = row.segments.conversion_action_name
    n = row.metrics.all_conversions
    v = row.metrics.all_conversions_value
    print(f"  {d}  {name:45}  count={n:.2f}  value=${v:.2f}")
if not any_row:
    print("  (no conversion data in last 7 days)")

print()
print("=" * 70)
print("STRATEGY CALL BOOKED — current configuration")
print("=" * 70)
q = """
SELECT conversion_action.id,
       conversion_action.name,
       conversion_action.status,
       conversion_action.type,
       conversion_action.category,
       conversion_action.value_settings.default_value,
       conversion_action.click_through_lookback_window_days,
       conversion_action.tag_snippets
FROM conversion_action
WHERE conversion_action.name = 'Strategy Call Booked'
"""
for row in svc.search(customer_id=CID, query=q):
    ca = row.conversion_action
    print(f"  ID: {ca.id}")
    print(f"  Name: {ca.name}")
    print(f"  Status: {ca.status.name}")
    print(f"  Type: {ca.type.name}")
    print(f"  Category: {ca.category.name}")
    print(f"  Default value: ${ca.value_settings.default_value}")
    print(f"  Click-through window: {ca.click_through_lookback_window_days} days")
    print(f"  Tag snippets count: {len(ca.tag_snippets)}")
    for ts in ca.tag_snippets:
        print(f"    - type: {ts.type.name}, page_format: {ts.page_format.name}")

print()
print("=" * 70)
print("CONVERSION COUNTS — TODAY only, all actions, regardless of source")
print("=" * 70)
q = """
SELECT segments.date,
       segments.conversion_action_name,
       metrics.all_conversions
FROM customer
WHERE segments.date = '2026-05-03'
"""
any_row = False
for row in svc.search(customer_id=CID, query=q):
    if row.metrics.all_conversions > 0:
        any_row = True
        print(f"  {row.segments.date}  {row.segments.conversion_action_name}  count={row.metrics.all_conversions:.2f}")
if not any_row:
    print("  No conversions yet today in the API.")
    print("  Note: Google Ads conversion data has 3-24h lag from when the event fires.")
    print("  Fastest UI check: Goals → Conversions → Strategy Call Booked → Diagnostics tab.")
