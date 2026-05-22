"""Invite Federico (federico@blackbirdhm.com) as an ADMIN user on the RevFactor
Google Ads account (CID 5342635272, manager 8226967901).

Per Aaron 2026-05-21 call — Federico needs admin access so he can monitor
conversion tracking, view campaigns, and continue ad operations after Aaron
hands off. Sends a real invitation email to the Gmail address; Federico
clicks the accept link in the email to gain access.

Run once. The invitation is idempotent — if Fede has already been invited or
accepted, Google Ads returns an error we surface in the response.
"""

from google.ads.googleads.client import GoogleAdsClient
import os, sys

YAML_PATH = os.path.join(os.path.dirname(__file__), "google-ads.yaml")
CID = "5342635272"
EMAIL = "federico@blackbirdhm.com"
ROLE = "ADMIN"  # ADMIN | STANDARD | READ_ONLY | EMAIL_ONLY

def main():
    client = GoogleAdsClient.load_from_storage(YAML_PATH)
    svc = client.get_service("CustomerUserAccessInvitationService")
    op = client.get_type("CustomerUserAccessInvitationOperation")
    invite = op.create
    invite.email_address = EMAIL
    invite.access_role = client.enums.AccessRoleEnum[ROLE]
    try:
        res = svc.mutate_customer_user_access_invitation(
            customer_id=CID,
            operation=op,
        )
        print(f"✓ Invitation sent.")
        print(f"  Resource: {res.result.resource_name}")
        print(f"  Email   : {EMAIL}")
        print(f"  Role    : {ROLE}")
        print(f"  Customer: {CID}")
        print("\nFede will receive an email titled 'You've been invited to a")
        print("Google Ads account.' Tell him to click the accept link and use")
        print("his federico@blackbirdhm.com Google account.")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
