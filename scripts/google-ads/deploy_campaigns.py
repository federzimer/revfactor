"""Deploy RevFactor search campaigns from campaigns_config.py.

All campaigns are created in PAUSED status. Aaron flips them on in the UI after review.

Idempotent:
- Existing campaigns (matched by name) are skipped (re-running won't duplicate).
- Existing budgets are reused.
- To force-recreate, delete the campaign in Google Ads UI first.

Run: python3 deploy_campaigns.py
"""

import sys
import re
import time
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from campaigns_config import (
    CAMPAIGNS,
    NEGATIVE_LISTS,
    SITELINKS,
    CALLOUTS,
    LOCATION_GEO_TARGETS,
    LANGUAGE_CRITERIA,
)

CUSTOMER_ID = "5342635272"  # RevFactor.io


def micros(usd):
    return int(round(usd * 1_000_000))


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


# ── existing-resource lookup helpers ─────────────────────────────────


def existing_campaigns(client):
    ga = client.get_service("GoogleAdsService")
    out = {}
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT campaign.id, campaign.name, campaign.resource_name, campaign.status FROM campaign WHERE campaign.status != 'REMOVED'",
    ):
        out[row.campaign.name] = row.campaign.resource_name
    return out


def existing_budgets(client):
    ga = client.get_service("GoogleAdsService")
    out = {}
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT campaign_budget.name, campaign_budget.resource_name, campaign_budget.status FROM campaign_budget WHERE campaign_budget.status != 'REMOVED'",
    ):
        out[row.campaign_budget.name] = row.campaign_budget.resource_name
    return out


def existing_negative_lists(client):
    ga = client.get_service("GoogleAdsService")
    out = {}
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT shared_set.name, shared_set.resource_name, shared_set.type FROM shared_set WHERE shared_set.type = 'NEGATIVE_KEYWORDS'",
    ):
        out[row.shared_set.name] = row.shared_set.resource_name
    return out


def existing_extension_feed_items(client, ext_type):
    ga = client.get_service("GoogleAdsService")
    out = []
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query=f"""
            SELECT extension_feed_item.resource_name, extension_feed_item.extension_type,
                   extension_feed_item.sitelink_feed_item.link_text,
                   extension_feed_item.callout_feed_item.callout_text
            FROM extension_feed_item
            WHERE extension_feed_item.extension_type = '{ext_type}'
        """,
    ):
        out.append(row.extension_feed_item)
    return out


# ── builders ─────────────────────────────────────────────────────────


def get_or_create_budget(client, name, daily_usd):
    cache = existing_budgets(client)
    if name in cache:
        return cache[name]
    svc = client.get_service("CampaignBudgetService")
    op = client.get_type("CampaignBudgetOperation")
    b = op.create
    b.name = name
    b.amount_micros = micros(daily_usd)
    b.delivery_method = client.enums.BudgetDeliveryMethodEnum.STANDARD
    b.explicitly_shared = False
    return svc.mutate_campaign_budgets(customer_id=CUSTOMER_ID, operations=[op]).results[0].resource_name


def get_or_create_negative_list(client, list_name, terms):
    cache = existing_negative_lists(client)
    if list_name in cache:
        return cache[list_name]

    # 1. Create shared set
    sset_svc = client.get_service("SharedSetService")
    sset_op = client.get_type("SharedSetOperation")
    s = sset_op.create
    s.name = list_name
    s.type_ = client.enums.SharedSetTypeEnum.NEGATIVE_KEYWORDS
    sset_rn = sset_svc.mutate_shared_sets(customer_id=CUSTOMER_ID, operations=[sset_op]).results[0].resource_name

    # 2. Add criteria (negative keywords) to shared set
    crit_svc = client.get_service("SharedCriterionService")
    ops = []
    for term in terms:
        op = client.get_type("SharedCriterionOperation")
        c = op.create
        c.shared_set = sset_rn
        # heuristic: multi-word → phrase, single-word → broad
        if " " in term:
            c.keyword.match_type = client.enums.KeywordMatchTypeEnum.PHRASE
        else:
            c.keyword.match_type = client.enums.KeywordMatchTypeEnum.BROAD
        c.keyword.text = term
        ops.append(op)
    crit_svc.mutate_shared_criteria(customer_id=CUSTOMER_ID, operations=ops)
    return sset_rn


def attach_negatives_to_campaign(client, campaign_rn, shared_set_rn):
    csset_svc = client.get_service("CampaignSharedSetService")
    op = client.get_type("CampaignSharedSetOperation")
    csset = op.create
    csset.campaign = campaign_rn
    csset.shared_set = shared_set_rn
    try:
        csset_svc.mutate_campaign_shared_sets(customer_id=CUSTOMER_ID, operations=[op])
    except GoogleAdsException as e:
        # already attached → ignore
        if "already exists" in str(e).lower() or "DUPLICATE" in str(e):
            return
        raise


def create_campaign(client, spec, budget_rn):
    cs = client.get_service("CampaignService")
    op = client.get_type("CampaignOperation")
    c = op.create
    c.name = spec["name"]
    c.advertising_channel_type = client.enums.AdvertisingChannelTypeEnum.SEARCH
    c.status = client.enums.CampaignStatusEnum.PAUSED  # ALWAYS PAUSED
    c.campaign_budget = budget_rn
    # Manual CPC bid strategy with default max CPC
    c.manual_cpc.enhanced_cpc_enabled = False
    # Network: search only, no display partners
    c.network_settings.target_google_search = True
    c.network_settings.target_search_network = True
    c.network_settings.target_content_network = False
    c.network_settings.target_partner_search_network = False
    # Required as of 2024 — RevFactor isn't political/electioneering
    c.contains_eu_political_advertising = (
        client.enums.EuPoliticalAdvertisingStatusEnum.DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING
    )
    # Final URL Suffix — appended to every ad's final URL for DTR (Dynamic
    # Text Replacement). The landing page reads ?msg=<key> to swap the hero
    # headline + subhead to match the search intent of the campaign.
    if spec.get("final_url_suffix"):
        c.final_url_suffix = spec["final_url_suffix"]
    return cs.mutate_campaigns(customer_id=CUSTOMER_ID, operations=[op]).results[0].resource_name


def add_geo_and_language_criteria(client, campaign_rn):
    cc_svc = client.get_service("CampaignCriterionService")
    ops = []
    geo_target_const_service = client.get_service("GeoTargetConstantService")

    for geo_id in LOCATION_GEO_TARGETS:
        op = client.get_type("CampaignCriterionOperation")
        cc = op.create
        cc.campaign = campaign_rn
        cc.location.geo_target_constant = geo_target_const_service.geo_target_constant_path(geo_id)
        ops.append(op)

    for lang_id in LANGUAGE_CRITERIA:
        op = client.get_type("CampaignCriterionOperation")
        cc = op.create
        cc.campaign = campaign_rn
        cc.language.language_constant = f"languageConstants/{lang_id}"
        ops.append(op)

    cc_svc.mutate_campaign_criteria(customer_id=CUSTOMER_ID, operations=ops)


def create_ad_group(client, campaign_rn, ag_spec, default_max_cpc_usd):
    ag_svc = client.get_service("AdGroupService")
    op = client.get_type("AdGroupOperation")
    ag = op.create
    ag.name = ag_spec["name"]
    ag.campaign = campaign_rn
    ag.type_ = client.enums.AdGroupTypeEnum.SEARCH_STANDARD
    ag.status = client.enums.AdGroupStatusEnum.ENABLED
    ag.cpc_bid_micros = micros(ag_spec.get("max_cpc_usd", default_max_cpc_usd))
    return ag_svc.mutate_ad_groups(customer_id=CUSTOMER_ID, operations=[op]).results[0].resource_name


def add_keywords(client, ad_group_rn, keywords):
    crit_svc = client.get_service("AdGroupCriterionService")
    ops = []
    for text, match_type in keywords:
        op = client.get_type("AdGroupCriterionOperation")
        c = op.create
        c.ad_group = ad_group_rn
        c.status = client.enums.AdGroupCriterionStatusEnum.ENABLED
        c.keyword.text = text
        c.keyword.match_type = client.enums.KeywordMatchTypeEnum[match_type]
        ops.append(op)
    crit_svc.mutate_ad_group_criteria(customer_id=CUSTOMER_ID, operations=ops)


def create_rsa(client, ad_group_rn, rsa_spec, final_url):
    aga_svc = client.get_service("AdGroupAdService")
    op = client.get_type("AdGroupAdOperation")
    aga = op.create
    aga.ad_group = ad_group_rn
    aga.status = client.enums.AdGroupAdStatusEnum.ENABLED

    ad = aga.ad
    ad.final_urls.append(final_url)
    ad.responsive_search_ad.path1 = rsa_spec.get("path1", "")[:15]
    ad.responsive_search_ad.path2 = rsa_spec.get("path2", "")[:15]

    for h in rsa_spec["headlines"][:15]:
        asset = client.get_type("AdTextAsset")
        asset.text = h[:30]
        ad.responsive_search_ad.headlines.append(asset)

    for d in rsa_spec["descriptions"][:4]:
        asset = client.get_type("AdTextAsset")
        asset.text = d[:90]
        ad.responsive_search_ad.descriptions.append(asset)

    aga_svc.mutate_ad_group_ads(customer_id=CUSTOMER_ID, operations=[op])


# ── extensions (sitelinks + callouts) ────────────────────────────────


def create_sitelink_assets(client):
    """Create sitelink assets (returns dict name → resource_name)."""
    asset_svc = client.get_service("AssetService")
    # Look up existing sitelink assets
    ga = client.get_service("GoogleAdsService")
    existing = {}
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT asset.resource_name, asset.sitelink_asset.link_text, asset.type FROM asset WHERE asset.type = 'SITELINK'",
    ):
        existing[row.asset.sitelink_asset.link_text] = row.asset.resource_name

    out = {}
    ops = []
    for s in SITELINKS:
        if s["text"] in existing:
            out[s["text"]] = existing[s["text"]]
            continue
        op = client.get_type("AssetOperation")
        a = op.create
        a.sitelink_asset.link_text = s["text"]
        a.sitelink_asset.description1 = s["description1"]
        a.sitelink_asset.description2 = s["description2"]
        a.final_urls.append(s["final_url"])
        ops.append((s["text"], op))

    if ops:
        results = asset_svc.mutate_assets(
            customer_id=CUSTOMER_ID, operations=[o for _, o in ops]
        ).results
        for (text, _), result in zip(ops, results):
            out[text] = result.resource_name
    return out


def create_callout_assets(client):
    asset_svc = client.get_service("AssetService")
    ga = client.get_service("GoogleAdsService")
    existing = {}
    for row in ga.search(
        customer_id=CUSTOMER_ID,
        query="SELECT asset.resource_name, asset.callout_asset.callout_text, asset.type FROM asset WHERE asset.type = 'CALLOUT'",
    ):
        existing[row.asset.callout_asset.callout_text] = row.asset.resource_name

    out = {}
    ops = []
    for c in CALLOUTS:
        if c in existing:
            out[c] = existing[c]
            continue
        op = client.get_type("AssetOperation")
        a = op.create
        a.callout_asset.callout_text = c
        ops.append((c, op))

    if ops:
        results = asset_svc.mutate_assets(
            customer_id=CUSTOMER_ID, operations=[o for _, o in ops]
        ).results
        for (text, _), result in zip(ops, results):
            out[text] = result.resource_name
    return out


def attach_assets_to_campaign(client, campaign_rn, asset_rns, field_type):
    """Attach a list of asset resource_names to a campaign as `field_type` (e.g. SITELINK, CALLOUT)."""
    ca_svc = client.get_service("CampaignAssetService")
    ops = []
    for rn in asset_rns:
        op = client.get_type("CampaignAssetOperation")
        ca = op.create
        ca.campaign = campaign_rn
        ca.asset = rn
        ca.field_type = client.enums.AssetFieldTypeEnum[field_type]
        ops.append(op)
    try:
        ca_svc.mutate_campaign_assets(customer_id=CUSTOMER_ID, operations=ops)
    except GoogleAdsException as e:
        # already-linked errors are OK
        msg = str(e).lower()
        if "already" in msg or "duplicate" in msg:
            return
        raise


# ── main orchestration ──────────────────────────────────────────────


def main():
    client = GoogleAdsClient.load_from_storage(
        str(HERE / "google-ads.yaml"), version="v24"
    )

    print("=== Negative keyword lists ===")
    neg_list_rns = []
    for list_name, terms in NEGATIVE_LISTS.items():
        rn = get_or_create_negative_list(client, list_name, terms)
        neg_list_rns.append(rn)
        print(f"  [ok] {list_name} → {rn}")

    print("\n=== Sitelink + callout assets ===")
    sitelink_assets = create_sitelink_assets(client)
    callout_assets = create_callout_assets(client)
    print(f"  Sitelinks: {len(sitelink_assets)} ready")
    print(f"  Callouts:  {len(callout_assets)} ready")

    print("\n=== Campaigns ===")
    existing = existing_campaigns(client)
    for spec in CAMPAIGNS:
        if spec["name"] in existing:
            print(f"\n[skip] {spec['name']} — already exists ({existing[spec['name']]})")
            continue

        print(f"\n[creating] {spec['name']}")
        budget_name = f"Budget — {spec['name']}"
        budget_rn = get_or_create_budget(client, budget_name, spec["daily_budget_usd"])
        print(f"  budget: ${spec['daily_budget_usd']}/day → {budget_rn}")

        campaign_rn = create_campaign(client, spec, budget_rn)
        print(f"  campaign (PAUSED): {campaign_rn}")

        add_geo_and_language_criteria(client, campaign_rn)
        print(f"  geo: US, language: English")

        for nrn in neg_list_rns:
            attach_negatives_to_campaign(client, campaign_rn, nrn)
        print(f"  attached {len(neg_list_rns)} negative-keyword lists")

        # Attach sitelinks + callouts
        attach_assets_to_campaign(
            client, campaign_rn, list(sitelink_assets.values()), "SITELINK"
        )
        attach_assets_to_campaign(
            client, campaign_rn, list(callout_assets.values()), "CALLOUT"
        )
        print(f"  attached sitelinks + callouts")

        for ag_spec in spec["ad_groups"]:
            ag_rn = create_ad_group(client, campaign_rn, ag_spec, spec["default_max_cpc_usd"])
            add_keywords(client, ag_rn, ag_spec["keywords"])
            create_rsa(
                client,
                ag_rn,
                spec["rsa"],
                ag_spec.get("final_url", spec["final_url_default"]),
            )
            print(f"    ad group: {ag_spec['name']} ({len(ag_spec['keywords'])} kws + 1 RSA)")

    print("\n=== DONE ===")
    print("All campaigns created in PAUSED status. Review in Google Ads UI:")
    print(f"  https://ads.google.com/aw/campaigns?ocid=&__c=&authuser=0")
    print("Customer ID: 5342635272 (RevFactor.io)")


if __name__ == "__main__":
    main()
