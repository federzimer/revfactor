"""One-time OAuth flow to mint a refresh token for the Google Ads API.

Opens the browser, you log in as aaron@thriveagency.com and grant the
'adwords' scope, the script captures the auth code via a localhost
callback, exchanges it for a refresh token, and writes the full
google-ads.yaml config that the google-ads-python client library expects.

Requires GOOGLE_ADS_DEVELOPER_TOKEN in the environment — see ~/.config/flightdeck/revfactor-ads.env
"""

import os
from pathlib import Path
import yaml
from google_auth_oauthlib.flow import InstalledAppFlow

HERE = Path(__file__).parent
CLIENT_SECRETS_FILE = HERE / "oauth_client.json"
OUTPUT_YAML = HERE / "google-ads.yaml"

DEVELOPER_TOKEN = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN", "")
if not DEVELOPER_TOKEN:
    raise SystemExit(
        "Missing GOOGLE_ADS_DEVELOPER_TOKEN env var — source ~/.config/flightdeck/revfactor-ads.env"
    )
LOGIN_CUSTOMER_ID = "8226967901"

SCOPES = ["https://www.googleapis.com/auth/adwords"]


def main():
    flow = InstalledAppFlow.from_client_secrets_file(
        str(CLIENT_SECRETS_FILE),
        scopes=SCOPES,
    )
    creds = flow.run_local_server(
        port=0,
        prompt="consent",
        access_type="offline",
        authorization_prompt_message=(
            "Opening browser to authorize Google Ads API access. "
            "Sign in as aaron@thriveagency.com and click Allow."
        ),
    )

    config = {
        "developer_token": DEVELOPER_TOKEN,
        "client_id": flow.client_config["client_id"],
        "client_secret": flow.client_config["client_secret"],
        "refresh_token": creds.refresh_token,
        "login_customer_id": LOGIN_CUSTOMER_ID,
        "use_proto_plus": True,
    }
    OUTPUT_YAML.write_text(yaml.safe_dump(config, sort_keys=False))
    OUTPUT_YAML.chmod(0o600)
    print(f"\nWrote {OUTPUT_YAML}")
    print(f"Refresh token: {creds.refresh_token[:20]}... (truncated)")


if __name__ == "__main__":
    main()
