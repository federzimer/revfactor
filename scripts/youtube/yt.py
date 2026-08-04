#!/usr/bin/env python3
"""RevFactor YouTube CLI — upload/manage videos via the YouTube Data API v3.

Stdlib only (urllib). No google client libraries required.

Subcommands:
  channels                       List the token's channels
  upload  --file --title ...     Resumable upload (default privacy: private)
  update  --video <id> ...       Update title/description/privacy
  list    [--max N]              Recent uploads on the channel
  delete  --video <id>           Delete a video

Auth resolution order (first match wins):
  1. --token-file <path>            JSON file with {"refresh_token": ...}
  2. env YT_TOKEN_FILE              same, path via env
  3. env YT_REFRESH_TOKEN           + YT_CLIENT_ID + YT_CLIENT_SECRET (Doppler pattern)
  4. default token file             (Aaron's local ProCloser token)

Client id/secret (when not provided via env):
  --credentials-file / env YT_CREDENTIALS_FILE / default ProCloser credentials.json
"""

import argparse
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://www.googleapis.com/youtube/v3"
UPLOAD_API = "https://www.googleapis.com/upload/youtube/v3/videos"
TOKEN_URI = "https://oauth2.googleapis.com/token"

DEFAULT_TOKEN_FILE = "/Users/aaronwhittaker/Claude/ProCloser.ai Website/token-procloser-youtube.json"
DEFAULT_CREDENTIALS_FILE = "/Users/aaronwhittaker/Claude/ProCloser.ai Website/credentials.json"

CHUNK_SIZE = 8 * 1024 * 1024  # 8 MB


def die(msg, code=1):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


def load_auth(args):
    """Return (client_id, client_secret, refresh_token)."""
    refresh_token = None
    client_id = os.environ.get("YT_CLIENT_ID")
    client_secret = os.environ.get("YT_CLIENT_SECRET")

    token_file = args.token_file or os.environ.get("YT_TOKEN_FILE")
    if token_file:
        if not os.path.exists(token_file):
            die(f"token file not found: {token_file}")
        with open(token_file) as f:
            tok = json.load(f)
        refresh_token = tok.get("refresh_token")
        client_id = tok.get("client_id") or client_id
        client_secret = tok.get("client_secret") or client_secret
    elif os.environ.get("YT_REFRESH_TOKEN"):
        refresh_token = os.environ["YT_REFRESH_TOKEN"]
    elif os.path.exists(DEFAULT_TOKEN_FILE):
        with open(DEFAULT_TOKEN_FILE) as f:
            tok = json.load(f)
        refresh_token = tok.get("refresh_token")
        client_id = tok.get("client_id") or client_id
        client_secret = tok.get("client_secret") or client_secret

    if not refresh_token:
        die("no refresh token found (use --token-file, YT_TOKEN_FILE, or YT_REFRESH_TOKEN)")

    if not (client_id and client_secret):
        cred_file = args.credentials_file or os.environ.get("YT_CREDENTIALS_FILE") or DEFAULT_CREDENTIALS_FILE
        if not os.path.exists(cred_file):
            die("no client id/secret: set YT_CLIENT_ID+YT_CLIENT_SECRET or provide --credentials-file")
        with open(cred_file) as f:
            cred = json.load(f)
        blk = cred.get("installed") or cred.get("web") or {}
        client_id = client_id or blk.get("client_id")
        client_secret = client_secret or blk.get("client_secret")

    if not (client_id and client_secret):
        die("could not resolve OAuth client id/secret")
    return client_id, client_secret, refresh_token


def get_access_token(args):
    client_id, client_secret, refresh_token = load_auth(args)
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }).encode()
    req = urllib.request.Request(TOKEN_URI, data=data, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)["access_token"]
    except urllib.error.HTTPError as e:
        die(f"token refresh failed: {e.code} {e.read().decode()}")


def api_call(access_token, method, url, params=None, body=None, raw_ok_204=False):
    if params:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {access_token}")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as r:
            if r.status == 204 or raw_ok_204:
                txt = r.read().decode()
                return json.loads(txt) if txt else {}
            return json.load(r)
    except urllib.error.HTTPError as e:
        die(f"API {method} {url.split('?')[0]} failed: {e.code} {e.read().decode()}")


# ---------------- subcommands ----------------

def cmd_channels(args):
    tok = get_access_token(args)
    res = api_call(tok, "GET", f"{API}/channels", {"part": "snippet,statistics", "mine": "true"})
    items = res.get("items", [])
    if not items:
        print("No channels found for this token.")
        return
    for c in items:
        print(f"{c['id']}  {c['snippet']['title']}  (videos: {c.get('statistics', {}).get('videoCount', '?')})")


def cmd_upload(args):
    path = args.file
    if not os.path.exists(path):
        die(f"file not found: {path}")
    size = os.path.getsize(path)
    mime = mimetypes.guess_type(path)[0] or "video/*"

    snippet = {"title": args.title}
    if args.description:
        snippet["description"] = args.description
    if args.tags:
        snippet["tags"] = [t.strip() for t in args.tags.split(",") if t.strip()]
    if args.category:
        snippet["categoryId"] = args.category

    status = {"privacyStatus": args.privacy, "selfDeclaredMadeForKids": False}
    if args.publish_at:
        status["privacyStatus"] = "private"  # required by the API for scheduled publish
        status["publishAt"] = args.publish_at

    body = {"snippet": snippet, "status": status}
    tok = get_access_token(args)

    # 1) initiate resumable session
    init_url = UPLOAD_API + "?" + urllib.parse.urlencode({"uploadType": "resumable", "part": "snippet,status"})
    req = urllib.request.Request(init_url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", f"Bearer {tok}")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Upload-Content-Length", str(size))
    req.add_header("X-Upload-Content-Type", mime)
    try:
        with urllib.request.urlopen(req) as r:
            session_url = r.headers.get("Location")
    except urllib.error.HTTPError as e:
        die(f"upload init failed: {e.code} {e.read().decode()}")
    if not session_url:
        die("no resumable session URL returned")

    # 2) upload bytes in chunks
    result = None
    with open(path, "rb") as f:
        offset = 0
        while offset < size:
            chunk = f.read(CHUNK_SIZE)
            end = offset + len(chunk) - 1
            for attempt in range(4):
                req = urllib.request.Request(session_url, data=chunk, method="PUT")
                req.add_header("Authorization", f"Bearer {tok}")
                req.add_header("Content-Length", str(len(chunk)))
                req.add_header("Content-Range", f"bytes {offset}-{end}/{size}")
                try:
                    with urllib.request.urlopen(req) as r:
                        if r.status in (200, 201):
                            result = json.load(r)
                        break
                except urllib.error.HTTPError as e:
                    if e.code == 308:  # resume incomplete — next chunk
                        break
                    if e.code in (500, 502, 503, 504) and attempt < 3:
                        time.sleep(2 ** attempt)
                        continue
                    die(f"chunk upload failed: {e.code} {e.read().decode()}")
            offset += len(chunk)
            pct = offset * 100 // size
            print(f"  uploaded {offset}/{size} bytes ({pct}%)", file=sys.stderr)

    if not result:
        die("upload finished but no video resource returned")
    vid = result["id"]
    print(f"Video ID: {vid}")
    print(f"Privacy:  {result.get('status', {}).get('privacyStatus')}")
    if args.publish_at:
        print(f"Publish at: {args.publish_at}")
    print(f"Watch:  https://www.youtube.com/watch?v={vid}")
    print(f"Studio: https://studio.youtube.com/video/{vid}/edit")


def cmd_update(args):
    tok = get_access_token(args)
    res = api_call(tok, "GET", f"{API}/videos", {"part": "snippet,status", "id": args.video})
    items = res.get("items", [])
    if not items:
        die(f"video not found: {args.video}")
    v = items[0]
    snippet, status = v["snippet"], v["status"]
    if args.title:
        snippet["title"] = args.title
    if args.description is not None:
        snippet["description"] = args.description
    if args.privacy:
        status["privacyStatus"] = args.privacy
    snippet.setdefault("categoryId", "22")
    body = {"id": args.video, "snippet": snippet, "status": status}
    out = api_call(tok, "PUT", f"{API}/videos", {"part": "snippet,status"}, body)
    print(f"Updated {out['id']}: title={out['snippet']['title']!r} privacy={out['status']['privacyStatus']}")


def cmd_list(args):
    tok = get_access_token(args)
    ch = api_call(tok, "GET", f"{API}/channels", {"part": "contentDetails", "mine": "true"})
    items = ch.get("items", [])
    if not items:
        die("no channel found for this token")
    uploads = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]
    res = api_call(tok, "GET", f"{API}/playlistItems", {
        "part": "snippet,status", "playlistId": uploads, "maxResults": str(args.max)})
    vids = res.get("items", [])
    if not vids:
        print("No uploads found.")
        return
    for it in vids:
        s = it["snippet"]
        vid = s["resourceId"]["videoId"]
        priv = it.get("status", {}).get("privacyStatus", "?")
        print(f"{vid}  [{priv}]  {s['publishedAt']}  {s['title']}")


def cmd_delete(args):
    tok = get_access_token(args)
    url = f"{API}/videos?" + urllib.parse.urlencode({"id": args.video})
    req = urllib.request.Request(url, method="DELETE")
    req.add_header("Authorization", f"Bearer {tok}")
    try:
        with urllib.request.urlopen(req) as r:
            if r.status == 204:
                print(f"Deleted {args.video}")
                return
            print(f"Delete returned HTTP {r.status}")
    except urllib.error.HTTPError as e:
        die(f"delete failed: {e.code} {e.read().decode()}")


def main():
    p = argparse.ArgumentParser(description="RevFactor YouTube CLI (stdlib only)")
    p.add_argument("--token-file", help="JSON file with refresh_token (overrides env)")
    p.add_argument("--credentials-file", help="OAuth client credentials.json (installed client)")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("channels", help="list the token's channels")

    up = sub.add_parser("upload", help="upload a video (resumable)")
    up.add_argument("--file", required=True)
    up.add_argument("--title", required=True)
    up.add_argument("--description", default="")
    up.add_argument("--tags", help="comma-separated")
    up.add_argument("--category", help="categoryId (e.g. 22 = People & Blogs)")
    up.add_argument("--privacy", default="private", choices=["private", "unlisted", "public"])
    up.add_argument("--publish-at", help="ISO 8601, e.g. 2026-08-10T15:00:00Z (forces private until then)")

    ud = sub.add_parser("update", help="update video metadata")
    ud.add_argument("--video", required=True)
    ud.add_argument("--title")
    ud.add_argument("--description")
    ud.add_argument("--privacy", choices=["private", "unlisted", "public"])

    ls = sub.add_parser("list", help="recent uploads")
    ls.add_argument("--max", type=int, default=10)

    dl = sub.add_parser("delete", help="delete a video")
    dl.add_argument("--video", required=True)

    args = p.parse_args()
    {"channels": cmd_channels, "upload": cmd_upload, "update": cmd_update,
     "list": cmd_list, "delete": cmd_delete}[args.cmd](args)


if __name__ == "__main__":
    main()
