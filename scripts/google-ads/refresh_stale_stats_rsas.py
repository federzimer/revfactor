#!/usr/bin/env python3
"""Refresh live Google Ads RSAs that still carry stale portfolio stats.

What this fixes
- Live RSAs across 6 ad groups (Tool, Consultant exact/phrase, Beyond
  Pricing Conquest, PriceLabs Conquest) still serve "165+ Properties
  Managed" and "+18% lift across 165+ properties" while the LPs say
  "198 properties" and "+24% lift". That's ad/LP drift — bad for ad
  strength, bad for Google Ads policy alignment.

What this script does
- For every ENABLED RSA with stale text:
    1. Read all headlines + descriptions
    2. Apply the same stat regex swaps used by
       scripts/update_portfolio_stats.py (165 → 198, 56 → 67, 18% → 24%)
    3. Validate every output is ≤30 chars (headlines) / ≤90 chars (descs)
       per the RSA pre-flight checklist
    4. Create a NEW RSA in the same ad group with the cleaned copy
       and the same Final URL
    5. PAUSE (not remove) the stale RSA so we can roll back
- Final URL is preserved per-RSA (no URL rewrites)
- pinned_field is preserved per asset

Usage
    python3 refresh_stale_stats_rsas.py             # dry-run, prints diff
    python3 refresh_stale_stats_rsas.py --apply     # creates + pauses
"""
from __future__ import annotations
import re
import sys
from pathlib import Path
from typing import Iterable
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException
from google.protobuf.field_mask_pb2 import FieldMask

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
ga = client.get_service("GoogleAdsService")
CID = "5342635272"

# Stat regex swaps. Order matters — longest patterns first so the more
# specific phrases substitute before bare numbers.
SUBS = [
    # +18% phrasings -> +24%
    (re.compile(r"\+18% portfolio lift"), "+24% portfolio lift"),
    (re.compile(r"\+18% lift"), "+24% lift"),
    (re.compile(r"\+18%"), "+24%"),
    # Bare 18% phrasings -> 24%
    (re.compile(r"\b18-25% lift\b"), "24% lift"),
    (re.compile(r"\bleaves 18%\b"), "leaves 24%"),
    (re.compile(r"\bleave 18%\b"), "leave 24%"),
    (re.compile(r"\bleaving 18%\b"), "leaving 24%"),
    (re.compile(r"\b18% lift\b"), "24% lift"),
    (re.compile(r"\bAdd 18%"), "Add 24%"),
    (re.compile(r"\bEarn 18% More"), "Earn 24% More"),
    (re.compile(r"\b18% Lost\b"), "24% Lost"),
    (re.compile(r"\b18% Revenue\b"), "24% Revenue"),
    (re.compile(r"Lose 18%"), "Lose 24%"),
    # Properties — 165+ phrasings -> 198
    (re.compile(r"\b165\+ STR Properties Managed\b"), "198 STR Properties Managed"),
    (re.compile(r"\b165\+ Properties Managed\b"), "198 Properties Managed"),
    (re.compile(r"\b165\+ properties\b"), "198 properties"),
    (re.compile(r"\b165\+ listings\b"), "198 listings"),
    (re.compile(r"\bacross 165\+ properties\b"), "across 198 properties"),
    (re.compile(r"\b165\+ STR Properties\b"), "198 STR Properties"),
    # Markets — 56 phrasings -> 67
    (re.compile(r"\b56 markets\b"), "67 markets"),
    (re.compile(r"\b56 US markets\b"), "67 US markets"),
    (re.compile(r"\b56-market\b"), "67-market"),
]

# What "stale" looks like at scan time
STALE_DETECTOR = re.compile(
    r"\b165\b|\b56 market|\b56-market|\b18% (lift|leave|leaving|RevPAR|your|an )|\b100\+ propert"
)

# Char limits per RSA pre-flight checklist
MAX_HEADLINE = 30
MAX_DESCRIPTION = 90


def rewrite(text: str) -> str:
    new = text
    for rx, repl in SUBS:
        new = rx.sub(repl, new)
    return new


def is_stale(text: str) -> bool:
    return bool(STALE_DETECTOR.search(text))


def fetch_stale_rsas() -> list[dict]:
    """Find all ENABLED RSAs with at least one stale headline/description."""
    q = """
    SELECT ad_group_ad.ad.id,
           ad_group_ad.resource_name,
           ad_group_ad.ad.responsive_search_ad.headlines,
           ad_group_ad.ad.responsive_search_ad.descriptions,
           ad_group_ad.ad.responsive_search_ad.path1,
           ad_group_ad.ad.responsive_search_ad.path2,
           ad_group_ad.ad.final_urls,
           ad_group.id,
           ad_group.name,
           ad_group.resource_name,
           campaign.name,
           campaign.id
    FROM ad_group_ad
    WHERE ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
      AND ad_group_ad.status = 'ENABLED'
      AND ad_group.status = 'ENABLED'
      AND campaign.status = 'ENABLED'
    """
    stale = []
    for row in ga.search(customer_id=CID, query=q):
        ad = row.ad_group_ad.ad
        rsa = ad.responsive_search_ad
        any_stale_h = any(is_stale(h.text) for h in rsa.headlines)
        any_stale_d = any(is_stale(d.text) for d in rsa.descriptions)
        if not (any_stale_h or any_stale_d):
            continue
        stale.append({
            "campaign": row.campaign.name,
            "ad_group_name": row.ad_group.name,
            "ad_group_resource": row.ad_group.resource_name,
            "ad_group_ad_resource": row.ad_group_ad.resource_name,
            "ad_id": ad.id,
            "final_urls": list(ad.final_urls),
            "path1": rsa.path1,
            "path2": rsa.path2,
            "headlines": [(h.text, h.pinned_field) for h in rsa.headlines],
            "descriptions": [(d.text, d.pinned_field) for d in rsa.descriptions],
        })
    return stale


def build_refreshed(stale_rsa: dict) -> dict:
    """Apply rewrite() to all assets; return the refreshed spec."""
    new_h = [(rewrite(t), pf) for (t, pf) in stale_rsa["headlines"]]
    new_d = [(rewrite(t), pf) for (t, pf) in stale_rsa["descriptions"]]
    changed_h = [(o[0], n[0]) for o, n in zip(stale_rsa["headlines"], new_h) if o[0] != n[0]]
    changed_d = [(o[0], n[0]) for o, n in zip(stale_rsa["descriptions"], new_d) if o[0] != n[0]]
    return {
        **stale_rsa,
        "new_headlines": new_h,
        "new_descriptions": new_d,
        "changed_h": changed_h,
        "changed_d": changed_d,
    }


_KW_RX = re.compile(r"\{KeyWord:([^}]+)\}")


def _effective_len(text: str) -> int:
    """Char length Google actually enforces. {KeyWord:Default} wrappers
    count only the fallback text, not the literal `{KeyWord:` / `}`."""
    return len(_KW_RX.sub(lambda m: m.group(1), text))


def validate(refreshed: dict) -> list[str]:
    errs = []
    for text, _ in refreshed["new_headlines"]:
        n = _effective_len(text)
        if n > MAX_HEADLINE:
            errs.append(f"headline TOO LONG ({n}>30): '{text}'")
    for text, _ in refreshed["new_descriptions"]:
        n = _effective_len(text)
        if n > MAX_DESCRIPTION:
            errs.append(f"description TOO LONG ({n}>90): '{text}'")
    return errs


def create_refreshed_rsa_and_pause_old(refreshed: dict) -> tuple[str, str]:
    svc = client.get_service("AdGroupAdService")

    # 1. PAUSE old RSA FIRST so the 3-RSA-per-ad-group cap doesn't block
    #    the subsequent create. Preserves the old RSA for rollback.
    pause_op = client.get_type("AdGroupAdOperation")
    pause_op.update.resource_name = refreshed["ad_group_ad_resource"]
    pause_op.update.status = client.enums.AdGroupAdStatusEnum.PAUSED
    pause_op.update_mask.paths.append("status")
    try:
        svc.mutate_ad_group_ads(customer_id=CID, operations=[pause_op])
    except GoogleAdsException as e:
        # "not allowed for removed resources" = ad was already removed by
        # a prior refresh / cleanup; that's a no-op for us, continue to
        # the create step.
        msg = "; ".join(err.message for err in e.failure.errors)
        if "removed resources" not in msg.lower():
            raise

    # 2. CREATE new RSA
    create_op = client.get_type("AdGroupAdOperation")
    aga = create_op.create
    aga.ad_group = refreshed["ad_group_resource"]
    aga.status = client.enums.AdGroupAdStatusEnum.ENABLED
    ad = aga.ad
    for url in refreshed["final_urls"]:
        ad.final_urls.append(url)
    rsa = ad.responsive_search_ad
    if refreshed["path1"]:
        rsa.path1 = refreshed["path1"]
    if refreshed["path2"]:
        rsa.path2 = refreshed["path2"]
    for text, pf in refreshed["new_headlines"]:
        h = client.get_type("AdTextAsset")
        h.text = text
        if pf:
            h.pinned_field = pf
        rsa.headlines.append(h)
    for text, pf in refreshed["new_descriptions"]:
        d = client.get_type("AdTextAsset")
        d.text = text
        if pf:
            d.pinned_field = pf
        rsa.descriptions.append(d)

    create_resp = svc.mutate_ad_group_ads(customer_id=CID, operations=[create_op])
    new_resource = create_resp.results[0].resource_name
    return new_resource, refreshed["ad_group_ad_resource"]


def main(apply: bool) -> int:
    print(f"Scanning ENABLED RSAs in account {CID}...\n")
    stale = fetch_stale_rsas()
    if not stale:
        print("✓ No stale RSAs found — nothing to do.")
        return 0

    print(f"Found {len(stale)} stale RSA(s):\n")

    refreshed_specs = []
    fatal_errs = []
    for s in stale:
        r = build_refreshed(s)
        errs = validate(r)
        if errs:
            fatal_errs.append((s["ad_group_name"], s["ad_id"], errs))
            continue
        refreshed_specs.append(r)
        print(f"  [{s['campaign']} / {s['ad_group_name']}] ad {s['ad_id']}")
        print(f"    final_url: {s['final_urls'][0] if s['final_urls'] else '(none)'}")
        for old, new in r["changed_h"]:
            print(f"    H  {old!r}")
            print(f"    →  {new!r} ({len(new)} chars)")
        for old, new in r["changed_d"]:
            print(f"    D  {old!r}")
            print(f"    →  {new!r} ({len(new)} chars)")
        print()

    if fatal_errs:
        print("\n✗ VALIDATION ERRORS — aborting before any API calls:\n")
        for ag, ad_id, errs in fatal_errs:
            print(f"  [{ag}] ad {ad_id}")
            for e in errs:
                print(f"    {e}")
        return 1

    if not apply:
        print(f"\n(dry-run; pass --apply to create {len(refreshed_specs)} new RSA(s) and pause {len(refreshed_specs)} stale one(s))")
        return 0

    print(f"\n→ Applying: creating {len(refreshed_specs)} new RSA(s), pausing {len(refreshed_specs)} stale one(s)...\n")
    created = []
    for r in refreshed_specs:
        try:
            new_res, old_res = create_refreshed_rsa_and_pause_old(r)
            created.append((r["ad_group_name"], r["ad_id"], new_res))
            print(f"  ✓ [{r['ad_group_name']}] old ad {r['ad_id']} → paused; new RSA created: {new_res.split('/')[-1]}")
        except GoogleAdsException as e:
            print(f"  ✗ [{r['ad_group_name']}] ad {r['ad_id']} FAILED:")
            for err in e.failure.errors:
                print(f"      {err.message}")

    print(f"\n{len(created)} RSA(s) refreshed. Re-run check_stale_stats.py to verify clean.")
    return 0


if __name__ == "__main__":
    sys.exit(main("--apply" in sys.argv))
