#!/usr/bin/env python3
"""Daily RevFactor PPC digest.

Pulls last-24h Google Ads + GA4 metrics, compares to 7d baseline, flags
anomalies, and posts a summary to Slack with 1-3 specific recommendations.

Designed to run as a Render cron at 9am Chicago daily. Reads creds from env:
- GOOGLE_ADS_YAML_PATH (default: ./google-ads.yaml)
- SLACK_WEBHOOK_URL  (Aaron's #revfactor channel)
- FRAUDBLOCKER_API_KEY (optional, for fraud-blocked-clicks count)
- GA4_PROPERTY_ID    (optional)
- GA4_SERVICE_ACCOUNT_JSON (optional, base64-encoded)

Run locally:
    python3 daily_digest.py            # dry-run, prints to stdout
    python3 daily_digest.py --post     # posts to Slack
"""

import json
import os
import sys
import urllib.request
import urllib.parse
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))

from google.ads.googleads.client import GoogleAdsClient

CID = "5342635272"
SLACK = os.environ.get("SLACK_WEBHOOK_URL", "")
FRAUDBLOCKER_KEY = os.environ.get("FRAUDBLOCKER_API_KEY", "")


def ads_client():
    yaml_path = os.environ.get("GOOGLE_ADS_YAML_PATH", str(HERE / "google-ads.yaml"))
    return GoogleAdsClient.load_from_storage(yaml_path)


def fetch_window_metrics(client, start, end):
    """Aggregate spend/clicks/conversions over a date window per campaign."""
    ga = client.get_service("GoogleAdsService")
    out = {}
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT campaign.name, campaign.status,
                   metrics.cost_micros, metrics.clicks, metrics.impressions,
                   metrics.all_conversions, metrics.all_conversions_value,
                   metrics.ctr, metrics.average_cpc
            FROM campaign
            WHERE segments.date BETWEEN '{start}' AND '{end}'
              AND campaign.name LIKE 'RF%'
        """,
    ):
        if r.campaign.status.name == "REMOVED":
            continue
        name = r.campaign.name
        agg = out.setdefault(name, {
            "spend": 0.0, "clicks": 0, "impressions": 0,
            "conversions": 0.0, "conv_value": 0.0,
        })
        agg["spend"] += r.metrics.cost_micros / 1_000_000
        agg["clicks"] += r.metrics.clicks
        agg["impressions"] += r.metrics.impressions
        agg["conversions"] += r.metrics.all_conversions
        agg["conv_value"] += r.metrics.all_conversions_value
    return out


def search_term_anomalies(client, start, end, min_cost=5.0):
    """Search terms that drove >$5 cost with 0 conversions in the last day."""
    ga = client.get_service("GoogleAdsService")
    flagged = []
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT search_term_view.search_term, campaign.name, ad_group.name,
                   metrics.cost_micros, metrics.clicks, metrics.all_conversions, metrics.ctr
            FROM search_term_view
            WHERE segments.date BETWEEN '{start}' AND '{end}'
              AND campaign.name LIKE 'RF%'
        """,
    ):
        cost = r.metrics.cost_micros / 1_000_000
        conv = r.metrics.all_conversions
        if cost >= min_cost and conv == 0:
            flagged.append({
                "term": r.search_term_view.search_term,
                "campaign": r.campaign.name,
                "ad_group": r.ad_group.name,
                "cost": round(cost, 2),
                "clicks": r.metrics.clicks,
                "ctr": round(r.metrics.ctr * 100, 2),
            })
    return sorted(flagged, key=lambda x: -x["cost"])


def low_qs_keywords(client, threshold=4):
    """Keywords with quality score below threshold (live data, not date-windowed)."""
    ga = client.get_service("GoogleAdsService")
    flagged = []
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT campaign.name, ad_group.name,
                   ad_group_criterion.keyword.text,
                   ad_group_criterion.quality_info.quality_score
            FROM keyword_view
            WHERE ad_group_criterion.status = 'ENABLED'
              AND campaign.status != 'REMOVED'
              AND campaign.name LIKE 'RF%'
              AND ad_group_criterion.quality_info.quality_score < {threshold}
        """,
    ):
        flagged.append({
            "term": r.ad_group_criterion.keyword.text,
            "qs": r.ad_group_criterion.quality_info.quality_score,
            "campaign": r.campaign.name,
        })
    return flagged


def impression_share(client, start, end):
    """Per-campaign impression share + lost-to-budget / lost-to-rank.

    These are the right metrics to watch instead of "average position" (which
    Google retired in 2019). Lost-to-budget > 30% means raise the budget;
    lost-to-rank > 50% means fix Quality Score (ad copy / landing page),
    NOT raise the bid.
    """
    ga = client.get_service("GoogleAdsService")
    rows = []
    for r in ga.search(
        customer_id=CID,
        query=f"""
            SELECT campaign.name, campaign.status,
                   metrics.search_impression_share,
                   metrics.search_budget_lost_impression_share,
                   metrics.search_rank_lost_impression_share,
                   metrics.search_top_impression_share
            FROM campaign
            WHERE segments.date BETWEEN '{start}' AND '{end}'
              AND campaign.name LIKE 'RF%'
        """,
    ):
        if r.campaign.status.name == "REMOVED":
            continue
        rows.append({
            "campaign": r.campaign.name,
            "is": round(r.metrics.search_impression_share * 100, 1),
            "lost_budget": round(r.metrics.search_budget_lost_impression_share * 100, 1),
            "lost_rank": round(r.metrics.search_rank_lost_impression_share * 100, 1),
            "top_is": round(r.metrics.search_top_impression_share * 100, 1),
        })
    return rows


def fraudblocker_blocked_count(domain="revfactor.io", range_="1d"):
    """Pull yesterday's fraud-detection summary from Fraud Blocker.

    Endpoint: GET /api/bigquery/click-report
    Required params: range (1d|7d|30d), and one of {domain=..., all=true}
    Auth: api_key header
    Returns: count of clicks marked as fraud / invalid, None if no key,
             or a short error string for digest visibility.
    """
    if not FRAUDBLOCKER_KEY:
        return None
    try:
        url = (
            "https://backend.fraudblocker.com/api/bigquery/click-report"
            f"?range={range_}&domain={urllib.parse.quote(domain)}"
        )
        req = urllib.request.Request(
            url,
            headers={
                "api_key": FRAUDBLOCKER_KEY,
                "User-Agent": "RevFactor-DailyDigest/1.0 (+ops@revfactor.io)",
                "Accept": "application/json",
            },
            method="GET",
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            # Response shape varies; try common keys for invalid-click totals.
            if isinstance(data, dict):
                if data.get("error"):
                    return None  # No data yet (paused campaigns / new account)
                for k in ("fraud_clicks", "invalid_clicks", "fraudCount"):
                    if k in data:
                        return data[k]
                rows = data.get("rows")
                if isinstance(rows, list):
                    return sum(int(r.get("fraud_count", 0)) for r in rows)
            return data
    except Exception as e:
        return f"err: {str(e)[:80]}"


def fmt_metric(today, base_avg):
    if base_avg == 0:
        return f"{today:.2f}"
    delta = (today - base_avg) / base_avg * 100
    arrow = "↑" if delta > 0 else "↓"
    return f"{today:.2f} ({arrow}{abs(delta):.0f}% vs 7d avg {base_avg:.2f})"


def build_digest():
    client = ads_client()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    week_start = (date.today() - timedelta(days=8)).isoformat()
    week_end = (date.today() - timedelta(days=2)).isoformat()

    today = fetch_window_metrics(client, yesterday, yesterday)
    baseline = fetch_window_metrics(client, week_start, week_end)

    # Aggregate totals
    total_spend = sum(c["spend"] for c in today.values())
    total_clicks = sum(c["clicks"] for c in today.values())
    total_conv = sum(c["conversions"] for c in today.values())
    total_conv_value = sum(c["conv_value"] for c in today.values())

    base_total_spend = sum(c["spend"] for c in baseline.values()) / 7 if baseline else 0
    base_total_clicks = sum(c["clicks"] for c in baseline.values()) / 7 if baseline else 0
    base_total_conv = sum(c["conversions"] for c in baseline.values()) / 7 if baseline else 0

    cpa = total_spend / total_conv if total_conv > 0 else None
    roas = total_conv_value / total_spend if total_spend > 0 else None

    anomalies = search_term_anomalies(client, yesterday, yesterday)
    low_qs = low_qs_keywords(client)
    blocked = fraudblocker_blocked_count()
    is_rows = impression_share(client, yesterday, yesterday)

    # Build recommendations
    recs = []
    if anomalies:
        top = anomalies[:3]
        terms = ", ".join(f'"{a["term"]}" (${a["cost"]})' for a in top)
        recs.append(f"🚨 Add as negatives: {terms} — wasted ${sum(a['cost'] for a in top):.2f} with 0 conv yesterday.")
    if low_qs:
        recs.append(f"⚠️ {len(low_qs)} keyword(s) at QS < 4. Review ad-group relevance or pause: {', '.join(k['term'] for k in low_qs[:5])}")
    if cpa is not None and cpa > 200:
        recs.append(f"📈 Yesterday CPA ${cpa:.0f} is above $200 target. Don't change bids yet (need ≥30 conv to learn) but flag for review at week 1.")
    if total_spend < base_total_spend * 0.5 and base_total_spend > 0:
        recs.append(f"⚠️ Spend yesterday (${total_spend:.0f}) is <50% of baseline (${base_total_spend:.0f}). Possible delivery issue: check disapprovals or budget caps.")
    for row in is_rows:
        if row["lost_budget"] > 30:
            recs.append(f"💰 {row['campaign'][-22:]} lost {row['lost_budget']}% of impressions to budget. Raise daily cap, don't raise CPC.")
        if row["lost_rank"] > 50:
            recs.append(f"📉 {row['campaign'][-22:]} lost {row['lost_rank']}% of impressions to rank. Quality Score / landing-page issue — investigate, don't raise CPC.")
    if not recs:
        recs.append("✅ No anomalies. Let it cook. (Smart Bidding needs 30+ conversions before tuning.)")

    # Format the message
    lines = [
        f"*RevFactor PPC daily digest — {yesterday}*",
        "",
        "*Yesterday vs 7-day avg*",
        f"• Spend: ${fmt_metric(total_spend, base_total_spend)}",
        f"• Clicks: {fmt_metric(total_clicks, base_total_clicks)}",
        f"• Conversions: {fmt_metric(total_conv, base_total_conv)}",
        f"• CPA: ${cpa:.0f}" if cpa is not None else "• CPA: — (no conversions yet)",
        f"• ROAS: {roas:.2f}x" if roas is not None else "• ROAS: — (no conversion value)",
    ]
    if blocked is not None:
        lines.append(f"• Fraud Blocker invalid clicks (yesterday): {blocked}")
    lines.append("")
    lines.append("*Per campaign (yesterday)*")
    for name in sorted(today):
        m = today[name]
        cpa_c = m["spend"] / m["conversions"] if m["conversions"] > 0 else None
        cpa_str = f"${cpa_c:.0f}" if cpa_c else "—"
        lines.append(f"• {name[-22:]}: ${m['spend']:.0f} / {m['clicks']}c / {m['conversions']:.1f}conv (CPA {cpa_str})")
    if is_rows:
        lines.append("")
        lines.append("*Impression share*")
        for row in is_rows:
            lines.append(
                f"• {row['campaign'][-22:]}: {row['is']}% IS | "
                f"{row['top_is']}% top | "
                f"lost-budget {row['lost_budget']}% | lost-rank {row['lost_rank']}%"
            )
    lines.append("")
    lines.append("*Recommendations*")
    for r in recs:
        lines.append(r)

    return "\n".join(lines)


def post_to_slack(text):
    if not SLACK:
        print("(SLACK_WEBHOOK_URL not set; printing to stdout)")
        print(text)
        return
    req = urllib.request.Request(
        SLACK,
        data=json.dumps({"text": text}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req, timeout=10).read()


if __name__ == "__main__":
    digest = build_digest()
    if "--post" in sys.argv:
        post_to_slack(digest)
        print("Posted.")
    else:
        print(digest)
