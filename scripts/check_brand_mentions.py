#!/usr/bin/env python3
"""Monitor RevFactor brand-mention URLs.

Reads scripts/brand_mentions.txt (date<TAB>type<TAB>url<TAB>notes), HEADs
each URL, prints a status row, and writes a JSON report to
scripts/brand_mentions_report.json.

Some platforms (Reddit, Facebook, Quora) block HEAD or return 403/429 for
unauthenticated bots. Treat those as ALIVE if a GET with a real-browser
User-Agent returns 2xx/3xx. Anything 4xx/5xx (other than 405/406 from
Reddit/Facebook anti-bot) is flagged as DOWN.

Usage:
    python3 scripts/check_brand_mentions.py
    python3 scripts/check_brand_mentions.py --json   # machine-readable
"""

from __future__ import annotations
import json
import sys
import time
from pathlib import Path
import urllib.request
import urllib.error
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
INPUT = ROOT / "scripts" / "brand_mentions.txt"
REPORT = ROOT / "scripts" / "brand_mentions_report.json"

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")

# Platforms that block HEAD or return non-2xx for legitimate reasons. Skip
# strict status checks; just confirm we can reach the host with a GET.
# (Medium 403s for non-browser UAs; Facebook /share/p/ needs JS to resolve.)
LENIENT = {"reddit", "quora", "facebook", "medium"}


def parse(line: str):
    line = line.strip()
    if not line or line.startswith("#"):
        return None
    parts = line.split("\t")
    if len(parts) < 3:
        return None
    return {
        "date_added": parts[0],
        "type": parts[1],
        "url": parts[2],
        "notes": parts[3] if len(parts) > 3 else "",
    }


def check(entry: dict) -> dict:
    url = entry["url"]
    typ = entry["type"]
    headers = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"}

    # Try HEAD first (fast, cheap)
    try:
        req = urllib.request.Request(url, headers=headers, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as r:
            entry["status"] = "alive"
            entry["http_code"] = r.status
            entry["method"] = "HEAD"
            return entry
    except urllib.error.HTTPError as e:
        # Some platforms reject HEAD — fall through to GET
        if e.code in (403, 405, 406, 429) and typ in LENIENT:
            pass
        elif typ in LENIENT:
            pass
        else:
            entry["status"] = "down"
            entry["http_code"] = e.code
            entry["method"] = "HEAD"
            entry["error"] = str(e)
            return entry
    except Exception as e:
        # Network glitch on HEAD → try GET
        pass

    # Fallback: GET with browser UA, just check we get a response
    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=20) as r:
            entry["status"] = "alive"
            entry["http_code"] = r.status
            entry["method"] = "GET"
            return entry
    except urllib.error.HTTPError as e:
        if typ in LENIENT and e.code in (400, 403, 429):
            entry["status"] = "alive (anti-bot)"
            entry["http_code"] = e.code
            entry["method"] = "GET"
            entry["note"] = "Platform anti-bot returned " + str(e.code) + "; URL likely live, manually verify"
            return entry
        entry["status"] = "down"
        entry["http_code"] = e.code
        entry["method"] = "GET"
        entry["error"] = str(e)
        return entry
    except Exception as e:
        entry["status"] = "error"
        entry["method"] = "GET"
        entry["error"] = str(e)
        return entry


def main():
    machine = "--json" in sys.argv
    if not INPUT.exists():
        print(f"missing: {INPUT}", file=sys.stderr)
        sys.exit(1)

    entries = [e for e in (parse(l) for l in INPUT.read_text().splitlines()) if e]
    if not entries:
        print("no entries to check", file=sys.stderr)
        sys.exit(1)

    if not machine:
        print(f"→ Checking {len(entries)} brand mentions...")
        print()

    results = []
    for e in entries:
        r = check(e)
        results.append(r)
        if not machine:
            status = r.get("status", "?")
            code = r.get("http_code", "—")
            sym = "✓" if "alive" in status else ("✗" if status == "down" else "!")
            print(f"  {sym} [{code:>3}] {r['type']:<13} {r['url'][:90]}")
        time.sleep(0.5)

    alive = sum(1 for r in results if "alive" in r.get("status", ""))
    down = sum(1 for r in results if r.get("status") == "down")
    err = sum(1 for r in results if r.get("status") == "error")

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {"total": len(results), "alive": alive, "down": down, "error": err},
        "entries": results,
    }
    REPORT.write_text(json.dumps(report, indent=2))

    if machine:
        print(json.dumps(report, indent=2))
    else:
        print()
        print(f"Summary: {alive} alive · {down} down · {err} error")
        print(f"Report:  {REPORT}")


if __name__ == "__main__":
    main()
