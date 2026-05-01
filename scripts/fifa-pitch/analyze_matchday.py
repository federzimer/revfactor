#!/usr/bin/env python3
"""
Match-day-precision analysis.

For each host city:
  - Define match-day window per match = match-day + match-day-minus-1 (pre-match night)
  - Compute booked_rate_avg, available_rate_avg, fill_rate on THOSE nights only
  - Compare to 3-yr Jun/Jul baseline
  - Compare to non-match nights inside the same tournament window (intra-tournament control)

Output:
  fifa_matchday.csv
  fifa_matchday_summary.md
"""
import csv
import json
import os
import statistics
from datetime import date, datetime, timedelta

BASE = os.path.dirname(__file__)
RAW = os.path.join(BASE, "raw")
FIFA_START = date(2026, 6, 11)
FIFA_END = date(2026, 7, 19)

def parse_d(s): return datetime.strptime(s, "%Y-%m-%d").date()

def matchday_nights(match_dates):
    """For each match date, include match night + the night before. Return set of date objects."""
    nights = set()
    for ds in match_dates:
        d = parse_d(ds)
        nights.add(d)
        nights.add(d - timedelta(days=1))
    return nights

def avg_for_dates(pacing, date_set, field):
    vals = []
    for r in pacing.get("results", []):
        d = parse_d(r["date"])
        if d in date_set and r.get(field) is not None:
            vals.append(r[field])
    return round(statistics.mean(vals), 2) if vals else None, len(vals)

def historical_month_avg(series, months, years, field="avg"):
    vals = []
    for r in (series or {}).get("results", []):
        d = parse_d(r["date"])
        if d.month in months and d.year in years and r.get(field) is not None:
            vals.append(r[field])
    return round(statistics.mean(vals), 2) if vals else None

def main():
    with open(f"{RAW}/all_cities.json") as f:
        cities = json.load(f)
    with open(f"{RAW}/fifa_schedule.json") as f:
        sched = json.load(f)

    tournament_nights = set()
    d = FIFA_START
    while d <= FIFA_END:
        tournament_nights.add(d)
        d += timedelta(days=1)

    rows = []
    for c in cities:
        key = c["city"]["key"]
        locality = c["city"]["locality"]
        match_dates = sched.get(key, [])
        if key.startswith("_"): continue
        mdn = matchday_nights(match_dates)
        non_match_nights = tournament_nights - mdn
        pacing = c.get("future_pacing") or {}
        adr_ts = c.get("adr_timeseries")
        occ_ts = c.get("occupancy_timeseries")
        summary = c.get("summary") or {}

        baseline_adr = historical_month_avg(adr_ts, [6, 7], [2023, 2024, 2025])
        baseline_occ = historical_month_avg(occ_ts, [6, 7], [2023, 2024, 2025])

        md_booked, md_n = avg_for_dates(pacing, mdn, "booked_rate_avg")
        md_asking, _   = avg_for_dates(pacing, mdn, "available_rate_avg")
        md_fill, _     = avg_for_dates(pacing, mdn, "fill_rate")

        nm_booked, nm_n = avg_for_dates(pacing, non_match_nights, "booked_rate_avg")
        nm_asking, _    = avg_for_dates(pacing, non_match_nights, "available_rate_avg")
        nm_fill, _      = avg_for_dates(pacing, non_match_nights, "fill_rate")

        def pct(a, b):
            return round((a / b - 1) * 100, 1) if (a and b) else None

        rows.append({
            "city": locality,
            "key": key,
            "num_matches": len(match_dates),
            "matchday_nights_n": md_n,
            "baseline_junejul_adr_3yr": baseline_adr,
            "baseline_junejul_occ_3yr": baseline_occ,
            "matchday_booked_adr":  md_booked,
            "matchday_asking_adr":  md_asking,
            "matchday_fill_rate":   md_fill,
            "nonmatch_booked_adr":  nm_booked,
            "nonmatch_asking_adr":  nm_asking,
            "nonmatch_fill_rate":   nm_fill,
            "matchday_asking_vs_baseline_pct":       pct(md_asking, baseline_adr),
            "matchday_asking_vs_nonmatch_asking_pct": pct(md_asking, nm_asking),
            "matchday_booked_vs_baseline_pct":       pct(md_booked, baseline_adr),
            "matchday_fill_vs_nonmatch_fill_ratio":  round(md_fill / nm_fill, 2) if (md_fill and nm_fill) else None,
        })

    rows.sort(key=lambda r: (r["matchday_asking_vs_baseline_pct"] or -999), reverse=True)

    csv_path = f"{BASE}/fifa_matchday.csv"
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        for r in rows: w.writerow(r)
    print(f"Wrote {csv_path}")

    md_path = f"{BASE}/fifa_matchday_summary.md"
    with open(md_path, "w") as f:
        f.write("# FIFA 2026 Match-Day Precision Analysis\n\n")
        f.write(f"Pull date: {date.today().isoformat()}\n")
        f.write(f"Match-day nights = match date + night before, per city (~2 nights per match)\n")
        f.write(f"Non-match control = all other nights inside June 11 – July 19 window\n\n")

        f.write("## Asking ADR on match-day nights vs 3-yr baseline\n\n")
        f.write("| City | # matches | Baseline Jun/Jul ADR (3yr) | Match-day asking ADR | % above baseline | Match-day fill | Non-match fill | Fill ratio |\n")
        f.write("|---|---:|---:|---:|---:|---:|---:|---:|\n")
        for r in rows:
            f.write(f"| {r['city']} | {r['num_matches']} | ${r['baseline_junejul_adr_3yr']} | ${r['matchday_asking_adr']} | {r['matchday_asking_vs_baseline_pct']}% | {r['matchday_fill_rate']} | {r['nonmatch_fill_rate']} | {r['matchday_fill_vs_nonmatch_fill_ratio']}x |\n")

        f.write("\n## Match-day asking vs non-match asking (how much more hosts charge on match nights inside the tournament)\n\n")
        f.write("| City | Match-day asking | Non-match asking | Gap % |\n")
        f.write("|---|---:|---:|---:|\n")
        for r in rows:
            f.write(f"| {r['city']} | ${r['matchday_asking_adr']} | ${r['nonmatch_asking_adr']} | {r['matchday_asking_vs_nonmatch_asking_pct']}% |\n")

        f.write("\n## Booked ADR on match-day nights (inventory already sold)\n\n")
        f.write("| City | Match-day booked ADR | vs baseline |\n")
        f.write("|---|---:|---:|\n")
        for r in rows:
            f.write(f"| {r['city']} | ${r['matchday_booked_adr']} | {r['matchday_booked_vs_baseline_pct']}% |\n")

    print(f"Wrote {md_path}")

if __name__ == "__main__":
    main()
