"""Show current state of every tracked backlink: latest check + month-over-month
delta. Defaults to a human table; --json for machine output.
"""
from __future__ import annotations
import argparse
import json
from datetime import datetime, timedelta, timezone

from db import connect


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--lost-only", action="store_true", help="Only show links that are dead or lost the brand mention")
    args = ap.parse_args()

    conn = connect()
    try:
        rows = conn.execute(
            """
            SELECT l.id, l.url, l.link_type, l.date_added, l.first_seen_at,
                   c.checked_at, c.http_status, c.is_alive,
                   c.brand_mention_present, c.outbound_link_present,
                   c.rel_attr, c.is_dofollow, c.anchor_text,
                   c.quality_score, c.quality_grade, c.error
            FROM links l
            LEFT JOIN checks c ON c.id = (
              SELECT id FROM checks WHERE link_id = l.id ORDER BY checked_at DESC LIMIT 1
            )
            WHERE l.archived_at IS NULL
            ORDER BY c.quality_score IS NULL, c.quality_score ASC, l.id
            """
        ).fetchall()
    finally:
        pass

    items = []
    for r in rows:
        prev = conn.execute(
            """SELECT quality_score, quality_grade FROM checks
               WHERE link_id = ? AND checked_at < ?
               ORDER BY checked_at DESC LIMIT 1""",
            (r["id"], r["checked_at"] or "9999"),
        ).fetchone() if r["checked_at"] else None
        delta = (r["quality_score"] - prev["quality_score"]) if prev and r["quality_score"] is not None else None
        items.append({**dict(r), "prev_score": prev["quality_score"] if prev else None, "delta": delta})
    conn.close()

    if args.lost_only:
        items = [i for i in items if not i["is_alive"] or not i["brand_mention_present"]]

    if args.json:
        print(json.dumps(items, indent=2, default=str))
        return

    print(f"\n{'GRD':<4}{'SCORE':<7}{'Δ':<6}{'STATUS':<7}{'TYPE':<14}URL")
    print("-" * 110)
    for i in items:
        grade = i["quality_grade"] or "?"
        score = i["quality_score"] if i["quality_score"] is not None else "—"
        delta = f"{i['delta']:+d}" if i["delta"] is not None else ""
        status = i["http_status"] or "—"
        typ = (i["link_type"] or "")[:12]
        print(f"{grade:<4}{str(score):<7}{delta:<6}{str(status):<7}{typ:<14}{i['url'][:70]}")
    print()
    grades = {g: sum(1 for i in items if i["quality_grade"] == g) for g in "ABCDF"}
    print(f"Total tracked: {len(items)}  ·  A={grades['A']} B={grades['B']} C={grades['C']} D={grades['D']} F={grades['F']}")


if __name__ == "__main__":
    main()
