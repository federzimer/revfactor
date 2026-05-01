#!/usr/bin/env python3
"""
Analyze AirROI pulls for the FIFA pitch.

For each host city compute:
  - 3-year average ADR for June & July (seasonal baseline)
  - 3-year average occupancy for June & July
  - Forward ADR (booked_rate_avg) inside the FIFA window: 2026-06-11 → 2026-07-19
  - Forward ADR in a control window: 2026-06-11 → 2026-07-19 excluded, use 2026-05-11 → 2026-06-10 (pre-tournament month) as control
  - Fill rate inside FIFA window vs fill rate in control window (at the same days-out)
  - % uplift vs 3-year June/July baseline
  - % uplift vs control window forward pricing
  - Dollar uplift per night

Output:
  - fifa_analysis.csv
  - fifa_summary.md  (headline numbers for the pitch)
"""
import csv
import json
import os
import statistics
from datetime import date, datetime

OUT_DIR = os.path.join(os.path.dirname(__file__), "raw")
FIFA_START = date(2026, 6, 11)
FIFA_END = date(2026, 7, 19)
CONTROL_START = date(2026, 5, 11)  # same-length pre-tournament window
CONTROL_END = date(2026, 6, 10)

def parse_d(s):
    return datetime.strptime(s, "%Y-%m-%d").date()

def in_range(d, start, end):
    return start <= d <= end

def historical_month_avg(series, months, years):
    """Average of `avg` field for the given (month, year) combos."""
    vals = []
    if not series or "results" not in series:
        return None
    for row in series["results"]:
        d = parse_d(row["date"])
        if d.month in months and d.year in years and row.get("avg") is not None:
            vals.append(row["avg"])
    return round(statistics.mean(vals), 2) if vals else None

def window_metrics(pacing, start, end):
    if not pacing or "results" not in pacing:
        return None
    booked_rates, avail_rates, fills, booked_counts, avail_counts = [], [], [], [], []
    for row in pacing["results"]:
        d = parse_d(row["date"])
        if in_range(d, start, end):
            if row.get("booked_rate_avg") is not None:
                booked_rates.append(row["booked_rate_avg"])
            if row.get("available_rate_avg") is not None:
                avail_rates.append(row["available_rate_avg"])
            if row.get("fill_rate") is not None:
                fills.append(row["fill_rate"])
            booked_counts.append(row.get("booked_count") or 0)
            avail_counts.append(row.get("available_count") or 0)
    if not booked_rates:
        return None
    return {
        "booked_rate_avg":   round(statistics.mean(booked_rates), 2),
        "available_rate_avg":round(statistics.mean(avail_rates), 2) if avail_rates else None,
        "fill_rate_avg":     round(statistics.mean(fills), 3) if fills else None,
        "booked_count_avg":  round(statistics.mean(booked_counts), 0),
        "available_count_avg":round(statistics.mean(avail_counts), 0),
        "n_days":            len(booked_rates),
    }

def main():
    with open(f"{OUT_DIR}/all_cities.json") as f:
        cities = json.load(f)

    rows = []
    for c in cities:
        info = c["city"]
        key = info["key"]
        locality = info["locality"]

        summary = c.get("summary") or {}
        ttm_adr = summary.get("average_daily_rate")
        ttm_occ = summary.get("occupancy")
        listings = summary.get("active_listings_count")

        adr_ts = c.get("adr_timeseries")
        baseline_junejul_3yr = historical_month_avg(
            adr_ts, months=[6, 7], years=[2023, 2024, 2025]
        )
        baseline_jun_2025 = historical_month_avg(adr_ts, months=[6], years=[2025])
        baseline_jul_2025 = historical_month_avg(adr_ts, months=[7], years=[2025])

        occ_ts = c.get("occupancy_timeseries")
        occ_junejul_3yr = historical_month_avg(
            occ_ts, months=[6, 7], years=[2023, 2024, 2025]
        )

        pacing = c.get("future_pacing")
        fifa = window_metrics(pacing, FIFA_START, FIFA_END)
        control = window_metrics(pacing, CONTROL_START, CONTROL_END)

        fifa_rate = fifa["booked_rate_avg"] if fifa else None
        fifa_avail = fifa["available_rate_avg"] if fifa else None
        fifa_fill = fifa["fill_rate_avg"] if fifa else None
        ctrl_rate = control["booked_rate_avg"] if control else None
        ctrl_fill = control["fill_rate_avg"] if control else None

        uplift_vs_3yr = None
        if fifa_rate and baseline_junejul_3yr:
            uplift_vs_3yr = round((fifa_rate / baseline_junejul_3yr - 1) * 100, 1)
        uplift_vs_control = None
        if fifa_rate and ctrl_rate:
            uplift_vs_control = round((fifa_rate / ctrl_rate - 1) * 100, 1)
        dollar_uplift = None
        if fifa_rate and baseline_junejul_3yr:
            dollar_uplift = round(fifa_rate - baseline_junejul_3yr, 2)

        fill_ratio = None
        if fifa_fill and ctrl_fill:
            fill_ratio = round(fifa_fill / ctrl_fill, 2) if ctrl_fill else None

        rows.append({
            "city": locality,
            "key": key,
            "stadium": info.get("stadium"),
            "active_listings": listings,
            "ttm_adr": ttm_adr,
            "ttm_occupancy": ttm_occ,
            "june_july_3yr_avg_adr": baseline_junejul_3yr,
            "june_2025_adr": baseline_jun_2025,
            "july_2025_adr": baseline_jul_2025,
            "june_july_3yr_avg_occupancy": occ_junejul_3yr,
            "fifa_window_booked_adr": fifa_rate,
            "fifa_window_available_adr": fifa_avail,
            "fifa_window_fill_rate": fifa_fill,
            "control_window_booked_adr": ctrl_rate,
            "control_window_fill_rate": ctrl_fill,
            "uplift_pct_vs_3yr_junejul": uplift_vs_3yr,
            "uplift_pct_vs_control_window": uplift_vs_control,
            "dollar_uplift_vs_3yr": dollar_uplift,
            "fill_rate_ratio_fifa_vs_control": fill_ratio,
        })

    rows.sort(key=lambda r: (r["uplift_pct_vs_3yr_junejul"] or -999), reverse=True)

    csv_path = f"{OUT_DIR}/../fifa_analysis.csv"
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"Wrote {csv_path}")

    md_path = f"{OUT_DIR}/../fifa_summary.md"
    with open(md_path, "w") as f:
        f.write("# FIFA 2026 Host-City STR Pricing — AirROI Data Pull\n\n")
        f.write(f"Pull date: {date.today().isoformat()}\n")
        f.write(f"FIFA window analysed: {FIFA_START} → {FIFA_END} ({(FIFA_END-FIFA_START).days+1} days)\n")
        f.write(f"Control window: {CONTROL_START} → {CONTROL_END} (pre-tournament, same length)\n\n")

        f.write("## Host cities ranked by ADR uplift vs 3-yr June/July baseline\n\n")
        f.write("| City | Listings | 3-yr Jun/Jul avg ADR | FIFA window ADR (booked) | Uplift % | $ uplift | FIFA fill rate | Control fill rate | Fill ratio |\n")
        f.write("|---|---:|---:|---:|---:|---:|---:|---:|---:|\n")
        for r in rows:
            f.write(f"| {r['city']} | {r['active_listings']:.0f} | ${r['june_july_3yr_avg_adr']} | ${r['fifa_window_booked_adr']} | {r['uplift_pct_vs_3yr_junejul']}% | ${r['dollar_uplift_vs_3yr']} | {r['fifa_window_fill_rate']} | {r['control_window_fill_rate']} | {r['fill_rate_ratio_fifa_vs_control']}x |\n")

        f.write("\n## Raw baseline (TTM) per city\n\n")
        f.write("| City | TTM ADR | TTM Occ | Active listings |\n")
        f.write("|---|---:|---:|---:|\n")
        for r in rows:
            f.write(f"| {r['city']} | ${r['ttm_adr']} | {r['ttm_occupancy']} | {r['active_listings']:.0f} |\n")

    print(f"Wrote {md_path}")

if __name__ == "__main__":
    main()
