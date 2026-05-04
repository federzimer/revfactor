# Google Ads tools — RevFactor

Python + Node tools for managing the RevFactor Google Ads account via API.

## What lives here

| File | Purpose |
|---|---|
| `daily_digest.py` | Daily PPC summary — yesterday vs 7d baseline, search-term anomalies, low-QS keywords, recommendations. Designed to run as a Render cron. |
| `add_negative_keyword.py` | Add a search term to one of the 6 shared negative-keyword lists. |
| `add_rsa_variants.py` | Bulk-create new RSAs across all RF ad groups. |
| `add_structured_snippets.py` | Create + attach structured snippet assets to all 3 campaigns. |
| `cleanup_dupes.py` | Pause duplicate ad groups + remove duplicate negative-list attachments. |
| `cleanup_campaigns.py` | **Destructive** — removes all `RF — Search — *` campaigns. Use with care. |
| `deploy_campaigns.py` | Idempotent deployer for the 3 RF search campaigns from `campaigns_config.py`. |
| `complete_tool_intent.py` | Adds missing pieces to a partial Tool Intent campaign. |
| `consultant_intent_live.py` | Same for Consultant Intent. |
| `check_test_conversion.py` | Verify a test conversion landed in Google Ads (used by the Slack cron). |
| `check_ga4_link.py` | Confirm GA4 ↔ Google Ads link state. |
| `check_labels.py` | Audit conversion-action labels match expectations. |
| `mint_refresh_token.py` | One-time OAuth flow to mint the refresh token in `google-ads.yaml`. |
| `test_connection.py` | Quick sanity check that creds work. |
| `keyword_research.py` / `keyword_research_ahrefs.py` | Keyword discovery via Google Ads + Ahrefs APIs. |
| `crop_for_ads.py` | Crop hero images to 1.91:1 + 1:1 for image extensions. |
| `capture_guide_screenshots.js` | Pull help-doc screenshots for the launch walkthrough. |

## Setup (per machine)

These files are **NOT** committed to git (gitignored):

- `google-ads.yaml` — Google Ads API creds (developer token, OAuth refresh token, etc.)
- `oauth_client.json` — OAuth client config (used to mint refresh tokens)

To set up on a new machine:

```bash
# 1. Copy the secrets from another machine via secure channel (1Password / GPG).
#    DO NOT paste into chat or git. Save as:
scripts/google-ads/google-ads.yaml
scripts/google-ads/oauth_client.json

# 2. Install Python deps (use whichever env you prefer; happy path is venv):
cd scripts/google-ads
python3 -m venv .venv
source .venv/bin/activate
pip install google-ads
```

## Running

All scripts assume CWD is `scripts/google-ads/` so the relative `google-ads.yaml` path resolves. From the repo root:

```bash
cd scripts/google-ads
python3 daily_digest.py            # dry-run, prints to stdout
python3 daily_digest.py --post     # posts to Slack (needs SLACK_WEBHOOK_URL)
```

Override the yaml path via env if you keep secrets elsewhere:

```bash
GOOGLE_ADS_YAML_PATH=~/.config/google-ads.yaml python3 daily_digest.py
```

## Deploying daily_digest as a Render cron

```bash
RENDER_API_KEY=rnd_s441HjXbCxVh9Ye57TT3xfmTpdSW
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "cron_job",
    "name": "revfactor-daily-digest",
    "schedule": "0 14 * * *",
    "rootDir": "scripts/google-ads",
    "buildCommand": "pip install google-ads",
    "startCommand": "python3 daily_digest.py --post",
    "repo": "https://github.com/federzimer/revfactor",
    "branch": "main",
    "envVars": [
      {"key": "SLACK_WEBHOOK_URL", "value": "<from-Slack-app-config>"},
      {"key": "GOOGLE_ADS_YAML_PATH", "value": "/etc/secrets/google-ads.yaml"},
      {"key": "CLICKCEASE_API_KEY", "value": "<after-signup>"}
    ]
  }'
```

Note: Render expects secrets-file uploads via the dashboard — paste the `google-ads.yaml` contents into "Secret Files" with mount path `/etc/secrets/google-ads.yaml`.

## Account references

- **MCC:** `Demand Gen MCC` (`822-696-7901`)
- **Account:** RevFactor.io (`534-263-5272`)
- **Project ID (GrowthBook):** `prj_19g6rmokoa10p`
- **GA4 property:** `G-1CTGBJ9RLK`
- **Google Ads conversion ID:** `AW-18106897053`
- **Strategy Call Booked label:** `WkHxCOKD46McEJ2lhbpD`

## Conversion paths

- Browser-side: `gtag('event', 'book_strategy_call', {...})` fires inside the schedule.revfactor.io iframe when `setStep('confirmed')` runs. Verified live in the compiled JS.
- Server-side (planned): Fede's scheduler backend POSTs to Google Ads' Offline Conversions API on each booking confirm. Pending — drafted email in `MONDAY_LAUNCH_WALKTHROUGH.md`.
