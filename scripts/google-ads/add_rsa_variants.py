"""Add 2 more RSA variants per ad group to lift ad strength from POOR → GOOD/EXCELLENT.

Existing RSA: 1 per ad group (15 headlines, 4 descriptions). All themed around the
same hook ("Tool's Leaving 18%"). Google rates ad strength POOR when headlines
repeat the same angle.

Two new RSAs per ad group with DIFFERENT angles:
  v2 — Outcome-focused (specific lift numbers, pricing details, deliverables)
  v3 — Founder + credibility (Federico's role, 10+ years, 50+ operators)

Run dry-run first:  python3 add_rsa_variants.py
Apply:              python3 add_rsa_variants.py --apply
"""

import sys
from google.ads.googleads.client import GoogleAdsClient

client = GoogleAdsClient.load_from_storage("google-ads.yaml")
ga = client.get_service("GoogleAdsService")
CID = "5342635272"

# Per-campaign-class variants. Tool/Conquest land on /airbnb-pricing-strategy
# or /vs/pricelabs (varies); Consultant lands on /short-term-rental-consultant.
# Final URL stays the same as the existing RSA in that ad group.

TOOL_V2 = {
    "headlines": [
        "+24% Average Lift",
        "Top Performers: +20-75%",
        "$320 a Door, Flat Fee",
        "Recover 24% in 60 Days",
        "Beat Comp Set Monthly",
        "Calendar + Strategy",
        "Senior Strategist Onboard",
        "We Tune Your Pricing Tool",
        "Same-Day Strategist Replies",
        "Volume Pricing Past 5",
        "Risk-Free 30-Min Review",
        "3 Free Recommendations",
        "STR Revenue Recovery",
        "Bring a Strategist In",
        "Less Per Door at Scale",
    ],
    "descriptions": [
        "Documented +24% lift across our portfolio. Top performers see +20% to +75% YoY.",
        "Free 30-min strategy review — walk away with 3 specific moves you can run today.",
        "Comp tracking, LOS rules, calendar moves — strategy your pricing tool can't ship.",
        "$320 per door per month, less at scale. Flat fee, no revenue share. Cancel anytime.",
    ],
}
TOOL_V3 = {
    "headlines": [
        "Built by Federico Zimerman",
        "10+ Years STR Revenue",
        "50+ STR Operators Onboard",
        "Real STR Revenue Manager",
        "Senior Strategist, Free Call",
        "Trust Your Tool. Add Strategy",
        "Direct Founder Access",
        "STR Strategy Done Right",
        "Why Hosts Add a Strategist",
        "Pricing Tool, Not Strategy",
        "What Pricing Tools Miss",
        "Beyond the Algorithm",
        "Calendar Optimization",
        "Length-of-Stay Strategy",
        "Revenue Beyond the Tool",
    ],
    "descriptions": [
        "Federico Zimerman, founder + lead strategist. 10+ years in STR revenue. Free 30-min.",
        "Calendar moves a tool can't time. LOS rules a tool won't write. We do that work.",
        "50+ operators on platform. +24% portfolio average. Pairs with any pricing tool.",
        "Same-day responses, business hours. Senior strategist on every account, every month.",
    ],
}

CONSULTANT_V2 = {
    "headlines": [
        "+24% Average Revenue Lift",
        "Top STR Hosts: +20-75%",
        "$320 a Door, Volume Discount",
        "Less Per Door at Scale",
        "Recover 24% in 60 Days",
        "Beat the Comp Set Monthly",
        "Strategist Stays on Account",
        "Monthly Strategy Calls",
        "Weekly Comp Tracking",
        "Calendar Optimization",
        "Length-of-Stay Strategy",
        "Listing Photo + Copy Audit",
        "Channel Mix Strategy",
        "1 Property or 50",
        "No Revenue-Share Gotchas",
    ],
    "descriptions": [
        "+24% lift documented across our portfolio. Top performers earn +20% to +75% YoY.",
        "Monthly strategy + weekly comp tracking. Calendar, LOS, channel mix — full stack.",
        "Free 30-min strategy review — walk away with 3 specific revenue moves to run today.",
        "$320 per door, flat. Volume pricing past 5 properties. No revenue-share surprises.",
    ],
}
CONSULTANT_V3 = {
    "headlines": [
        "Built by Federico Zimerman",
        "Founder Leads Every Account",
        "Senior STR Strategist",
        "STR Revenue Done Right",
        "10+ Years STR Revenue",
        "50+ Operators Onboard",
        "We Stay. Most Don't.",
        "Most Consultants Vanish",
        "Direct Strategist Access",
        "Same-Day Strategist Replies",
        "STR Strategy You Trust",
        "Founder-Led, Not Outsourced",
        "Real Strategy, Real Lift",
        "RevFactor Strategy Studio",
        "Beyond DIY Pricing",
    ],
    "descriptions": [
        "Federico Zimerman leads every account — 10+ years STR revenue. No junior handoffs.",
        "Most consultants run an audit, hand a deck, and disappear. We partner ongoing.",
        "Senior strategist + 24/7 dashboard access. Free 30-min discovery call to start.",
        "1 property or a 50-portfolio — strategy adapts, fees scale. $320/mo per door, flat.",
    ],
}

CONQUEST_V2 = {
    "headlines": [
        "Layer Strategy on Your Tool",
        "Tools + Strategist = Lift",
        "+24% Above Your Tool",
        "Works With Any Pricing Tool",
        "Strategy a Tool Can't Ship",
        "Comp Tracking Done Right",
        "Length-of-Stay Strategy",
        "Calendar Move Timing",
        "Channel Mix Strategy",
        "Documented +24% Lift",
        "Top Performers +20-75%",
        "Senior Strategist on Account",
        "Same-Day Real Human Replies",
        "$320/mo Flat, Volume Disc.",
        "Free 30-Min Strategy Review",
    ],
    "descriptions": [
        "Keep your pricing tool. Add a strategist on top. +24% average lift across portfolio.",
        "Comp positioning, calendar moves, length-of-stay — the work an algorithm can't do.",
        "Free 30-min strategy review — walk away with 3 specific revenue moves to run today.",
        "$320 per door, flat fee, no revenue share. Volume pricing past 5 properties.",
    ],
}
CONQUEST_V3 = {
    "headlines": [
        "Built by Federico Zimerman",
        "10+ Years STR Revenue",
        "50+ STR Operators Trust Us",
        "Founder Leads Each Account",
        "Senior STR Strategist",
        "Real Human, Not Algorithm",
        "STR Strategy You Trust",
        "We Stay. Algorithms Don't.",
        "RevFactor Strategy Studio",
        "Pricing Tool, Not Strategy",
        "What Tools Miss, We Catch",
        "Beyond Algorithmic Pricing",
        "STR Revenue Beyond the Tool",
        "Comp Set Outperformance",
        "Direct Strategist Access",
    ],
    "descriptions": [
        "Federico Zimerman, founder + lead strategist — 10+ years in STR revenue management.",
        "50+ operators on platform. +24% portfolio lift. Pairs with PriceLabs, Wheelhouse, Beyond.",
        "Free 30-min strategy review — walk away with 3 specific revenue moves to run today.",
        "Senior strategist on every account. $320/mo per door, flat. No revenue-share gotchas.",
    ],
}

VARIANT_PLAN = {
    "Tool Intent":       [TOOL_V2, TOOL_V3],
    "Consultant Intent": [CONSULTANT_V2, CONSULTANT_V3],
    "Competitor Conquest": [CONQUEST_V2, CONQUEST_V3],
}

# Hard limits enforced by Google Ads (per RSA spec)
H_MAX = 30
D_MAX = 90


def trunc(s, n):
    return s if len(s) <= n else (s[: n - 1].rstrip() + "…")


def get_existing_keepers():
    """Return {ad_group_id: (campaign_name_short, ad_group_name, final_url, path1, path2)}."""
    out = {}
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT campaign.name, campaign.status, ad_group.name, ad_group.status, ad_group.id,
                   ad_group_ad.ad.final_urls,
                   ad_group_ad.ad.responsive_search_ad.path1,
                   ad_group_ad.ad.responsive_search_ad.path2
            FROM ad_group_ad
            WHERE ad_group_ad.status = 'ENABLED'
              AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
              AND campaign.name LIKE 'RF%'
        """,
    ):
        if r.campaign.status.name == "REMOVED" or r.ad_group.status.name != "ENABLED":
            continue
        urls = list(r.ad_group_ad.ad.final_urls)
        out[r.ad_group.id] = (
            r.campaign.name,
            r.ad_group.name,
            urls[0] if urls else None,
            r.ad_group_ad.ad.responsive_search_ad.path1,
            r.ad_group_ad.ad.responsive_search_ad.path2,
        )
    return out


def variant_kind(campaign_name):
    if "Tool Intent" in campaign_name:
        return "Tool Intent"
    if "Consultant Intent" in campaign_name:
        return "Consultant Intent"
    if "Conquest" in campaign_name:
        return "Competitor Conquest"
    return None


def build_op(ad_group_id, final_url, path1, path2, variant):
    op = client.get_type("AdGroupAdOperation")
    ad = op.create
    ad.ad_group = client.get_service("AdGroupService").ad_group_path(CID, ad_group_id)
    ad.status = client.enums.AdGroupAdStatusEnum.ENABLED
    ad.ad.final_urls.append(final_url)
    rsa = ad.ad.responsive_search_ad
    if path1:
        rsa.path1 = path1
    if path2:
        rsa.path2 = path2
    for h in variant["headlines"]:
        item = client.get_type("AdTextAsset")
        item.text = trunc(h, H_MAX)
        rsa.headlines.append(item)
    for d in variant["descriptions"]:
        item = client.get_type("AdTextAsset")
        item.text = trunc(d, D_MAX)
        rsa.descriptions.append(item)
    return op


def main(apply):
    keepers = get_existing_keepers()
    print(f"Found {len(keepers)} keeper ad group(s) with existing RSA.\n")

    ad_svc = client.get_service("AdGroupAdService")
    ops = []
    for ag_id, (camp, name, final_url, p1, p2) in sorted(keepers.items()):
        kind = variant_kind(camp)
        if not kind:
            print(f"  SKIP — unknown campaign type: {camp}")
            continue
        if not final_url:
            print(f"  SKIP — no final URL on existing RSA: {name}")
            continue
        for i, variant in enumerate(VARIANT_PLAN[kind], start=2):
            ops.append(
                (camp, name, f"v{i}", build_op(ag_id, final_url, p1, p2, variant))
            )
        print(f"  + 2 RSA variants → {camp[-22:]} | {name} → {final_url}")

    print(f"\nTotal RSAs to create: {len(ops)}")

    if not apply:
        print("\n(dry-run; pass --apply to create)")
        return

    # batch by ad group to keep operations small
    response = ad_svc.mutate_ad_group_ads(
        customer_id=CID, operations=[o for _, _, _, o in ops]
    )
    print(f"\nCreated {len(response.results)} RSAs.")


if __name__ == "__main__":
    apply = "--apply" in sys.argv
    main(apply)
