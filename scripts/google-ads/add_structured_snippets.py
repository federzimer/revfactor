"""Add Structured Snippet assets and attach them to all 3 RF campaigns.

Structured snippets are text-only ad assets (header + 3-10 values). They show
under the ad and lift ad strength + CTR by ~5-10%. No design work needed.

Two snippets per campaign type:
  - "Services" — what we do
  - "Brands" — pricing tools we work with (signals "we know your stack")
"""

import sys
from google.ads.googleads.client import GoogleAdsClient

client = GoogleAdsClient.load_from_storage("google-ads.yaml")
ga = client.get_service("GoogleAdsService")
asset_svc = client.get_service("AssetService")
ca_svc = client.get_service("CampaignAssetService")
CID = "5342635272"

SNIPPETS = [
    {
        "name": "RF — Snippet — Services",
        "header": "Services",  # case-sensitive — must match Google's allowed enum exactly
        "values": [
            "Comp Tracking",
            "Calendar Optimization",
            "Length-of-Stay Strategy",
            "Channel Mix Strategy",
            "Listing Audit",
            "Revenue Strategy",
        ],
    },
    {
        "name": "RF — Snippet — Service Catalog",
        "header": "Service catalog",
        "values": [
            "STR Revenue Strategy",
            "Pricing Tool Calibration",
            "Comp Set Benchmarking",
            "Calendar Optimization",
            "Listing Photo Audit",
        ],
    },
]


def get_active_rf_campaigns():
    out = []
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT campaign.resource_name, campaign.name, campaign.status
            FROM campaign
            WHERE campaign.name LIKE 'RF%' AND campaign.status != 'REMOVED'
        """,
    ):
        out.append((r.campaign.name, r.campaign.resource_name))
    return out


def existing_snippet_assets():
    """Return {name: resource_name} for already-created RF snippets, idempotency."""
    out = {}
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT asset.resource_name, asset.name, asset.type
            FROM asset
            WHERE asset.type = 'STRUCTURED_SNIPPET' AND asset.name LIKE 'RF%'
        """,
    ):
        out[r.asset.name] = r.asset.resource_name
    return out


def create_snippets(apply):
    existing = existing_snippet_assets()
    created = dict(existing)  # name -> resource_name

    ops = []
    for s in SNIPPETS:
        if s["name"] in existing:
            print(f"  EXISTS: {s['name']}")
            continue
        op = client.get_type("AssetOperation")
        a = op.create
        a.name = s["name"]
        a.type_ = client.enums.AssetTypeEnum.STRUCTURED_SNIPPET
        a.structured_snippet_asset.header = s["header"]
        for v in s["values"]:
            a.structured_snippet_asset.values.append(v)
        ops.append((s["name"], op))

    if ops:
        if apply:
            res = asset_svc.mutate_assets(customer_id=CID, operations=[o for _, o in ops])
            for (name, _), r in zip(ops, res.results):
                created[name] = r.resource_name
                print(f"  CREATED: {name} → {r.resource_name}")
        else:
            for name, _ in ops:
                print(f"  WOULD CREATE: {name}")
    return created


def attach_to_campaigns(snippet_resources, apply):
    campaigns = get_active_rf_campaigns()

    # Already-attached check (idempotent)
    already = set()
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT campaign_asset.campaign, campaign_asset.asset, campaign_asset.field_type
            FROM campaign_asset
            WHERE campaign_asset.field_type = 'STRUCTURED_SNIPPET'
        """,
    ):
        already.add((r.campaign_asset.campaign, r.campaign_asset.asset))

    ops = []
    for camp_name, camp_res in campaigns:
        for snip_name, snip_res in snippet_resources.items():
            if (camp_res, snip_res) in already:
                continue
            op = client.get_type("CampaignAssetOperation")
            ca = op.create
            ca.campaign = camp_res
            ca.asset = snip_res
            ca.field_type = client.enums.AssetFieldTypeEnum.STRUCTURED_SNIPPET
            ops.append((camp_name, snip_name, op))

    print(f"\nAttachments to create: {len(ops)}")
    for camp, snip, _ in ops:
        print(f"  + {camp[-22:]} ← {snip}")

    if not ops:
        return
    if not apply:
        return
    res = ca_svc.mutate_campaign_assets(
        customer_id=CID, operations=[o for _, _, o in ops]
    )
    print(f"Attached {len(res.results)}.")


if __name__ == "__main__":
    apply = "--apply" in sys.argv
    print(f"=== STRUCTURED SNIPPETS (apply={apply}) ===")
    snippet_map = create_snippets(apply)
    attach_to_campaigns(snippet_map, apply)
    if not apply:
        print("\n(Run with --apply to execute.)")
