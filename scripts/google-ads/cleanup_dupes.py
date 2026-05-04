"""Cleanup duplicate ad groups and duplicate negative-list attachments.

Strategy: keep the OLDEST (lowest id) ad group per (campaign, name); pause the
rest. PAUSE is reversible — Aaron can flip them back ENABLED any time.

Same for campaign_shared_set: keep one attachment per (campaign, list), remove
the dupes. Removal here is permanent for the link record but the shared set
itself is untouched, so it's safe to re-attach later.
"""

import sys
from collections import defaultdict
from google.ads.googleads.client import GoogleAdsClient

client = GoogleAdsClient.load_from_storage("google-ads.yaml")
ga = client.get_service("GoogleAdsService")
CID = "5342635272"


def pause_duplicate_ad_groups(dry_run):
    print(f"\n=== AD GROUPS (dry_run={dry_run}) ===")
    by_key = defaultdict(list)
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT campaign.name, ad_group.name, ad_group.id, ad_group.status, ad_group.resource_name
            FROM ad_group
            WHERE ad_group.status = 'ENABLED'
              AND campaign.status != 'REMOVED'
              AND campaign.name LIKE 'RF%'
        """,
    ):
        by_key[(r.campaign.name, r.ad_group.name)].append(
            (int(r.ad_group.id), r.ad_group.resource_name)
        )

    ag_svc = client.get_service("AdGroupService")
    ops = []
    for (camp, name), groups in sorted(by_key.items()):
        groups.sort(key=lambda x: x[0])  # lowest id first = original
        keep = groups[0]
        pause = groups[1:]
        print(f"  {camp} | {name}: keep id={keep[0]}, pause {len(pause)} dupe(s) → {[p[0] for p in pause]}")
        for _id, resource_name in pause:
            op = client.get_type("AdGroupOperation")
            op.update.resource_name = resource_name
            op.update.status = client.enums.AdGroupStatusEnum.PAUSED
            op.update_mask.paths.append("status")
            ops.append(op)

    if not ops:
        print("  No duplicates found, nothing to pause.")
        return
    if dry_run:
        print(f"  [DRY RUN] Would pause {len(ops)} ad groups.")
        return
    response = ag_svc.mutate_ad_groups(customer_id=CID, operations=ops)
    print(f"  Paused {len(response.results)} duplicate ad groups.")


def remove_duplicate_neg_attachments(dry_run):
    print(f"\n=== NEGATIVE LIST ATTACHMENTS (dry_run={dry_run}) ===")
    by_key = defaultdict(list)
    for r in ga.search(
        customer_id=CID,
        query="""
            SELECT campaign.name, shared_set.name, campaign_shared_set.resource_name
            FROM campaign_shared_set
            WHERE campaign.name LIKE 'RF%' AND shared_set.type = 'NEGATIVE_KEYWORDS'
        """,
    ):
        by_key[(r.campaign.name, r.shared_set.name)].append(
            r.campaign_shared_set.resource_name
        )

    css_svc = client.get_service("CampaignSharedSetService")
    ops = []
    total_dupes = 0
    for (camp, name), attachments in sorted(by_key.items()):
        if len(attachments) <= 1:
            continue
        keep = attachments[0]
        remove = attachments[1:]
        total_dupes += len(remove)
        for r in remove:
            op = client.get_type("CampaignSharedSetOperation")
            op.remove = r
            ops.append(op)
    print(f"  Total dupe attachments to remove: {total_dupes}")

    if not ops:
        return
    if dry_run:
        print(f"  [DRY RUN] Would remove {len(ops)} dupe attachments.")
        return
    response = css_svc.mutate_campaign_shared_sets(
        customer_id=CID, operations=ops
    )
    print(f"  Removed {len(response.results)} dupe attachments.")


if __name__ == "__main__":
    dry_run = "--apply" not in sys.argv
    pause_duplicate_ad_groups(dry_run)
    remove_duplicate_neg_attachments(dry_run)
    if dry_run:
        print("\n(Run with --apply to execute.)")
