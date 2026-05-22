#!/usr/bin/env python3
"""Post-launch conversion + tracking status report.

Pulls live data from Google Ads to confirm:
  1. Which conversion actions are ENABLED + their primary/secondary status
  2. Each action's tag snippet (so we can match what the site fires)
  3. Last 7d conversion + click counts per action
"""
from pathlib import Path
from collections import defaultdict
from google.ads.googleads.client import GoogleAdsClient
import re

HERE = Path(__file__).parent
client = GoogleAdsClient.load_from_storage(str(HERE / "google-ads.yaml"), version="v24")
svc = client.get_service("GoogleAdsService")
CID = "5342635272"


def fmt(s, w):
    s = str(s)
    return s if len(s) <= w else s[: w - 1] + "…"


print("\n=== Conversion actions (ENABLED) ===")
q = """
SELECT conversion_action.id,
       conversion_action.name,
       conversion_action.status,
       conversion_action.type,
       conversion_action.primary_for_goal,
       conversion_action.value_settings.default_value,
       conversion_action.value_settings.default_currency_code,
       conversion_action.counting_type,
       conversion_action.tag_snippets
FROM conversion_action
WHERE conversion_action.status = 'ENABLED'
ORDER BY conversion_action.id
"""
print(f"  {'ID':>11}  {'NAME':35}  {'TYPE':25}  {'PRIM':5}  {'$':>7}  {'COUNT':14}  LABEL")
actions = {}
for row in svc.search(customer_id=CID, query=q):
    ca = row.conversion_action
    labels = set()
    for ts in ca.tag_snippets:
        for m in re.findall(r"AW-\d+/[A-Za-z0-9_-]+", (ts.event_snippet or "") + " " + (ts.global_site_tag or "")):
            labels.add(m)
    label = sorted(labels)[0] if labels else "(no tag)"
    val = ca.value_settings.default_value
    cur = ca.value_settings.default_currency_code or ""
    count = ca.counting_type.name
    print(f"  {ca.id:>11}  {fmt(ca.name, 35):35}  {fmt(ca.type_.name, 25):25}  {('YES' if ca.primary_for_goal else 'no'):5}  ${val:>5.0f}{cur and ' '+cur or ''}  {count:14}  {label}")
    actions[ca.id] = {"name": ca.name, "primary": ca.primary_for_goal, "label": label, "value": val}


print("\n=== Last 7 days: conversion counts + value per action ===")
# conversion_action.id is on the conversion action itself; aggregated via metrics.
q = """
SELECT segments.conversion_action,
       segments.conversion_action_name,
       metrics.all_conversions,
       metrics.all_conversions_value,
       metrics.conversions,
       metrics.conversions_value
FROM customer
WHERE segments.date DURING LAST_7_DAYS
"""
totals = []
for row in svc.search(customer_id=CID, query=q):
    totals.append({
        "name": row.segments.conversion_action_name,
        "all_conv": row.metrics.all_conversions,
        "all_val": row.metrics.all_conversions_value,
        "conv": row.metrics.conversions,
        "val": row.metrics.conversions_value,
    })
if not totals:
    print("  (no conversion rows in last 7 days)")
else:
    print(f"  {'NAME':35}  {'all_conv':>9}  {'all_val':>10}  {'conv (counted)':>16}  {'val':>10}")
    for t in sorted(totals, key=lambda x: -x["all_conv"]):
        print(f"  {fmt(t['name'], 35):35}  {t['all_conv']:>9.1f}  ${t['all_val']:>9.2f}  {t['conv']:>16.1f}  ${t['val']:>9.2f}")


print("\n=== Account-level last 7d ===")
q = """
SELECT metrics.clicks,
       metrics.impressions,
       metrics.cost_micros,
       metrics.conversions,
       metrics.all_conversions,
       metrics.conversions_value
FROM customer
WHERE segments.date DURING LAST_7_DAYS
"""
for row in svc.search(customer_id=CID, query=q):
    m = row.metrics
    cost = m.cost_micros / 1_000_000
    print(f"  clicks={m.clicks} | impressions={m.impressions} | cost=${cost:.2f}")
    print(f"  conversions (counted)={m.conversions:.2f} | all_conversions={m.all_conversions:.2f} | value=${m.conversions_value:.2f}")
