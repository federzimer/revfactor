# YouTube CLI (RevFactor)

Shared CLI for uploading/managing YouTube videos via the Data API v3. Python 3 stdlib only — no pip installs, no google client libraries.

## Commands

```bash
python3 yt.py channels                          # list channels for the token
python3 yt.py upload --file video.mp4 --title "My title" \
    [--description "..."] [--tags a,b,c] \
    [--privacy private|unlisted|public] \
    [--publish-at 2026-08-10T15:00:00Z]         # default privacy: private
python3 yt.py list [--max 10]                   # recent uploads
python3 yt.py update --video VIDEO_ID [--title ...] [--description ...] [--privacy ...]
python3 yt.py delete --video VIDEO_ID
```

`upload` prints the video ID plus watch + Studio URLs. `--publish-at` schedules a public release (video stays private until then, per API rules).

## Auth

Resolution order:

1. `--token-file path.json` — file containing `{"refresh_token": "..."}`
2. env `YT_TOKEN_FILE` — same, path via env
3. env `YT_REFRESH_TOKEN` + `YT_CLIENT_ID` + `YT_CLIENT_SECRET` — the Doppler pattern (below)
4. Aaron's local default: `~/Claude/ProCloser.ai Website/token-procloser-youtube.json` (aaron@procloser.ai — "ProCloser" channel `UCrO67x1VVzrqE8HGCP0G87w`)

Client id/secret (for options 1/2/4) come from `--credentials-file`, env `YT_CREDENTIALS_FILE`, or Aaron's local default `credentials.json`.

### Jlo — run via Doppler env

No files needed. With the secrets `YT_REFRESH_TOKEN`, `YT_CLIENT_ID`, `YT_CLIENT_SECRET` in a Doppler config:

```bash
doppler run -p seo-toolkit -c dev -- python3 scripts/youtube/yt.py channels
doppler run -p seo-toolkit -c dev -- python3 scripts/youtube/yt.py upload \
    --file episode1.mp4 --title "Episode 1" --privacy private
```

(Or plain env: `YT_REFRESH_TOKEN=... YT_CLIENT_ID=... YT_CLIENT_SECRET=... python3 yt.py ...`)

## Minting a token for a channel owner (Gaston/Fede)

`mint_owner_token.py` uses the OAuth **device flow** so a remote person can authorize without touching a terminal: the script prints a short code, they visit google.com/device on their phone, sign in with the channel-owner account, enter the code — the script saves the refresh token.

```bash
python3 mint_owner_token.py --check                 # test client compatibility only
python3 mint_owner_token.py --out token-gaston.json # full flow (waits for approval)
```

**Caveat:** Google only allows the device flow for OAuth clients of type **"TVs and Limited Input devices"**. The current client is a Desktop client — if the request is rejected, create a TV-type client in Google Cloud Console (project `silver-archery-491915-n8`) and pass its JSON via `--credentials-file`. The script detects this and prints exact instructions.

## Caveats

- **Private-until-audit:** unverified API projects have upload caveats — videos uploaded via an unaudited API project may be locked private by YouTube regardless of the requested privacy status. Upload as `private`, check in Studio, then flip to public manually (or via `update`) if needed. Don't schedule public releases through the API until we've confirmed the project passes YouTube's API audit.
- **Riverside fallback:** if API uploads are blocked or quota-limited, the manual path is unchanged — download from Riverside and upload through YouTube Studio in the browser.
- **Quota:** each upload costs ~1,600 quota units of the default 10,000/day — roughly 6 uploads/day max on default quota.
