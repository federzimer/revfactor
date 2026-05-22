# Invite Federico to Google Ads — manual UI steps

**Why this is a manual step:** I tried to send the invitation programmatically via the Google Ads API (`scripts/google-ads/invite_federico_admin.py`), but the OAuth refresh token returned `USER_PERMISSION_DENIED` on the `access_role` field. Adding users to a Google Ads account is restricted to a user already at ADMIN or STANDARD-with-grant level on the account, and the refresh token in `google-ads.yaml` doesn't have that grant. So Aaron does this part in the UI.

**Time:** 2 minutes.

---

## Steps

1. Open https://ads.google.com/aw/users (signs you in with the Google account that owns RevFactor's Ads account). If you have multiple Ads accounts, the URL drops you into the user-management page of the currently-selected account.

2. Confirm the top-left shows **RevFactor** (customer ID `5342635272`). If it shows the manager account (`8226967901` / your MCC), click the account-switcher and pick the RevFactor child account.

3. Top-right: click **+ Add user**.

4. Form:
   - **Email**: `federico@blackbirdhm.com`
   - **Access level**: **Admin** (or **Standard** if you want him able to edit campaigns but not invite further users — Admin is the cleaner default per the 2026-05-21 call)
   - Leave email notifications on so Federico gets the invite email.

5. Click **Send invitation**.

6. Federico receives a Gmail titled "You've been invited to a Google Ads account." He clicks the link and signs in with his `federico@blackbirdhm.com` Google account to accept.

---

## Confirm the invite landed

After clicking Send, the user-list should show Federico with status **Pending**. Once he accepts, it flips to **Active**.

You can also confirm via API:

```bash
cd /Users/aaronwhittaker/Claude/RevFactor
python3 -c "
from google.ads.googleads.client import GoogleAdsClient
c = GoogleAdsClient.load_from_storage('scripts/google-ads/google-ads.yaml')
svc = c.get_service('GoogleAdsService')
q = 'SELECT customer_user_access_invitation.email_address, customer_user_access_invitation.access_role, customer_user_access_invitation.invitation_status FROM customer_user_access_invitation'
for row in svc.search(customer_id='5342635272', query=q):
    inv = row.customer_user_access_invitation
    print(f\"{inv.email_address}  {inv.access_role.name}  {inv.invitation_status.name}\")
"
```

---

## If the API call to verify also fails

Same root cause as the invite call: the refresh token's user is not at Admin level. To fix the token long-term, you'd need to re-run the OAuth flow signed in as the Admin user of the RevFactor account, then replace `refresh_token` in `scripts/google-ads/google-ads.yaml`. Not blocking — we can keep using the current token for read + write operations the script already does (it writes RSAs, structured snippets, negative keywords, etc.), just not user-management.
