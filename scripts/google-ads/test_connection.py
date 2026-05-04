"""Sanity check: list accounts visible under the MCC."""

from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")

ga_service = client.get_service("GoogleAdsService")
mcc_id = "8226967901"

query = """
    SELECT
      customer_client.client_customer,
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.manager,
      customer_client.status
    FROM customer_client
    WHERE customer_client.status = 'ENABLED'
"""

response = ga_service.search(customer_id=mcc_id, query=query)
print(f"{'Customer ID':<14} {'Manager':<8} {'Name'}")
print("-" * 60)
for row in response:
    cc = row.customer_client
    print(f"{cc.id:<14} {str(cc.manager):<8} {cc.descriptive_name}")
