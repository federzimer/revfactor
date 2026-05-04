"""Upsert URLs into the backlinks DB.

Three input modes:
  1. --file path/to/urls.txt   (one URL per line, or TSV: date<TAB>type<TAB>url<TAB>notes)
  2. --stdin                   (same line formats, piped in)
  3. --seed                    (seed from ../brand_mentions.txt)

Existing links are NOT overwritten — only `last_synced_at` ticks. Removed-from-sheet
URLs are NOT auto-archived (we want to keep monitoring even if Cito drops them
from the active list, since the value is whether the live link survives).
"""
from __future__ import annotations
import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

from db import connect, classify, domain_of, ROOT


def parse_line(line: str):
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    if "\t" in line:
        parts = line.split("\t")
        return {
            "date_added": parts[0] if len(parts) > 0 else "",
            "link_type": parts[1] if len(parts) > 1 else "",
            "url": parts[2] if len(parts) > 2 else "",
            "notes": parts[3] if len(parts) > 3 else "",
        }
    return {"date_added": "", "link_type": "", "url": line, "notes": ""}


def upsert(conn, entries, source: str, source_batch: str):
    now = datetime.now(timezone.utc).isoformat()
    inserted = 0
    updated = 0
    for e in entries:
        url = e["url"].strip()
        if not url or not url.startswith(("http://", "https://")):
            continue
        link_type = e.get("link_type") or classify(url)
        domain = domain_of(url)
        cur = conn.execute("SELECT id FROM links WHERE url = ?", (url,))
        row = cur.fetchone()
        if row:
            conn.execute(
                "UPDATE links SET last_synced_at = ?, link_type = COALESCE(NULLIF(link_type,''), ?), notes = COALESCE(NULLIF(?, ''), notes) WHERE id = ?",
                (now, link_type, e.get("notes", ""), row["id"]),
            )
            updated += 1
        else:
            conn.execute(
                """INSERT INTO links
                   (url, domain, link_type, source, source_batch, date_added, notes, first_seen_at, last_synced_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    url,
                    domain,
                    link_type,
                    source,
                    source_batch,
                    e.get("date_added") or "",
                    e.get("notes") or "",
                    now,
                    now,
                ),
            )
            inserted += 1
    conn.commit()
    return inserted, updated


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--file", type=Path, help="Path to TSV/URL-list file")
    g.add_argument("--stdin", action="store_true", help="Read lines from stdin")
    g.add_argument("--seed", action="store_true", help="Seed from scripts/brand_mentions.txt")
    ap.add_argument("--source", default="cito-sheet", help="Origin label (e.g., cito-sheet, manual)")
    ap.add_argument("--batch", default="", help="Source batch label (e.g., 'Week of 2026-04-27')")
    args = ap.parse_args()

    if args.seed:
        path = ROOT / "scripts" / "brand_mentions.txt"
        lines = path.read_text().splitlines()
        source, batch = "seed:brand_mentions.txt", args.batch or "initial-seed"
    elif args.file:
        lines = args.file.read_text().splitlines()
        source, batch = args.source, args.batch
    else:
        lines = sys.stdin.read().splitlines()
        source, batch = args.source, args.batch

    entries = [e for e in (parse_line(l) for l in lines) if e]
    if not entries:
        print("no entries to sync", file=sys.stderr)
        sys.exit(1)

    conn = connect()
    try:
        ins, upd = upsert(conn, entries, source=source, source_batch=batch)
    finally:
        conn.close()

    print(f"synced {len(entries)} entries: +{ins} new, {upd} updated")


if __name__ == "__main__":
    main()
