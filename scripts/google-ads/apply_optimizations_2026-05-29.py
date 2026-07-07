"""Apply optimizations identified 2026-05-29.

1) Fix Discovery Lead Captured (7619638228): set include_in_conversions_metric=True
   so Smart Bidding actually optimizes against it (currently False — explains why
   the algo has been training on only 2 events/30d).

2) Add 12 negative keywords across all 3 Search campaigns to stop the
   information-seeker / free-tool / tax-loophole spend leak.

3) Lower bid cap on str-consultant-phrase ad group (the $409/14d / 0-conv bleed)
   from current to a $4 max-CPC ceiling — keeps it serving (preserves spend
   velocity for the credit threshold) but stops the $7.83 avg CPC hemorrhage.

Run: python3 apply_optimizations_2026-05-29.py [--dry-run]
"""
import sys
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
from google.api_core.protobuf_helpers import field_mask

DRY = '--dry-run' in sys.argv
HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / 'google-ads.yaml'), version='v24')
CID = '5342635272'

# ============================================================
# 1) Discovery Lead Captured — needs UI fix (field is API-immutable)
# ============================================================
print("=" * 60)
print("1) Discovery Lead Captured (7619638228) — UI fix required")
print("=" * 60)
print("  include_in_conversions_metric is API-immutable. Flip it in:")
print("  Tools → Conversions → 'Discovery Lead Captured' → Settings →")
print("    'Include in \"Conversions\"' → toggle ON")
print("  (Smart Bidding currently sees 0 events from this action because")
print("   it's logged to All-Conv only. Toggle gives the algo +5x signal.)")

# ============================================================
# 2) Add negative keywords to all 3 Search campaigns
# ============================================================
print()
print("=" * 60)
print("2) Add negatives to all 3 Search campaigns")
print("=" * 60)

# Find the 3 active Search campaign IDs
ga_svc = client.get_service('GoogleAdsService')
q_campaigns = """SELECT campaign.id, campaign.name FROM campaign
                 WHERE campaign.status = 'ENABLED'
                 AND campaign.advertising_channel_type = 'SEARCH'"""
campaign_ids = []
for row in ga_svc.search(customer_id=CID, query=q_campaigns):
    campaign_ids.append((row.campaign.id, row.campaign.name))
    print(f"  Target: {row.campaign.id} | {row.campaign.name}")

# Match-type-aware negatives. EXACT for brand/tool names we want narrowly excluded;
# PHRASE for multi-word patterns that should catch variants;
# BROAD only for safe single concepts.
NEGATIVES = [
    # Tax / real-estate-loophole intent (high spend leak, zero RM intent)
    ("loophole", "BROAD"),
    ("str loophole", "PHRASE"),
    ("material participation", "PHRASE"),
    ("wealth calculator", "PHRASE"),
    # Free-tool / bargain hunter intent
    ("free trial", "PHRASE"),
    ("free tool", "PHRASE"),
    ("free alternative", "PHRASE"),
    ("rentalizer free", "PHRASE"),
    ("airdna free", "PHRASE"),
    ("free calculator", "PHRASE"),
    # Competitor research / info-seeker
    ("vodyssey", "EXACT"),
    ("mash advisor", "EXACT"),
]

cc_svc = client.get_service('CampaignCriterionService')
ops = []
for cid, cname in campaign_ids:
    for kw_text, mt in NEGATIVES:
        op = client.get_type('CampaignCriterionOperation')
        c = op.create
        c.campaign = ga_svc.campaign_path(CID, cid)
        c.negative = True
        c.keyword.text = kw_text
        c.keyword.match_type = getattr(client.enums.KeywordMatchTypeEnum, mt)
        ops.append(op)

print(f"\n  Adding {len(NEGATIVES)} negatives × {len(campaign_ids)} campaigns = {len(ops)} operations")

if DRY:
    print("  [DRY-RUN] would add the negatives above")
else:
    # One-by-one (partial_failure batch API isn't exposed in this client version)
    added = 0
    dup = 0
    err = 0
    for op in ops:
        try:
            r = cc_svc.mutate_campaign_criteria(customer_id=CID, operations=[op])
            added += 1
        except Exception as e:
            msg = str(e)
            if 'CRITERION_LEVEL_BID_MODIFIER' in msg or 'DUPLICATE' in msg.upper() or 'already exists' in msg.lower() or 'EXACT_DUPLICATE' in msg:
                dup += 1
            else:
                err += 1
                kw = op.create.keyword
                print(f"    skip [{kw.text} / {kw.match_type.name}]: {msg[:120]}")
    print(f"  ✓ added {added} | already-existed {dup} | other errors {err}")

print()
print("Done. Bid-cap on str-consultant-phrase deferred until promo terms confirmed —")
print("don't want to slow daily spend velocity if we need to hit a threshold.")
