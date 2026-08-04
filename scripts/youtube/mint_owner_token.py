#!/usr/bin/env python3
"""Mint a YouTube refresh token for a CHANNEL OWNER account (e.g. Gaston/Fede)
using the OAuth 2.0 device flow — no local browser needed on their end.

How it works:
  1. This script requests a device code and prints a short user code + URL.
  2. Send the remote person the URL (https://www.google.com/device) and the code.
  3. They sign in with the channel-owner Google account and approve.
  4. The script polls until approved, then writes {"refresh_token": ...} to --out.

IMPORTANT: Google's device flow only works with an OAuth client of type
"TVs and Limited Input devices". A Desktop/installed client will be rejected
(invalid_client / unauthorized). If that happens this script tells you and exits.

Usage:
  python3 mint_owner_token.py [--credentials-file credentials.json] \
      [--out token-owner.json] [--check]

  --check  only test whether the device-code request works with this client,
           print the result, and exit (no polling, no human needed).

Stdlib only.
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

DEVICE_CODE_URI = "https://oauth2.googleapis.com/device/code"
TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPES = "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.upload"
DEFAULT_CREDENTIALS_FILE = "/Users/aaronwhittaker/Claude/ProCloser.ai Website/credentials.json"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--credentials-file", default=os.environ.get("YT_CREDENTIALS_FILE", DEFAULT_CREDENTIALS_FILE))
    p.add_argument("--out", default="token-owner.json")
    p.add_argument("--check", action="store_true", help="only test the device-code request, then exit")
    args = p.parse_args()

    with open(args.credentials_file) as f:
        cred = json.load(f)
    blk = cred.get("installed") or cred.get("web") or cred.get("tv") or {}
    client_id = blk.get("client_id")
    client_secret = blk.get("client_secret")
    if not client_id:
        sys.exit("ERROR: no client_id in credentials file")

    # 1) request a device code
    data = urllib.parse.urlencode({"client_id": client_id, "scope": SCOPES}).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(DEVICE_CODE_URI, data=data, method="POST")) as r:
            dc = json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Device-code request FAILED: HTTP {e.code}\n{body}\n", file=sys.stderr)
        print(
            "This OAuth client does not support the device flow.\n"
            "Fix: in Google Cloud Console (project silver-archery-491915-n8) create a NEW\n"
            "OAuth client of type 'TVs and Limited Input devices', download its JSON, and\n"
            "re-run this script with --credentials-file pointing at it.\n"
            "(Desktop/installed clients are rejected by Google for the device flow.)",
            file=sys.stderr,
        )
        sys.exit(2)

    print(f"Device-code request OK.")
    print(f"  1. Send this to the channel owner: visit {dc.get('verification_url', 'https://www.google.com/device')}")
    print(f"  2. Enter code: {dc['user_code']}")
    print(f"  (expires in {dc.get('expires_in', 1800) // 60} minutes)")

    if args.check:
        print("\n--check mode: device flow WORKS with this client. Exiting without polling.")
        return

    # 2) poll for approval
    interval = dc.get("interval", 5)
    deadline = time.time() + dc.get("expires_in", 1800)
    print("\nWaiting for approval...", flush=True)
    while time.time() < deadline:
        time.sleep(interval)
        poll = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "device_code": dc["device_code"],
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        }).encode()
        try:
            with urllib.request.urlopen(urllib.request.Request(TOKEN_URI, data=poll, method="POST")) as r:
                tok = json.load(r)
        except urllib.error.HTTPError as e:
            err = json.loads(e.read().decode() or "{}")
            code = err.get("error", "")
            if code == "authorization_pending":
                continue
            if code == "slow_down":
                interval += 2
                continue
            sys.exit(f"ERROR: {code}: {err.get('error_description', '')}")
        with open(args.out, "w") as f:
            json.dump({"refresh_token": tok["refresh_token"]}, f, indent=2)
        print(f"\nSUCCESS — refresh token saved to {args.out}")
        print("Verify with: python3 yt.py --token-file", args.out, "channels")
        return
    sys.exit("ERROR: device code expired before approval")


if __name__ == "__main__":
    main()
