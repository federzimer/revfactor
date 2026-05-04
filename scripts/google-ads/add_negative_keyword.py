#!/usr/bin/env python3
"""Add a search term as a negative keyword to one of the 6 RevFactor shared
negative-keyword lists (account-level, applies to all 3 campaigns).

Used by daily_digest.py + can also be invoked manually:
    python3 add_negative_keyword.py "free str pricing" --list "Free / cheap / DIY seekers"
    python3 add_negative_keyword.py "yacht rental management" --list "Wrong industry"

Available lists:
    - Job / career seekers
    - Wrong industry
    - Geographic exclusions
    - Free / cheap / DIY seekers
    - Wrong audience (guests not hosts)
    - Tutorial / informational
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from google.ads.googleads.client import GoogleAdsClient

CID = "5342635272"


def get_shared_set(client, name):
    ga = client.get_service("GoogleAdsService")
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT shared_set.resource_name, shared_set.name, shared_set.type
            FROM shared_set
            WHERE shared_set.type = 'NEGATIVE_KEYWORDS'
              AND shared_set.name = '{name}'
        """,
    ):
        return r.shared_set.resource_name
    return None


def add_negative(client, list_name, keyword, match_type="PHRASE", dry_run=False):
    shared_set = get_shared_set(client, list_name)
    if not shared_set:
        raise SystemExit(f"List not found: {list_name!r}")

    op = client.get_type("SharedCriterionOperation")
    sc = op.create
    sc.shared_set = shared_set
    sc.keyword.text = keyword
    sc.keyword.match_type = client.enums.KeywordMatchTypeEnum[match_type]

    print(f"  + add {match_type} '{keyword}' to '{list_name}'")
    if dry_run:
        return None

    svc = client.get_service("SharedCriterionService")
    res = svc.mutate_shared_criteria(customer_id=CID, operations=[op])
    return res.results[0].resource_name


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("keyword", help="The search term to negate")
    p.add_argument("--list", required=True, help="Name of the shared list")
    p.add_argument("--match", default="PHRASE", choices=["EXACT", "PHRASE", "BROAD"])
    p.add_argument("--apply", action="store_true", help="Actually mutate (default: dry run)")
    args = p.parse_args()

    client = GoogleAdsClient.load_from_storage(str(Path(__file__).parent / "google-ads.yaml"))
    add_negative(client, args.list, args.keyword, args.match, dry_run=not args.apply)
    if not args.apply:
        print("(dry run; pass --apply)")
