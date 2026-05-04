"""Decode which conversion label belongs to which conversion action."""
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
import re

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
svc = client.get_service("GoogleAdsService")
CID = "5342635272"

q = """
SELECT conversion_action.id,
       conversion_action.name,
       conversion_action.status,
       conversion_action.tag_snippets
FROM conversion_action
WHERE conversion_action.status = 'ENABLED'
"""
for row in svc.search(customer_id=CID, query=q):
    ca = row.conversion_action
    labels = set()
    for ts in ca.tag_snippets:
        # Look in event_snippet field for AW-...
        es = ts.event_snippet or ""
        gs = ts.global_site_tag or ""
        for m in re.findall(r"AW-\d+/[A-Za-z0-9_-]+", es + " " + gs):
            labels.add(m)
    label_str = ", ".join(sorted(labels)) if labels else "(none)"
    print(f"  {ca.name:35} {ca.status.name:10} → {label_str}")
