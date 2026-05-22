#!/usr/bin/env python3
"""Scan all ENABLED Google Ads RSA headlines + descriptions for stale
portfolio-stat references (165 / 56 / 18% / 100+).

Doesn't modify anything — just reports which ad groups need a refresh
through add_rsa_variants.py or campaigns_config.py.
"""
from pathlib import Path
import re
from google.ads.googleads.client import GoogleAdsClient

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
svc = client.get_service("GoogleAdsService")
CID = "5342635272"

STALE_PATTERNS = [
    (r"\b165\b", "165 → should be 198"),
    (r"\b56 market", "56 markets → 67"),
    (r"\b56-market", "56-market → 67-market"),
    (r"\b18% (lift|leave|leaving|RevPAR|your|an )", "18% lift/leave → 24%"),
    (r"\b100\+ propert", "100+ properties → 198"),
]

q = """
SELECT ad_group_ad.ad.id,
       ad_group_ad.ad.responsive_search_ad.headlines,
       ad_group_ad.ad.responsive_search_ad.descriptions,
       ad_group_ad.status,
       ad_group.name,
       campaign.name
FROM ad_group_ad
WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
  AND ad_group_ad.status = 'ENABLED'
"""

hits = []
total_ads = 0
for row in svc.search(customer_id=CID, query=q):
    total_ads += 1
    ad = row.ad_group_ad.ad
    rsa = ad.responsive_search_ad
    texts = list(rsa.headlines) + list(rsa.descriptions)
    for asset in texts:
        text = asset.text
        for pat, label in STALE_PATTERNS:
            if re.search(pat, text):
                hits.append({
                    "campaign": row.campaign.name,
                    "ad_group": row.ad_group.name,
                    "ad_id": ad.id,
                    "stale": label,
                    "text": text,
                })

print(f"Scanned {total_ads} ENABLED RSAs in account {CID}.\n")
if not hits:
    print("✓ No stale portfolio-stat references found in live ads.")
else:
    print(f"⚠ Found {len(hits)} stale asset(s):\n")
    by_ag = {}
    for h in hits:
        k = (h["campaign"], h["ad_group"])
        by_ag.setdefault(k, []).append(h)
    for (camp, ag), items in by_ag.items():
        print(f"  [{camp} / {ag}]")
        for it in items:
            print(f"    ad {it['ad_id']}: {it['stale']}")
            print(f"      \"{it['text']}\"")
        print()
