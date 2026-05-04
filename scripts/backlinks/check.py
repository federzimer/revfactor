"""Monthly check: for every link in the DB, record uptime + brand mention +
outbound link to revfactor.io + dofollow status, then score quality.

Quality score (0-100):
  +30  alive (HTTP 2xx/3xx, or anti-bot 4xx on known-lenient platforms)
  +25  brand mention "RevFactor" present in HTML
  +25  outbound link to revfactor.io present
  +20  that outbound link is dofollow (no rel=nofollow|sponsored|ugc)

Grade: A 80+, B 60-79, C 40-59, D 1-39, F 0.

Usage:
    python3 check.py            # check all links, write to DB
    python3 check.py --url URL  # check one URL (debug, no DB write)
    python3 check.py --json     # also dump latest report to stdout
"""
from __future__ import annotations
import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import urllib.error
import urllib.request

from db import connect

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
BRAND_PATTERN = re.compile(r"revfactor", re.IGNORECASE)
TARGET_HOSTS = ("revfactor.io", "www.revfactor.io")
LENIENT_HOSTS = ("reddit.com", "quora.com", "facebook.com", "medium.com", "instagram.com")
LENIENT_CODES = {403, 405, 406, 429}

ANCHOR_RE = re.compile(
    r'<a\b([^>]*?)href=["\'](?P<href>[^"\']+)["\']([^>]*?)>(?P<text>.*?)</a>',
    re.IGNORECASE | re.DOTALL,
)
REL_RE = re.compile(r'\brel=["\']([^"\']+)["\']', re.IGNORECASE)


def is_lenient(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return any(h in host for h in LENIENT_HOSTS)


def fetch(url: str) -> tuple[int | None, str | None, str, str | None]:
    """Returns (http_status, body, method, error_message)."""
    headers = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml"}

    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=25) as r:
            raw = r.read(2_000_000)  # cap at 2MB to keep fast
            body = raw.decode(r.headers.get_content_charset() or "utf-8", errors="replace")
            return r.status, body, "GET", None
    except urllib.error.HTTPError as e:
        if is_lenient(url) and e.code in LENIENT_CODES:
            return e.code, None, "GET", f"lenient-block:{e.code}"
        return e.code, None, "GET", str(e)
    except Exception as e:
        return None, None, "GET", str(e)


def find_revfactor_link(html: str):
    """Return (rel_attr, anchor_text, excerpt) for the first <a> pointing at
    revfactor.io, else (None, None, None)."""
    for m in ANCHOR_RE.finditer(html):
        href = m.group("href")
        host = urlparse(href).netloc.lower()
        if any(host == h or host.endswith("." + h) for h in TARGET_HOSTS):
            attrs = (m.group(1) or "") + " " + (m.group(3) or "")
            rel_match = REL_RE.search(attrs)
            rel = rel_match.group(1).strip().lower() if rel_match else ""
            text = re.sub(r"<[^>]+>", "", m.group("text")).strip()[:200]
            start = max(0, m.start() - 80)
            end = min(len(html), m.end() + 80)
            excerpt = re.sub(r"\s+", " ", html[start:end]).strip()[:400]
            return rel, text, excerpt
    return None, None, None


def score(alive: bool, brand: bool, link: bool, dofollow: bool) -> tuple[int, str]:
    s = 0
    if alive:
        s += 30
    if brand:
        s += 25
    if link:
        s += 25
    if dofollow:
        s += 20
    if s >= 80:
        g = "A"
    elif s >= 60:
        g = "B"
    elif s >= 40:
        g = "C"
    elif s > 0:
        g = "D"
    else:
        g = "F"
    return s, g


def assess(url: str) -> dict:
    status, body, method, err = fetch(url)
    alive = bool(status and 200 <= status < 400) or (err and err.startswith("lenient-block"))
    rel, anchor, excerpt = (None, None, None)
    brand = False
    has_link = False
    is_dofollow = False

    if body:
        brand = bool(BRAND_PATTERN.search(body))
        rel, anchor, excerpt = find_revfactor_link(body)
        has_link = rel is not None
        if has_link:
            blockers = ("nofollow", "sponsored", "ugc")
            is_dofollow = not any(b in (rel or "") for b in blockers)

    qscore, grade = score(bool(alive), brand, has_link, is_dofollow)

    return {
        "url": url,
        "http_status": status,
        "is_alive": 1 if alive else 0,
        "fetch_method": method,
        "brand_mention_present": 1 if brand else 0,
        "outbound_link_present": 1 if has_link else 0,
        "rel_attr": rel,
        "is_dofollow": 1 if is_dofollow else 0,
        "anchor_text": anchor,
        "excerpt": excerpt,
        "quality_score": qscore,
        "quality_grade": grade,
        "error": err,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", help="Check single URL (no DB write)")
    ap.add_argument("--json", action="store_true", help="Print JSON report after run")
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if args.url:
        result = assess(args.url)
        print(json.dumps(result, indent=2))
        return

    conn = connect()
    try:
        rows = conn.execute(
            "SELECT id, url, link_type FROM links WHERE archived_at IS NULL ORDER BY id"
        ).fetchall()
        if not args.quiet:
            print(f"Checking {len(rows)} links...\n")
        now = datetime.now(timezone.utc).isoformat()
        results = []
        for row in rows:
            r = assess(row["url"])
            r["link_id"] = row["id"]
            r["link_type"] = row["link_type"]
            r["checked_at"] = now
            conn.execute(
                """INSERT INTO checks
                   (link_id, checked_at, http_status, is_alive, fetch_method,
                    brand_mention_present, outbound_link_present, rel_attr,
                    is_dofollow, anchor_text, excerpt, quality_score,
                    quality_grade, error)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    row["id"], now, r["http_status"], r["is_alive"], r["fetch_method"],
                    r["brand_mention_present"], r["outbound_link_present"], r["rel_attr"],
                    r["is_dofollow"], r["anchor_text"], r["excerpt"],
                    r["quality_score"], r["quality_grade"], r["error"],
                ),
            )
            results.append(r)
            if not args.quiet:
                sym = {"A": "★", "B": "✓", "C": "~", "D": "·", "F": "✗"}[r["quality_grade"]]
                code = r["http_status"] or "—"
                print(f"  {sym} [{r['quality_grade']}] [{code:>3}] q={r['quality_score']:>3}  "
                      f"brand={r['brand_mention_present']} link={r['outbound_link_present']} "
                      f"dofollow={r['is_dofollow']}  {row['url'][:80]}")
            time.sleep(0.5)
        conn.commit()
    finally:
        conn.close()

    if not args.quiet:
        grades = {g: sum(1 for r in results if r["quality_grade"] == g) for g in "ABCDF"}
        print(f"\nGrades: A={grades['A']} B={grades['B']} C={grades['C']} D={grades['D']} F={grades['F']}")

    if args.json:
        print(json.dumps({"checked_at": now, "results": results}, indent=2))


if __name__ == "__main__":
    main()
