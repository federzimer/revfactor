"""Check if GA4 is already linked to RevFactor.io Google Ads (which would
explain why it doesn't appear in the '+Connect product' picker)."""
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
svc = client.get_service("GoogleAdsService")
CID = "5342635272"

# Try several resources that track linked products / data sources
queries = [
    ("account_link", """
        SELECT account_link.resource_name, account_link.account_link_id,
               account_link.status, account_link.type
        FROM account_link
    """),
    ("data_link", """
        SELECT data_link.resource_name, data_link.product_link_id,
               data_link.type, data_link.status
        FROM data_link
    """),
    ("third_party_app_analytics_link", """
        SELECT third_party_app_analytics_link.resource_name
        FROM third_party_app_analytics_link
    """),
]

for name, q in queries:
    print(f"=== {name} ===")
    try:
        any_row = False
        for row in svc.search(customer_id=CID, query=q):
            any_row = True
            print(f"  {row}")
        if not any_row:
            print("  (no rows)")
    except Exception as e:
        msg = str(e)
        if "UNRECOGNIZED_FIELD" in msg or "INVALID_ARGUMENT" in msg:
            short = msg.split("message:")[-1][:200] if "message:" in msg else msg[:200]
            print(f"  query not supported in this API version — {short}")
        else:
            print(f"  error: {e}")
    print()
