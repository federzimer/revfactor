#!/usr/bin/env python3
"""
One-shot: seed the AirROI cache + call log with the responses we already
pulled and saved as raw/<city>_*.json. After this runs, re-running
pull_fifa_data.py costs $0 (every call hits the cache).
"""
import hashlib
import json
import os
from datetime import datetime

ROOT = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(ROOT, "raw")
CACHE = os.path.join(ROOT, "cache")
LOG = os.path.join(ROOT, "api_calls.log")
os.makedirs(CACHE, exist_ok=True)

# Mirror the city → market mapping from pull_fifa_data.py
CITIES = [
    {"key": "atlanta",       "country": "US", "region": "Georgia",        "locality": "Atlanta"},
    {"key": "boston",        "country": "US", "region": "Massachusetts",  "locality": "Boston"},
    {"key": "dallas",        "country": "US", "region": "Texas",          "locality": "Dallas"},
    {"key": "houston",       "country": "US", "region": "Texas",          "locality": "Houston"},
    {"key": "kansas_city",   "country": "US", "region": "Missouri",       "locality": "Kansas City"},
    {"key": "los_angeles",   "country": "US", "region": "California",     "locality": "Los Angeles"},
    {"key": "miami",         "country": "US", "region": "Florida",        "locality": "Miami"},
    {"key": "new_york",      "country": "US", "region": "New York",       "locality": "New York"},
    {"key": "philadelphia",  "country": "US", "region": "Pennsylvania",   "locality": "Philadelphia"},
    {"key": "san_francisco", "country": "US", "region": "California",     "locality": "San Jose"},
    {"key": "seattle",       "country": "US", "region": "Washington",     "locality": "Seattle"},
]

# Each tuple: (raw filename suffix, method, path, body builder)
ENDPOINTS = [
    ("summary",
     "POST", "/markets/summary",
     lambda mk: {"market": mk, "num_months": 12, "currency": "native"}),
    ("adr_timeseries",
     "POST", "/markets/metrics/average-daily-rate",
     lambda mk: {"market": mk, "num_months": 36, "currency": "native"}),
    ("occupancy_timeseries",
     "POST", "/markets/metrics/occupancy",
     lambda mk: {"market": mk, "num_months": 36}),
    ("future_pacing",
     "POST", "/markets/metrics/future/pacing",
     lambda mk: {"market": mk, "currency": "native"}),
]


def cache_key(method, path, body):
    canonical = json.dumps({"m": method.upper(), "p": path, "b": body, "q": {}},
                           sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()[:24]


def params_summary(body):
    bits = []
    if isinstance(body, dict):
        m = body.get("market")
        if isinstance(m, dict):
            loc = m.get("locality") or m.get("region") or m.get("country")
            if loc:
                bits.append(f"loc={loc}")
        if "num_months" in body:
            bits.append(f"n={body['num_months']}")
    return ",".join(bits) or "-"


seeded = 0
log_lines = []
ts_seed = "2026-04-24T11:13:00"  # approximate original-pull timestamp

for c in CITIES:
    mk = {"country": c["country"], "region": c["region"], "locality": c["locality"]}
    for suffix, method, path, build in ENDPOINTS:
        raw_path = os.path.join(RAW, f"{c['key']}_{suffix}.json")
        if not os.path.exists(raw_path):
            print(f"  [skip] no raw file for {c['key']}/{suffix}")
            continue
        with open(raw_path) as f:
            data = json.load(f)
        body = build(mk)
        key = cache_key(method, path, body)
        cache_path = os.path.join(CACHE, f"{key}.json")
        with open(cache_path, "w") as f:
            json.dump({"meta": {"method": method, "path": path, "ts": ts_seed,
                                "seeded_from": raw_path},
                       "data": data}, f)
        seeded += 1
        bytes_out = os.path.getsize(raw_path)
        log_lines.append("\t".join([ts_seed, "OK_200_SEEDED", method, path,
                                    params_summary(body), str(bytes_out), ""]))

# Append the seed log entries
with open(LOG, "a") as f:
    for line in log_lines:
        f.write(line + "\n")

print(f"Seeded {seeded} cache entries.")
print(f"Logged {len(log_lines)} backdated entries to {LOG}")
print(f"Future re-runs of pull_fifa_data.py will hit cache (no network, $0).")
