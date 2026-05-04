"""Export the latest state of every tracked backlink to CSV (opens in Numbers).

Writes report.csv. Run with --open to launch in Numbers.
"""
from __future__ import annotations
import argparse
import csv
import subprocess
from pathlib import Path

from db import connect

OUT = Path(__file__).parent / "report.csv"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--open", action="store_true")
    args = ap.parse_args()

    conn = connect()
    rows = conn.execute(
        """SELECT l.url, l.domain, l.link_type, l.date_added, l.notes,
                  c.checked_at, c.http_status, c.is_alive,
                  c.brand_mention_present, c.outbound_link_present,
                  c.rel_attr, c.is_dofollow, c.anchor_text,
                  c.quality_score, c.quality_grade, c.error
           FROM links l
           LEFT JOIN checks c ON c.id = (
             SELECT id FROM checks WHERE link_id = l.id ORDER BY checked_at DESC LIMIT 1
           )
           WHERE l.archived_at IS NULL
           ORDER BY (c.quality_score IS NULL), c.quality_score DESC, l.id"""
    ).fetchall()
    conn.close()

    headers = [
        "Grade", "Score", "HTTP", "Alive", "Brand Mention", "Outbound Link",
        "DoFollow", "Type", "Domain", "URL", "Anchor Text", "rel",
        "Date Added", "Last Checked", "Notes", "Error",
    ]
    with OUT.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(headers)
        for r in rows:
            w.writerow([
                r["quality_grade"] or "",
                r["quality_score"] if r["quality_score"] is not None else "",
                r["http_status"] if r["http_status"] is not None else "",
                "Yes" if r["is_alive"] else "No",
                "Yes" if r["brand_mention_present"] else "No",
                "Yes" if r["outbound_link_present"] else "No",
                "Yes" if r["is_dofollow"] else "No",
                r["link_type"] or "",
                r["domain"] or "",
                r["url"],
                r["anchor_text"] or "",
                r["rel_attr"] or "",
                r["date_added"] or "",
                (r["checked_at"] or "")[:19].replace("T", " "),
                r["notes"] or "",
                r["error"] or "",
            ])

    print(f"wrote {OUT} ({len(rows)} rows)")
    if args.open:
        subprocess.run(["open", "-a", "Numbers", str(OUT)])


if __name__ == "__main__":
    main()
