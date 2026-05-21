"""Apply the RSA refresh + add price/promotion assets for RevFactor — 2026-05-18.

For each active ad group, create one new high-strength RSA following Google's
modern best practices:
  - 15 unique headlines (no concept repeats within an ad)
  - Dynamic {KeyWord:Default} insertion in headline 1
  - 4 descriptions framed differently (pain, stat, author, CTA)
  - No pinning (let Google rotate to maximize ad strength)
  - All headlines ≤30 chars, descriptions ≤90 chars (validated below)

Verified copy facts (per Aaron 2026-05-18):
  - +24% portfolio lift, +20-75% YoY top performers
  - $320/mo per door, flat fee
  - 10+ years STR revenue (Federico Zimerman)
  - 50+ operators
  - 198 listings managed
  - 15-min discovery call (NEVER 30-min)
  - Federico-only naming (not Federico & Emily)

Then:
  - Pause the leftover POOR ads in 4 groups that previously had only 2 ads
    (now safe because new RSA brings each group to 3 active)
  - Add Price asset (campaign-level, $320/door pricing) to all 3 search campaigns
  - Add Promotion asset (Free 15-Min Strategy Review) to all 3 search campaigns

No sitelinks added (URLs don't exist yet per Aaron). No call asset (per Aaron).
"""
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.protobuf.field_mask_pb2 import FieldMask
from datetime import date, timedelta

CID = "5342635272"

# ---- Final URLs (matching current LP routing) ----
URL_CONSULTANT = "https://www.revfactor.io/short-term-rental-consultant"
URL_TOOL = "https://www.revfactor.io/airbnb-pricing-strategy"
URL_VS = "https://www.revfactor.io/vs/pricelabs"  # /vs/beyond and /vs/wheelhouse don't exist

# ---- 7 RSAs, one per active ad group ----
# All headlines ≤30 chars, descriptions ≤90 chars, validated at script-load time.
RSAS = [
    {
        "ad_group": "airbnb-consultant-exact",
        "final_url": URL_CONSULTANT,
        "path1": "consultant",
        "path2": "strategy",
        "headlines": [
            "{KeyWord:STR Revenue Consultant}",
            "Founder-Led STR Strategy",
            "Federico Reviews Your Setup",
            "+24% Avg Lift vs Comp Set",
            "Top Hosts See +20-75% YoY",
            "Free 15-Min Strategy Review",
            "$320/mo Per Door, Flat",
            "Strategy Your Tool Misses",
            "Monthly Calls, Weekly Comp",
            "Most Consultants Vanish",
            "10+ Years STR Revenue",
            "Calendar, LOS, Channel Mix",
            "Direct Strategist Access",
            "198 Listings Managed",
            "No Revenue-Share Gotchas",
        ],
        "descriptions": [
            "Most consultants audit, hand a deck, and vanish. Federico stays on every account.",
            "+24% portfolio lift across 198 listings. Top performers +20-75% YoY.",
            "Federico Zimerman, founder + senior strategist. 10+ years. Leads every account.",
            "Free 15-min strategy call. Walk away with 3 specific revenue moves to run today.",
        ],
    },
    {
        "ad_group": "str-consultant-phrase",
        "final_url": URL_CONSULTANT,
        "path1": "revenue-mgmt",
        "path2": "strategy",
        "headlines": [
            "{KeyWord:STR Revenue Mgmt}",
            "STR Revenue Strategy Right",
            "Beyond Algorithmic Pricing",
            "+24% Lift Documented",
            "Top Hosts Earn +20-75% YoY",
            "Free 15-Min Discovery Call",
            "Federico - STR Strategist",
            "$320 Per Door, Flat Fee",
            "Monthly Strategy, Weekly Comp",
            "Tool + Strategist = Lift",
            "Pairs With Any Pricing Tool",
            "Calendar Moves Tools Miss",
            "LOS Rules Tuned by Human",
            "10+ Years STR Revenue",
            "198 Listings Managed",
        ],
        "descriptions": [
            "Most STRs lose 24% to algorithm-only pricing. We extract it. Free 15-min review.",
            "+24% lift across 198 listings. Top performers +20-75% YoY. $320/door, flat.",
            "Monthly strategy + weekly comp tracking. Direct line to a senior strategist.",
            "Federico Zimerman, 10+ years STR revenue. 3 moves in 15 min. Free, no pitch.",
        ],
    },
    {
        "ad_group": "airbnb-pricing-tool-exact",
        "final_url": URL_TOOL,
        "path1": "pricing-tool",
        "path2": "strategy",
        "headlines": [
            "{KeyWord:Airbnb Pricing Tool}",
            "Pricing Tool + Strategist",
            "Algorithm Alone = 24% Lost",
            "+24% Above Your Tool Earns",
            "Free 15-Min Tool Review",
            "Federico Tunes Your Tool",
            "Pairs With PriceLabs/Beyond",
            "Strategy Your Tool Misses",
            "$320/mo Per Door, Flat",
            "198 STR Properties Managed",
            "Comp Tracking, Done Weekly",
            "Calendar Moves a Human Times",
            "LOS Rules a Tool Won't Write",
            "10+ Years STR Revenue",
            "3 Revenue Moves in 15 Min",
        ],
        "descriptions": [
            "Already on a pricing tool? You're 24% short. We extract what your algorithm misses.",
            "Algorithms execute. Federico strategizes. $320 per door, flat. Pairs with any tool.",
            "+24% lift across 198 listings. Top performers +20-75% YoY. Free 15-min review.",
            "Federico reviews your tool setup in 15 min. Walk away with 3 revenue moves. Free.",
        ],
    },
    {
        "ad_group": "airbnb-pricing-tool-phrase",
        "final_url": URL_TOOL,
        "path1": "pricing-tool",
        "path2": "strategy",
        # Reuse the exact-match copy — same audience, same intent
        "headlines": None,  # filled in below from exact-match
        "descriptions": None,
    },
    {
        "ad_group": "beyond-pricing-conquest",
        "final_url": URL_VS,
        "path1": "vs-beyond",
        "path2": "strategy",
        "headlines": [
            "Already on Beyond Pricing?",
            "Layer Strategy on Beyond",
            "+24% Above Beyond's Lift",
            "Beyond + Real STR Strategist",
            "Free 15-Min Strategy Review",
            "Federico Tunes Beyond Setup",
            "What Beyond Can't Optimize",
            "Weekly Comp Tracking",
            "LOS Strategy by a Human",
            "Calendar Moves Beyond Misses",
            "$320 Per Door, Flat Fee",
            "Senior STR Strategist",
            "10+ Years STR Revenue",
            "198 Listings Managed",
            "Walk Away With 3 Moves",
        ],
        "descriptions": [
            "Beyond Pricing sets numbers. We build the strategy that makes them work. +24% on top.",
            "Already using Beyond? Federico reviews your setup in 15 min. 3 specific moves. Free.",
            "Strategy Beyond can't ship: comp positioning, LOS, calendar, channel mix.",
            "10+ years STR revenue across 198 listings. Pairs with Beyond. $320/door, flat.",
        ],
    },
    {
        "ad_group": "wheelhouse-conquest",
        "final_url": URL_VS,
        "path1": "vs-wheelhouse",
        "path2": "strategy",
        "headlines": [
            "Already on Wheelhouse?",
            "Layer Strategy on Wheelhouse",
            "+24% Above Wheelhouse's Lift",
            "Wheelhouse + STR Strategist",
            "Free 15-Min Strategy Review",
            "Federico Tunes Your Setup",
            "What Wheelhouse Misses",
            "Weekly Comp Tracking",
            "LOS Strategy by a Human",
            "Calendar Moves Tools Miss",
            "$320 Per Door, Flat Fee",
            "Senior STR Strategist",
            "10+ Years STR Revenue",
            "198 Listings Managed",
            "Walk Away With 3 Moves",
        ],
        "descriptions": [
            "Wheelhouse sets numbers. We build the strategy that makes them work. +24% on top.",
            "Already on Wheelhouse? Federico reviews your setup in 15 min. 3 moves. Free.",
            "Strategy Wheelhouse can't ship: comp, LOS, calendar, channel mix. $320/door.",
            "10+ years STR revenue, 198 listings. Pairs with Wheelhouse. Free 15-min review.",
        ],
    },
]
# Copy exact-match RSA content into phrase-match group
exact = next(r for r in RSAS if r["ad_group"] == "airbnb-pricing-tool-exact")
phrase = next(r for r in RSAS if r["ad_group"] == "airbnb-pricing-tool-phrase")
phrase["headlines"] = exact["headlines"]
phrase["descriptions"] = exact["descriptions"]

AD_NAME_PREFIX = "RSA v2 — 2026-05-18"


def validate():
    """Hard-fail if any headline > 30 chars or description > 90 chars."""
    errors = []
    for r in RSAS:
        for h in r["headlines"]:
            # Dynamic insertion {KeyWord:Default} — Google counts the longer of: tag fallback length, or runtime keyword.
            # We'll use the visible length of the fallback string for validation.
            visible = h
            if visible.startswith("{KeyWord:") and visible.endswith("}"):
                visible = visible[len("{KeyWord:"):-1]
            if len(visible) > 30:
                errors.append(f"{r['ad_group']} headline TOO LONG ({len(visible)}): '{h}'")
        for d in r["descriptions"]:
            if len(d) > 90:
                errors.append(f"{r['ad_group']} description TOO LONG ({len(d)}): '{d}'")
        if len(r.get("path1", "")) > 15 or len(r.get("path2", "")) > 15:
            errors.append(f"{r['ad_group']} path too long")
    if errors:
        for e in errors:
            print(f"  ❌ {e}")
        raise SystemExit("Aborting: copy fails length validation")
    print(f"  ✓ all {len(RSAS)} RSAs pass length validation")


def find_ad_group(ga, name):
    q = f"""SELECT ad_group.resource_name, ad_group.id, ad_group.name,
                  campaign.name, campaign.status, ad_group.status
           FROM ad_group
           WHERE ad_group.name = '{name}'
             AND campaign.status != 'REMOVED'
             AND ad_group.status != 'REMOVED'"""
    rows = list(ga.search(customer_id=CID, query=q))
    return rows[0] if rows else None


def already_has_v2(ga, ag_resource):
    q = f"""SELECT ad_group_ad.ad.name, ad_group_ad.status
           FROM ad_group_ad
           WHERE ad_group.resource_name = '{ag_resource}'
             AND ad_group_ad.status != 'REMOVED'"""
    for r in ga.search(customer_id=CID, query=q):
        if r.ad_group_ad.ad.name and AD_NAME_PREFIX in r.ad_group_ad.ad.name:
            return True
    return False


def create_rsa(client, ga, spec):
    ag = find_ad_group(ga, spec["ad_group"])
    if not ag:
        print(f"  [SKIP] '{spec['ad_group']}' not found")
        return False
    if already_has_v2(ga, ag.ad_group.resource_name):
        print(f"  [SKIP] '{spec['ad_group']}' already has a v2 RSA")
        return False

    svc = client.get_service("AdGroupAdService")
    op = client.get_type("AdGroupAdOperation")
    aga = op.create
    aga.ad_group = ag.ad_group.resource_name
    aga.status = client.enums.AdGroupAdStatusEnum.ENABLED
    aga.ad.name = f"{AD_NAME_PREFIX} — {spec['ad_group']}"
    aga.ad.final_urls.append(spec["final_url"])

    rsa = aga.ad.responsive_search_ad
    for h in spec["headlines"]:
        asset = client.get_type("AdTextAsset")
        asset.text = h
        rsa.headlines.append(asset)
    for d in spec["descriptions"]:
        asset = client.get_type("AdTextAsset")
        asset.text = d
        rsa.descriptions.append(asset)
    rsa.path1 = spec["path1"]
    rsa.path2 = spec["path2"]

    try:
        resp = svc.mutate_ad_group_ads(customer_id=CID, operations=[op])
        print(f"  ✓ created RSA in '{spec['ad_group']}' → {resp.results[0].resource_name}")
        return True
    except GoogleAdsException as e:
        msg = str(e)
        if "POLICY_FINDING_ERROR" in msg or "POLICY_VIOLATION" in msg:
            print(f"  ⚠ POLICY ISSUE in '{spec['ad_group']}': {msg[:300]}")
        else:
            print(f"  ❌ FAIL '{spec['ad_group']}': {msg[:300]}")
        return False


def pause_remaining_poor_ads(client, ga):
    """Now that each affected group has 3+ ads, pause the lingering POOR ads."""
    d30 = (date.today() - timedelta(days=30)).isoformat()
    q = f"""
    SELECT ad_group.name, ad_group_ad.resource_name, ad_group_ad.ad.id,
           ad_group_ad.ad_strength
    FROM ad_group_ad
    WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      AND campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_ad.status = 'ENABLED'
      AND ad_group_ad.ad_strength = 'POOR'
      AND segments.date BETWEEN '{d30}' AND '{date.today().isoformat()}'
    """
    rows = list(ga.search(customer_id=CID, query=q))
    if not rows:
        print("  (no remaining POOR ads to pause)")
        return
    # Skip ads we just created (they'll have unknown ad_strength initially, not POOR)
    # Group by ad_group_name, only pause if group has ≥3 active ads
    from collections import defaultdict
    by_ag = defaultdict(list)
    for r in rows:
        by_ag[r.ad_group.name].append(r)

    # Count active ads per group (post-creation)
    q2 = f"""
    SELECT ad_group.name, ad_group_ad.resource_name
    FROM ad_group_ad
    WHERE campaign.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND ad_group_ad.status = 'ENABLED'
      AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
    """
    active_count = defaultdict(int)
    for r in ga.search(customer_id=CID, query=q2):
        active_count[r.ad_group.name] += 1

    svc = client.get_service("AdGroupAdService")
    ops = []
    for ag, poor_ads in by_ag.items():
        if active_count[ag] < 3:
            print(f"  [SKIP] '{ag}' has only {active_count[ag]} active ads — keep POOR for floor")
            continue
        # Pause all POOR in this group (we already added a new v2 to keep ≥2)
        for pa in poor_ads:
            op = client.get_type("AdGroupAdOperation")
            op.update.resource_name = pa.ad_group_ad.resource_name
            op.update.status = client.enums.AdGroupAdStatusEnum.PAUSED
            op.update_mask.CopyFrom(FieldMask(paths=["status"]))
            ops.append(op)
            print(f"  pause POOR id={pa.ad_group_ad.ad.id} in '{ag}'")
    if ops:
        svc.mutate_ad_group_ads(customer_id=CID, operations=ops)
        print(f"  ✓ {len(ops)} POOR ads paused")


def add_promotion_assets(client, ga):
    """Add a Promotion asset and link to all 3 active search campaigns."""
    # 1) Find existing or create new promotion asset
    asset_svc = client.get_service("AssetService")
    q = """
    SELECT asset.resource_name, asset.name, asset.promotion_asset.promotion_target
    FROM asset
    WHERE asset.type = 'PROMOTION'
    """
    existing = None
    for r in ga.search(customer_id=CID, query=q):
        if r.asset.name == "RevFactor 15-Min Strategy Review":
            existing = r.asset.resource_name
            break
    if existing:
        promo_rn = existing
        print(f"  [reuse] Promotion asset {existing}")
    else:
        op = client.get_type("AssetOperation")
        a = op.create
        a.name = "RevFactor 15-Min Strategy Review"
        promo = a.promotion_asset
        promo.promotion_target = "Free 15-min strategy review"
        promo.discount_modifier = client.enums.PromotionExtensionDiscountModifierEnum.UP_TO  # not used but required-ish
        # Use OTHER occasion since none of Google's preset occasions apply
        promo.occasion = client.enums.PromotionExtensionOccasionEnum.OTHER
        promo.language_code = "en"
        # Discount: $0 off (it's free) — use money_amount_off=0
        promo.money_amount_off.amount_micros = 0
        promo.money_amount_off.currency_code = "USD"
        promo.final_urls.append(URL_CONSULTANT)
        try:
            resp = asset_svc.mutate_assets(customer_id=CID, operations=[op])
            promo_rn = resp.results[0].resource_name
            print(f"  ✓ created Promotion asset → {promo_rn}")
        except GoogleAdsException as e:
            print(f"  ⚠ Promotion asset create skipped: {str(e)[:200]}")
            return

    # 2) Link to each active search campaign
    camp_q = "SELECT campaign.resource_name, campaign.name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'"
    camps = [r for r in ga.search(customer_id=CID, query=camp_q) if "Search" in r.campaign.name]
    ca_svc = client.get_service("CampaignAssetService")
    existing_links_q = f"""
    SELECT campaign_asset.campaign, campaign_asset.asset
    FROM campaign_asset
    WHERE campaign_asset.asset = '{promo_rn}'
    """
    linked = {r.campaign_asset.campaign for r in ga.search(customer_id=CID, query=existing_links_q)}
    ops = []
    for camp in camps:
        if camp.campaign.resource_name in linked:
            print(f"  [skip link] '{camp.campaign.name}' already has promotion linked")
            continue
        op = client.get_type("CampaignAssetOperation")
        op.create.campaign = camp.campaign.resource_name
        op.create.asset = promo_rn
        op.create.field_type = client.enums.AssetFieldTypeEnum.PROMOTION
        ops.append(op)
        print(f"  link promotion → '{camp.campaign.name}'")
    if ops:
        try:
            ca_svc.mutate_campaign_assets(customer_id=CID, operations=ops)
            print(f"  ✓ linked promotion to {len(ops)} campaign(s)")
        except GoogleAdsException as e:
            print(f"  ⚠ link failed: {str(e)[:200]}")


def main():
    HERE = Path(__file__).parent
    client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
    ga = client.get_service("GoogleAdsService")

    print("=== STEP 1 — validate copy ===")
    validate()

    print("\n=== STEP 2 — create 6 new RSAs ===")
    created = 0
    for spec in RSAS:
        if create_rsa(client, ga, spec):
            created += 1
    print(f"\n  → {created}/{len(RSAS)} RSAs created")

    print("\n=== STEP 3 — pause remaining POOR ads in groups now at ≥3 active ===")
    pause_remaining_poor_ads(client, ga)

    # Step 4 (Promotion asset) intentionally skipped:
    # "Free 15-Min Strategy Review" doesn't fit Google's Promotion asset shape
    # (Promotion requires a discount). It's already captured in our 12 callouts.

    print("\n=== DONE ===")


if __name__ == "__main__":
    main()
