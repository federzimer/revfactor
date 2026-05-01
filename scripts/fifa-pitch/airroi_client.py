#!/usr/bin/env python3
"""
AirROI API client with disk-cached responses and append-only call log.

Goals:
  1. Never re-pull the same data twice (cache hits return instantly, cost $0).
  2. Every real API call is logged with timestamp, endpoint, params, and response size.
  3. A single `usage` command shows total calls, cache hit rate, and per-endpoint breakdown.

Usage as a library:

    from airroi_client import AirROI
    api = AirROI()  # reads key from env or memory file
    data = api.call("POST", "/markets/summary",
                    body={"market": {...}, "num_months": 12})
    # subsequent identical calls hit the cache, no network, no cost

CLI:
    python3 airroi_client.py --usage           # show usage report
    python3 airroi_client.py --usage --today   # filter to today
    python3 airroi_client.py --clear-cache     # wipe cache (re-runs will hit network)
"""

from __future__ import annotations
import argparse
import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import date, datetime
from typing import Any

# Resolve API key from (1) env var, (2) RevFactor credentials memory file, (3) explicit constructor arg.
DEFAULT_KEY = os.environ.get("AIRROI_API_KEY", "")
if not DEFAULT_KEY:
    mem = "/Users/aaronwhittaker/.claude/projects/-Users-aaronwhittaker-Claude/memory/revfactor_credentials.md"
    if os.path.exists(mem):
        with open(mem) as f:
            for line in f:
                if "API Key" in line and "AirROI" in open(mem).read():
                    pass
        # Simpler: parse line "API Key:" `...` from the AirROI section
        with open(mem) as f:
            text = f.read()
        idx = text.find("AirROI API")
        if idx >= 0:
            after = text[idx:idx + 500]
            for line in after.splitlines():
                if "API Key" in line and "`" in line:
                    DEFAULT_KEY = line.split("`")[1]
                    break

BASE = "https://api.airroi.com"
ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR = os.path.join(ROOT, "cache")
LOG_PATH = os.path.join(ROOT, "api_calls.log")
os.makedirs(CACHE_DIR, exist_ok=True)


def _key(method: str, path: str, body: Any, params: dict | None) -> str:
    canonical = json.dumps(
        {"m": method.upper(), "p": path, "b": body, "q": params or {}},
        sort_keys=True, separators=(",", ":"),
    )
    return hashlib.sha256(canonical.encode()).hexdigest()[:24]


def _params_summary(body: Any, params: dict | None) -> str:
    bits = []
    if isinstance(body, dict):
        m = body.get("market")
        if isinstance(m, dict):
            loc = m.get("locality") or m.get("region") or m.get("country")
            if loc:
                bits.append(f"loc={loc}")
        if "num_months" in body:
            bits.append(f"n={body['num_months']}")
    if params:
        for k, v in list(params.items())[:3]:
            bits.append(f"{k}={v}")
    return ",".join(bits) or "-"


class AirROI:
    def __init__(self, api_key: str | None = None, base: str = BASE,
                 cache: bool = True, log: bool = True):
        self.key = api_key or DEFAULT_KEY
        if not self.key:
            raise RuntimeError(
                "No AirROI API key. Set AIRROI_API_KEY env var or pass api_key="
            )
        self.base = base
        self.cache = cache
        self.log = log

    def call(self, method: str, path: str, body: Any = None,
             params: dict | None = None, force_refresh: bool = False) -> Any:
        cache_key = _key(method, path, body, params)
        cache_file = os.path.join(CACHE_DIR, f"{cache_key}.json")

        if self.cache and not force_refresh and os.path.exists(cache_file):
            with open(cache_file) as f:
                cached = json.load(f)
            if self.log:
                self._log_event(method, path, body, params, status="CACHE",
                                bytes_out=os.path.getsize(cache_file))
            return cached["data"]

        url = self.base + path
        if params:
            qs = "&".join(f"{k}={v}" for k, v in params.items())
            url = f"{url}?{qs}"
        data_bytes = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data_bytes, method=method)
        req.add_header("x-api-key", self.key)
        req.add_header("Content-Type", "application/json")

        t0 = time.time()
        status = "ERR"
        bytes_in = 0
        out: Any = None
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read()
                bytes_in = len(raw)
                out = json.loads(raw)
                status = f"OK_{resp.status}"
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="ignore")
            status = f"HTTP_{e.code}"
            out = {"error": err}
        except Exception as e:
            status = f"ERR_{type(e).__name__}"
            out = {"error": str(e)}
        elapsed_ms = int((time.time() - t0) * 1000)

        if self.cache and status.startswith("OK"):
            with open(cache_file, "w") as f:
                json.dump({"meta": {"method": method, "path": path,
                                    "ts": datetime.now().isoformat(timespec="seconds")},
                           "data": out}, f)

        if self.log:
            self._log_event(method, path, body, params, status=status,
                            bytes_out=bytes_in, elapsed_ms=elapsed_ms)

        return out

    def _log_event(self, method: str, path: str, body: Any,
                   params: dict | None, status: str,
                   bytes_out: int = 0, elapsed_ms: int | None = None):
        ts = datetime.now().isoformat(timespec="seconds")
        line = "\t".join([
            ts,
            status,
            method,
            path,
            _params_summary(body, params),
            str(bytes_out),
            str(elapsed_ms or ""),
        ])
        with open(LOG_PATH, "a") as f:
            f.write(line + "\n")


def _read_log():
    if not os.path.exists(LOG_PATH):
        return []
    rows = []
    with open(LOG_PATH) as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 5:
                continue
            ts, status, method, path, summary = parts[:5]
            bytes_out = int(parts[5]) if len(parts) > 5 and parts[5].isdigit() else 0
            elapsed = parts[6] if len(parts) > 6 else ""
            rows.append({
                "ts": ts, "status": status, "method": method,
                "path": path, "summary": summary,
                "bytes": bytes_out, "elapsed_ms": elapsed,
            })
    return rows


def _usage_report(today_only: bool = False):
    rows = _read_log()
    if today_only:
        today = date.today().isoformat()
        rows = [r for r in rows if r["ts"].startswith(today)]
    if not rows:
        print("No log entries yet.")
        return

    total = len(rows)
    cached = sum(1 for r in rows if r["status"] == "CACHE")
    network = sum(1 for r in rows if r["status"].startswith("OK"))
    errors = sum(1 for r in rows if r["status"].startswith(("ERR", "HTTP")))
    bytes_total = sum(r["bytes"] for r in rows if r["status"].startswith("OK"))

    print(f"AirROI usage report  ({'today only' if today_only else 'all-time'})")
    print(f"  Log file:           {LOG_PATH}")
    print(f"  Total calls logged: {total}")
    print(f"    Cache hits:       {cached}  (no network, $0)")
    print(f"    Network calls:    {network}")
    print(f"    Failed:           {errors}")
    print(f"  Bytes received:     {bytes_total:,}")
    if rows:
        print(f"  First entry:        {rows[0]['ts']}")
        print(f"  Last entry:         {rows[-1]['ts']}")

    by_path: dict[str, dict[str, int]] = {}
    for r in rows:
        b = by_path.setdefault(r["path"], {"net": 0, "cache": 0, "err": 0})
        if r["status"].startswith("OK"):
            b["net"] += 1
        elif r["status"] == "CACHE":
            b["cache"] += 1
        else:
            b["err"] += 1

    print()
    print(f"  {'endpoint':<45} {'net':>5} {'cache':>6} {'err':>5}")
    print(f"  {'-' * 45} {'-' * 5} {'-' * 6} {'-' * 5}")
    for p in sorted(by_path):
        b = by_path[p]
        print(f"  {p:<45} {b['net']:>5} {b['cache']:>6} {b['err']:>5}")


def _clear_cache():
    n = 0
    for f in os.listdir(CACHE_DIR):
        if f.endswith(".json"):
            os.remove(os.path.join(CACHE_DIR, f))
            n += 1
    print(f"Cleared {n} cached responses.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--usage", action="store_true", help="Show usage report")
    p.add_argument("--today", action="store_true", help="Filter usage report to today only")
    p.add_argument("--clear-cache", action="store_true", help="Delete all cached responses")
    args = p.parse_args()

    if args.clear_cache:
        _clear_cache()
        sys.exit(0)
    if args.usage:
        _usage_report(today_only=args.today)
        sys.exit(0)
    p.print_help()
