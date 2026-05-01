#!/usr/bin/env python3
"""
Pull FIFA 2026 host-city STR pricing data from AirROI.

Uses the cached + logged AirROI client. Re-runs hit the cache and cost $0
unless --refresh is passed.

Output:
  raw/<city>_summary.json
  raw/<city>_adr_timeseries.json
  raw/<city>_future_pacing.json
  raw/<city>_occupancy_timeseries.json
  raw/all_cities.json
"""
import argparse
import json
import os
import sys
import time

from airroi_client import AirROI

OUT_DIR = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(OUT_DIR, exist_ok=True)

HOST_CITIES = [
    {"key": "atlanta",       "country": "US", "region": "Georgia",        "locality": "Atlanta",       "stadium": "Mercedes-Benz Stadium"},
    {"key": "boston",        "country": "US", "region": "Massachusetts",  "locality": "Boston",        "stadium": "Gillette Stadium (Foxborough)"},
    {"key": "dallas",        "country": "US", "region": "Texas",          "locality": "Dallas",        "stadium": "AT&T Stadium (Arlington)"},
    {"key": "houston",       "country": "US", "region": "Texas",          "locality": "Houston",       "stadium": "NRG Stadium"},
    {"key": "kansas_city",   "country": "US", "region": "Missouri",       "locality": "Kansas City",   "stadium": "Arrowhead Stadium"},
    {"key": "los_angeles",   "country": "US", "region": "California",     "locality": "Los Angeles",   "stadium": "SoFi Stadium (Inglewood)"},
    {"key": "miami",         "country": "US", "region": "Florida",        "locality": "Miami",         "stadium": "Hard Rock Stadium (Miami Gardens)"},
    {"key": "new_york",      "country": "US", "region": "New York",       "locality": "New York",      "stadium": "MetLife Stadium (East Rutherford, NJ)"},
    {"key": "philadelphia",  "country": "US", "region": "Pennsylvania",   "locality": "Philadelphia",  "stadium": "Lincoln Financial Field"},
    {"key": "san_francisco", "country": "US", "region": "California",     "locality": "San Jose",      "stadium": "Levi's Stadium (Santa Clara)"},
    {"key": "seattle",       "country": "US", "region": "Washington",     "locality": "Seattle",       "stadium": "Lumen Field"},
]


def pull_city(api: AirROI, c: dict, force_refresh: bool):
    mk = {"country": c["country"], "region": c["region"], "locality": c["locality"]}
    print(f"[{c['key']}] pulling...")
    out: dict = {"city": c}

    summary = api.call("POST", "/markets/summary",
                       body={"market": mk, "num_months": 12, "currency": "native"},
                       force_refresh=force_refresh)
    out["summary"] = summary
    with open(f"{OUT_DIR}/{c['key']}_summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    adr = api.call("POST", "/markets/metrics/average-daily-rate",
                   body={"market": mk, "num_months": 36, "currency": "native"},
                   force_refresh=force_refresh)
    out["adr_timeseries"] = adr
    with open(f"{OUT_DIR}/{c['key']}_adr_timeseries.json", "w") as f:
        json.dump(adr, f, indent=2)

    occ = api.call("POST", "/markets/metrics/occupancy",
                   body={"market": mk, "num_months": 36},
                   force_refresh=force_refresh)
    out["occupancy_timeseries"] = occ
    with open(f"{OUT_DIR}/{c['key']}_occupancy_timeseries.json", "w") as f:
        json.dump(occ, f, indent=2)

    pace = api.call("POST", "/markets/metrics/future/pacing",
                    body={"market": mk, "currency": "native"},
                    force_refresh=force_refresh)
    out["future_pacing"] = pace
    with open(f"{OUT_DIR}/{c['key']}_future_pacing.json", "w") as f:
        json.dump(pace, f, indent=2)

    if isinstance(summary, dict):
        print(f"  baseline: ADR ${summary.get('average_daily_rate')}, "
              f"occ {summary.get('occupancy')}, "
              f"listings {summary.get('active_listings_count')}")
    if isinstance(pace, dict) and pace.get("results"):
        r = pace["results"]
        print(f"  future pacing: {len(r)} dates "
              f"({r[0]['date']} → {r[-1]['date']})")
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--refresh", action="store_true",
                   help="Bypass cache and force fresh API calls")
    args = p.parse_args()

    api = AirROI()
    all_data = []
    for c in HOST_CITIES:
        all_data.append(pull_city(api, c, force_refresh=args.refresh))
        time.sleep(0.1)
    with open(f"{OUT_DIR}/all_cities.json", "w") as f:
        json.dump(all_data, f, indent=2)
    print(f"\nDone. {len(all_data)} cities → {OUT_DIR}/all_cities.json")
    print("Run `python3 airroi_client.py --usage` for the API call breakdown.")


if __name__ == "__main__":
    main()
