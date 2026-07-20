#!/usr/bin/env python3
"""Hub -> Google Ads offline conversion uploader.

Pulls RevFactor Hub leads (GET /api/v1/leads), and for each lead that has a
gclid, uploads an offline conversion when its funnel timeline crosses a
milestone:
  - booked_call_at  -> "RevFactor — Booked Call (offline)" (7683656313)
  - won (converted_at) -> "RevFactor — Won Deal (offline)" (7683656391)
This feeds Google Ads Smart Bidding real down-funnel signal (which clicks
become booked calls / clients), not just form fills.

State (~/.revfactor-hub-ga-state.json) records (lead_id, milestone) already
uploaded so nothing double-counts, plus the last updated_since cursor.

msclkid leads are logged for a future Bing/Microsoft Ads uploader (separate API).

Default is DRY RUN. Pass --live to actually upload.
Run daily via launchd. Auth: keychain `revfactor-hub-leads-api`, google-ads.yaml.
"""
import sys, os, json, subprocess, urllib.request, urllib.parse
from datetime import datetime, timezone
from pathlib import Path

CID = "5342635272"
HUB = "https://hub.revfactor.io/api/v1/leads"
ACTIONS = {
    "booked_call": "7683656313",
    "won":         "7683656391",
}
STATE = Path.home() / ".revfactor-hub-ga-state.json"
LIVE = "--live" in sys.argv

def keychain(service):
    return subprocess.run(["security","find-generic-password","-s",service,"-w"],
                          capture_output=True, text=True).stdout.strip()

def load_state():
    if STATE.exists():
        return json.load(open(STATE))
    return {"uploaded": {}, "updated_since": "2026-07-10T00:00:00Z"}

def save_state(s):
    json.dump(s, open(STATE,"w"), indent=2)

def fetch_leads(api_key, since):
    out, cursor = [], None
    for _ in range(20):
        q = {"updated_since": since, "limit": "200", "include": "events"}
        if cursor: q["cursor"] = cursor
        req = urllib.request.Request(HUB + "?" + urllib.parse.urlencode(q),
                                     headers={"Authorization": "Bearer " + api_key})
        d = json.load(urllib.request.urlopen(req, timeout=30))
        out += d.get("data", [])
        if not d.get("has_more"): break
        cursor = d.get("next_cursor")
        if not cursor: break
    return out

def to_ga_dt(iso):
    """ISO8601 'Z' -> Google Ads 'YYYY-MM-DD HH:MM:SS+00:00'."""
    if not iso: return None
    dt = datetime.fromisoformat(iso.replace("Z","+00:00")).astimezone(timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S+00:00")

def main():
    api_key = keychain("revfactor-hub-leads-api")
    if not api_key:
        print("FATAL: no revfactor-hub-leads-api key in keychain"); sys.exit(2)
    state = load_state()
    uploaded = state["uploaded"]
    since = state["updated_since"]
    print(f"{'LIVE' if LIVE else 'DRY-RUN'} | pulling leads updated since {since}")
    leads = fetch_leads(api_key, since)
    print(f"pulled {len(leads)} lead(s)")

    to_upload = []       # {gclid, action_id, dt, value, label}
    bing_todo = []       # msclkid leads for future Bing uploader
    max_updated = since
    for l in leads:
        max_updated = max(max_updated, l.get("updated_at", since))
        attr = l.get("attribution", {}) or {}
        gclid = attr.get("gclid")
        msclkid = attr.get("msclkid")
        tl = l.get("timeline", {}) or {}
        lid = l.get("id")
        # milestone -> (timeline key, action, value)
        events = []
        if tl.get("booked_call_at"):
            events.append(("booked_call", tl["booked_call_at"], ACTIONS["booked_call"], 300.0))
        if l.get("outcome") == "won" and tl.get("converted_at"):
            events.append(("won", tl["converted_at"], ACTIONS["won"], 1000.0))
        for milestone, when, action_id, value in events:
            key = f"{lid}:{milestone}"
            if key in uploaded:
                continue
            if msclkid and not gclid:
                bing_todo.append((lid, milestone, msclkid, when)); continue
            if not gclid:
                continue  # organic/no-click lead: nothing to attribute
            to_upload.append({
                "key": key, "gclid": gclid, "action_id": action_id,
                "dt": to_ga_dt(when), "value": value,
                "label": f"{l.get('email','?')} {milestone}",
            })

    print(f"{len(to_upload)} conversion(s) to upload; {len(bing_todo)} msclkid lead(s) pending Bing")
    for c in to_upload:
        print(f"  {'WOULD UPLOAD' if not LIVE else 'UPLOAD'}: {c['label']} | gclid={c['gclid'][:22]}.. | {c['dt']} | ${c['value']} | action {c['action_id']}")
    for b in bing_todo:
        print(f"  BING-TODO: lead {b[0]} {b[1]} msclkid={b[2][:18]}..")

    if to_upload and LIVE:
        from google.ads.googleads.client import GoogleAdsClient
        client = GoogleAdsClient.load_from_storage("google-ads.yaml")
        svc = client.get_service("ConversionUploadService")
        req = client.get_type("UploadClickConversionsRequest")
        req.customer_id = CID
        req.partial_failure = True
        for c in to_upload:
            cc = client.get_type("ClickConversion")
            cc.gclid = c["gclid"]
            cc.conversion_action = f"customers/{CID}/conversionActions/{c['action_id']}"
            cc.conversion_date_time = c["dt"]
            cc.conversion_value = float(c["value"])
            cc.currency_code = "USD"
            req.conversions.append(cc)
        resp = svc.upload_click_conversions(request=req)
        if resp.partial_failure_error and resp.partial_failure_error.code:
            print(f"  ⚠ partial failure: {resp.partial_failure_error.message}")
        ok = 0
        for i, r in enumerate(resp.results):
            if getattr(r, "gclid", "") or getattr(r, "conversion_date_time", ""):
                uploaded[to_upload[i]["key"]] = {"at": datetime.now(timezone.utc).isoformat()}
                ok += 1
        print(f"  uploaded {ok}/{len(to_upload)}")

    # advance cursor + persist (dry-run advances nothing so re-runs are safe)
    if LIVE:
        state["updated_since"] = max_updated
        state["uploaded"] = uploaded
        save_state(state)
        print(f"state saved; next updated_since={max_updated}")

if __name__ == "__main__":
    main()
