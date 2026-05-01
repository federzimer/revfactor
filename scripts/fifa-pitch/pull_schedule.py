#!/usr/bin/env python3
"""Scrape per-venue Wikipedia pages for 2026 FIFA World Cup match dates."""
import json
import os
import re
import urllib.request
from datetime import date

OUT = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(OUT, exist_ok=True)

VENUES = {
    "atlanta":       "https://en.wikipedia.org/wiki/Mercedes-Benz_Stadium",
    "boston":        "https://en.wikipedia.org/wiki/Gillette_Stadium",
    "dallas":        "https://en.wikipedia.org/wiki/AT%26T_Stadium",
    "houston":       "https://en.wikipedia.org/wiki/NRG_Stadium",
    "kansas_city":   "https://en.wikipedia.org/wiki/Arrowhead_Stadium",
    "los_angeles":   "https://en.wikipedia.org/wiki/SoFi_Stadium",
    "miami":         "https://en.wikipedia.org/wiki/Hard_Rock_Stadium",
    "new_york":      "https://en.wikipedia.org/wiki/MetLife_Stadium",
    "philadelphia":  "https://en.wikipedia.org/wiki/Lincoln_Financial_Field",
    "san_francisco": "https://en.wikipedia.org/wiki/Levi%27s_Stadium",
    "seattle":       "https://en.wikipedia.org/wiki/Lumen_Field",
}

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="ignore")

def extract_2026_dates(html):
    txt = re.sub(r"<[^>]+>", " ", html)
    txt = re.sub(r"&[a-z#0-9]+;", " ", txt)
    txt = re.sub(r"\s+", " ", txt)
    # Find a "2026 FIFA World Cup" section
    idx = txt.find("2026 FIFA World Cup")
    if idx < 0:
        idx = txt.find("2026 World Cup")
    if idx < 0:
        return []
    # Take a big chunk after that header
    blob = txt[idx:idx+8000]
    # Stop at "Concerts" or next major heading
    for stop in ["Concerts", "Non-FIFA", "Regular season", "Other events", "Notable events"]:
        si = blob.find(stop)
        if 100 < si < len(blob):
            blob = blob[:si]
            break
    # Find dates in June or July 2026 — pattern: 'June 11, 2026' or '11 June 2026'
    matches = []
    for m in re.finditer(r"(June|July)\s+(\d{1,2}),?\s*2026", blob):
        matches.append(f"2026-{m.group(1)[:3]}-{int(m.group(2)):02d}")
    # Also catch: "11 June 2026" format
    for m in re.finditer(r"(\d{1,2})\s+(June|July)\s+2026", blob):
        matches.append(f"2026-{m.group(2)[:3]}-{int(m.group(1)):02d}")
    # Also catch bare: "June 11" in the 2026 section (without year repeated)
    # Only if surrounded by World Cup context
    for m in re.finditer(r"(June|July)\s+(\d{1,2})(?!,?\s*20\d{2})", blob):
        matches.append(f"2026-{m.group(1)[:3]}-{int(m.group(2)):02d}")
    # Dedupe, keep only valid World Cup window dates
    uniq = sorted(set(matches))
    valid = []
    for d in uniq:
        mon = d[5:8]; day = int(d[9:11])
        iso = f"2026-{'06' if mon=='Jun' else '07'}-{day:02d}"
        dd = date(2026, 6 if mon=='Jun' else 7, day)
        if date(2026,6,11) <= dd <= date(2026,7,19):
            valid.append(iso)
    return sorted(set(valid))

def main():
    schedule = {}
    for key, url in VENUES.items():
        try:
            html = fetch(url)
            dates = extract_2026_dates(html)
            schedule[key] = dates
            print(f"[{key}] {len(dates)} match dates: {', '.join(dates)}")
        except Exception as e:
            print(f"[{key}] ERROR: {e}")
            schedule[key] = []
    with open(f"{OUT}/fifa_schedule.json", "w") as f:
        json.dump(schedule, f, indent=2)
    print(f"\nSaved to {OUT}/fifa_schedule.json")

if __name__ == "__main__":
    main()
