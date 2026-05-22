# Set up revfactor.io as a verified sending domain in Resend

**Why:** Right now the Discovery Call API endpoint (`api/discovery-lead.ts`) can't fire from `notifications@revfactor.io` because Resend has the domain status as `not_started`. Every send to anyone other than the account owner returns HTTP 403. Today's sample emails landed via the fallback `onboarding@resend.dev`; we need the proper revfactor.io sender to launch.

**Time:** ~10 minutes hands-on + 5–60 min DNS propagation.

---

## Step 1 — Pull the current required DNS records from Resend

The DKIM/SPF/DMARC values rotate per Resend account, so grab the live values rather than relying on the older doc.

1. Sign in at https://resend.com/login (account: `aaron@procloser.ai`).
2. Sidebar → **Domains** → `revfactor.io`.
3. The page shows the four records Resend wants. Keep this tab open.

The records should look like the table below (the **Value for `resend._domainkey`** is the unique-per-account string you actually need — copy what Resend shows, not the one in the older doc):

| Type | Host | Value | Priority |
|---|---|---|---|
| TXT (DKIM) | `resend._domainkey` | *(the long `p=MIG...` string Resend gives you)* | — |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` |
| TXT (SPF) | `send` | `v=spf1 include:amazonses.com ~all` | — |
| TXT (DMARC) | `_dmarc` | `v=DMARC1; p=none;` | — |

---

## Step 2 — Add the records in Namecheap

1. https://ap.www.namecheap.com/Domains/DomainControlPanel/revfactor.io/advancedns
2. **Advanced DNS** tab.
3. **Add New Record** for each of the four rows above:
   - DKIM TXT: Type `TXT Record`, Host `resend._domainkey`, Value = paste, TTL `Automatic`.
   - SPF MX: Type `MX Record`, Host `send`, Value `feedback-smtp.us-east-1.amazonses.com`, Priority `10`, TTL `Automatic`.
   - SPF TXT: Type `TXT Record`, Host `send`, Value `v=spf1 include:amazonses.com ~all`, TTL `Automatic`.
   - DMARC TXT: Type `TXT Record`, Host `_dmarc`, Value `v=DMARC1; p=none;`, TTL `Automatic`.
4. Save.

**Conflict check:** if Namecheap already has an SPF TXT on `@` (apex), don't blow it away. The `send` subdomain SPF is separate and lives on `send` — no conflict with the apex SPF.

---

## Step 3 — Trigger verification in Resend

1. Back at https://resend.com/domains, click into `revfactor.io`.
2. Click **Verify DNS records** at the top of the page.
3. Each record will flip to ✅ as Resend's checker confirms propagation. DKIM tends to verify fastest (under a minute). MX + SPF + DMARC sometimes take 30–60 min on Namecheap.

**Verify from terminal while waiting:**

```bash
# DKIM
dig +short TXT resend._domainkey.revfactor.io

# SPF MX
dig +short MX send.revfactor.io

# SPF TXT
dig +short TXT send.revfactor.io

# DMARC
dig +short TXT _dmarc.revfactor.io
```

Each should return the value you set. If `dig` returns empty, propagation hasn't finished — wait 5–10 min and retry.

**Verify via Resend API:**

```bash
RESEND_KEY=$(security find-generic-password -a "$USER" -s resend -w)
curl -s -H "Authorization: Bearer $RESEND_KEY" "https://api.resend.com/domains" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); [print(f\"{x['name']}  status={x['status']}\") for x in d['data']]"
```

Status `verified` = ready. Status `not_started` or `pending` = still propagating.

---

## Step 4 — Add `RESEND_API_KEY` to Vercel

The Discovery Call API endpoint reads `RESEND_API_KEY` from the Vercel environment. Currently unset, so the endpoint stores leads in Supabase but skips the notification email.

1. https://vercel.com/dashboard → `revfactor` project (`federzimer/revfactor`).
2. **Settings** → **Environment Variables**.
3. **Add New** —
   - Name: `RESEND_API_KEY`
   - Value: paste the key from `security find-generic-password -a "$USER" -s resend -w` (starts `re_Bc...`)
   - Environments: ✅ **Production**, ✅ **Preview**, ✅ **Development**.
4. Save.
5. Redeploy: **Deployments** → latest `cluster-builds-2026-05-15` deploy → **⋯** → **Redeploy** (or push any commit to the branch to trigger a new build).

**Optional overrides** — same Environment Variables panel:
- `DISCOVERY_NOTIFY_TO` — comma-separated recipient list. Default if unset: `aaron@procloser.ai,federico@blackbirdhm.com`.
- `DISCOVERY_NOTIFY_FROM` — sender. Default if unset: `RevFactor <notifications@revfactor.io>`.

---

## Step 5 — Smoke-test the deployed endpoint

Once Vercel redeployed AND the domain is `verified` in Resend:

```bash
curl -sS -X POST "https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/api/discovery-lead" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test+nopath@procloser.ai",
    "hasProperty": false,
    "source": "smoke-test",
    "pageUrl": "https://www.revfactor.io/"
  }'
```

Expected response: `{"ok":true}` (HTTP 200). Within ~5 seconds you should see a notification email arrive at `aaron@procloser.ai` (and `federico@blackbirdhm.com` if you didn't override `DISCOVERY_NOTIFY_TO`) from `notifications@revfactor.io`, with subject `RevFactor lead (no property yet) — test+nopath@procloser.ai`.

Repeat with the PM-company payload:

```bash
curl -sS -X POST "https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/api/discovery-lead" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test+pm@procloser.ai",
    "hasProperty": true,
    "isPM": true,
    "source": "smoke-test",
    "pageUrl": "https://www.revfactor.io/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/"
  }'
```

Subject should land: `RevFactor lead (PM company) — test+pm@procloser.ai`.

Also verify the row landed in Supabase:

```bash
# (via Supabase CLI or dashboard — table is public.discovery_leads in project revfactor-analysis-log / dvzqphrzzhbjfcctyksw)
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| API returns `{"ok":true}` but no email | `RESEND_API_KEY` not set in Vercel | Re-check Step 4 |
| API returns `{"ok":true}` but no email AND Vercel logs show `resend notify failed 403` | revfactor.io not yet verified | Re-check Step 3 |
| `dig` returns empty for `resend._domainkey.revfactor.io` | Namecheap record not saved or still propagating | Re-save the record in Namecheap; wait 10 min |
| Email arrives but lands in spam | DMARC not yet propagated | Wait an hour; if still spam, tighten DMARC to `p=quarantine; rua=mailto:postmaster@revfactor.io` |
| Resend domain shows `temporary_failure` after verification | Domain was added in wrong region or has an old DKIM record stuck | Delete + re-create the Resend domain entry; re-add Namecheap TXT |

---

## After verification

- Delete this doc (or move to `docs/_archive/`) once it's all set up.
- Confirm both `aaron@procloser.ai` and `federico@blackbirdhm.com` see the test emails. If Fede sees nothing, check his spam folder or add an inbox filter.
- The same Resend domain enables the existing newsletter sender (`scripts/newsletter/`) which is currently using `onboarding@resend.dev` as a fallback. Once verified you can swap the newsletter `from` to `journal@revfactor.io`.
