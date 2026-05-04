er# Google Ads — Monday launch walkthrough (current UI, May 2026)

**Account:** RevFactor.io (`534-263-5272`) under MCC `Demand Gen MCC` (`822-696-7901`)
**Live state pulled via API:** 2026-05-02
**UI version:** 5-section left-nav (Campaigns · Goals · Tools · Billing · Admin) — the old gear-icon "Tools & Settings" menu was retired in 2024.

---

## Live state right now (verified)

| Item | Status |
|---|---|
| `RF — Search — Tool Intent` ($16/day) | **PAUSED** — 3 ad groups · 5 RSAs each · 6 neg lists · 4 sitelinks + 6 callouts + 2 snippets ✅ |
| `RF — Search — Consultant Intent` ($14/day) | **PAUSED** — same scaffolding ✅ |
| `RF — Search — Competitor Conquest` ($10/day) | **PAUSED** — same scaffolding ✅ |
| `Campaign #1` Performance Max ($167.34/day) | **PAUSED** — auto-generated placeholder, **REMOVE BEFORE MONDAY** |
| Conversion actions | 7 enabled, **all 7 marked Primary** ❌ — fix in Step 1 |
| Account-default goals | All 6 categories biddable ❌ — fix in Step 1 |
| Enhanced conversions | OFF (`accepted_customer_data_terms = False`) ❌ — fix in Step 2 |
| `Strategy Call Booked` | $1,500 value, BOOK_APPOINTMENT category — what we optimize for |

Two near-duplicate conversions exist (`Submit lead form` codeless + `Lead form - Submit` LEAD_FORM_SUBMIT). Pick one as Secondary, archive the other in Step 1.

---

## How the new UI is laid out (orientation, 30s read)

After signing into https://ads.google.com and selecting **RevFactor.io**, the left rail has 5 icons (top to bottom):

- **Campaigns** (megaphone) — campaigns, ad groups, ads, keywords, search terms, audiences, change history
- **Goals** (target/dart) — conversions, conversion goals, Settings (where Enhanced Conversions lives)
- **Tools** (wrench) — Data manager, Shared library (neg lists, audience lists), Bid strategies, Asset library, Planning (Keyword Planner, Reach Planner)
- **Billing** ($)
- **Admin** (gear) — account access, security, account preferences

There is no "gear icon → Tools & Settings" anymore. If a guide tells you to click a top-right gear, it's pre-2024 and wrong.

---

## Step 0 — Delete the placeholder Pmax campaign

`Campaign #1` is a Performance Max sitting at $167/day, paused, leftover from account creation. If it ever gets enabled it'll burn ~$5K/month with no ad copy or targeting.

1. **Campaigns** (left rail) → **Campaigns** view
2. Status filter: include "Paused"
3. Click `Campaign #1`
4. Top-right **⋮** (three-dot) menu → **Remove**
5. Confirm

---

## Step 1 — Make `Strategy Call Booked` the only Primary conversion

**Why:** All 7 conversions are Primary right now. Smart Bidding will optimize for whichever fires fastest (Page View, Blog Read), not bookings. Booking ($1,500 value) is what we want.

### 1a — Set Primary/Secondary at the goal level

1. **Goals** icon (left rail) → **Summary**
2. Click the **Goals** tab (next to "Summary" at the top of the workspace)
3. You'll see goal cards grouped by category (Submit lead form · Phone calls · Page view · Book appointment · Engagement · Lead form submission)
4. For every goal card EXCEPT **Book appointment**:
   - Click **Edit goal** on the card
   - Expand the **Conversion action optimization** section
   - In the "Action optimization" column, change every action to **Secondary (observe only)**
   - Expand the **Account default** section
   - Toggle OFF **Make this an account-default goal**
   - **Save**
5. On the **Book appointment** goal:
   - **Edit goal**
   - Confirm `Strategy Call Booked` is set to **Primary**
   - Confirm **Make this an account-default goal** is ON
   - **Save**

### 1b — Archive the duplicate

Still on **Goals → Summary** tab:
1. Find `Submit lead form` (the codeless one — its Source column will say "Website")
2. Click it → top-right **⋮** → **Archive** (keep `Lead form - Submit` which is the LEAD_FORM_SUBMIT type)

**Success check:** Goals tab shows **Book appointment** as the only goal card with the "Account-default" badge. `Strategy Call Booked` is the lone Primary action across the account.

---

## Step 2 — Turn on Enhanced Conversions

**Why:** Hashes booking-form email/phone so Google can match converters to logged-in users. +5–15% attribution lift.

**Note (2026 UI change):** Google merged the per-action enhanced conversions toggle into a single **account-level Settings** panel earlier this year. You no longer turn it on per-conversion — one switch covers everything.

1. **Goals** icon (left rail) → **Settings** (sub-item under Goals)
2. Expand the **Enhanced conversions** section
3. Check **Turn on enhanced conversions**
4. Review and **accept** the customer-data terms
5. Data source dropdown → select **Google tag** (NOT Google Tag Manager — schedule.revfactor.io fires gtag directly)
6. **Save**

**Success check:** Settings panel header shows "Enhanced conversions: On". When you visit `Strategy Call Booked` later, the Enhanced conversions section there will show "Active" or "No recent data" (which is fine — it'll fill once a real booking fires).

---

## Step 3 — Link Google Ads ↔ GA4

**Why:** Imports GA4 audiences (Blog Readers, Pricing Page Visitors) for remarketing + sends GA4 events as a backup signal to Smart Bidding.

**Note (2026 UI change):** Linked Accounts moved from `Tools → Setup → Linked accounts` to `Tools → Data manager`. Same operation, new home.

1. **Tools** icon (left rail) → **Data manager**
2. Click **+ Connect product**
3. Under "Data source" → choose **Google Analytics (GA4) & Firebase**
4. Click **Next**
5. "Link Setup" → find property `RevFactor – GA4` (`G-1CTGBJ9RLK`)
6. Toggle ON: **Site link** · **Conversion import** · **Audience import** · **View metrics in Ads**
7. Click **Link**

**Success check:** Data manager → Connections list shows GA4 property as **Linked**. Data sync starts within 24h.

---

## Step 4 — Spot-check the 3 PAUSED campaigns

1. **Campaigns** icon → **Campaigns** view → status filter includes "Paused"
2. For each campaign, click in and verify:

| Campaign | Daily budget | Final URL | Ad groups |
|---|---|---|---|
| `RF — Search — Tool Intent` | $16 | `/airbnb-pricing-strategy` | airbnb-pricing-tool-exact, airbnb-pricing-tool-phrase, dynamic-pricing-tools-broad |
| `RF — Search — Consultant Intent` | $14 | `/short-term-rental-consultant` | airbnb-consultant-exact, str-consultant-phrase, vacation-rental-consultant-broad |
| `RF — Search — Competitor Conquest` | $10 | `/vs/pricelabs` (PriceLabs AG); `/short-term-rental-consultant` (Beyond + Wheelhouse AGs) | beyond-pricing-conquest, pricelabs-conquest, wheelhouse-conquest |

3. Inside each campaign:
   - **Ad groups** sub-page → **Ads** column → each ad group should show **5 RSAs**
   - **Settings** sub-page → confirm **Locations: United States** · **Languages: English**
   - **Audiences, keywords and content** → **Negative keywords** sub-tab → 6 shared lists attached: Job/career seekers · Wrong industry · Geographic exclusions · Free/cheap/DIY · Wrong audience (guests not hosts) · Tutorial/informational
   - **Assets** sub-page → 4 sitelinks · 6 callouts · 2 structured snippets

If any RSA shows Ad Strength below "Good", message me — I'll regenerate via API rather than UI clicks.

---

## Step 5 — Saturday: real test booking (BEFORE flipping campaigns ON)

This is the only way to confirm the conversion path works end-to-end before spending real money.

1. Open https://www.revfactor.io/short-term-rental-consultant in **incognito**
2. DevTools → **Network** tab → filter `googleadservices`
3. Scroll to `#schedule` → pick date/time → fill form (`TEST` in name, your real email)
4. **Submit** → cancel from the email after so it doesn't waste a real slot
5. In Network tab, look for a request to `https://www.googleadservices.com/pagead/conversion/18106897053/...` — that's the conversion ping

Within 24–48h, **Goals → Conversions → `Strategy Call Booked`** should flip from "No recent conversions" to **"Recording conversions"** with count = 1.

**If it doesn't fire:** schedule.revfactor.io's gtag isn't sending the event. Per my session notes the conversion fires inside `setStep('confirmed')`, not via postMessage — so Fede's app needs the gtag conversion snippet inside that handler. Email Fede the snippet (you have it from prior session).

---

## Step 6 — Monday morning: flip them ON

When Steps 0–5 all pass:

1. **Campaigns** → tick `RF — Search — Tool Intent` (highest budget = best signal first)
2. Top action bar → **Edit** dropdown → **Enable**
3. Open the campaign → **Insights and reports** → **Real-time** for the first hour
   - Look for: impressions firing, no policy errors, search terms making sense
4. After 2–3 hours of clean delivery, enable **Consultant Intent**, then **Competitor Conquest**
5. **Don't touch CPC bids for 7–10 days** — Smart Bidding needs baseline data before manual changes help

---

## Still pending from prior session

- **Image extensions** — `crop_for_ads.py` was written to crop the 5 RevFactor heroes into 1.91:1 landscape + 1:1 squares (15 crops total). Not yet run. Image extensions improve CTR ~5–10%, optional for launch. Run via `python3 crop_for_ads.py` — I'll show you the crops before any upload.

---

## API state-check command

To re-verify any of this between now and Monday, run:

```bash
cd /Users/aaronwhittaker/Claude/google-ads
python3 -c "
from pathlib import Path
from google.ads.googleads.client import GoogleAdsClient
c = GoogleAdsClient.load_from_storage('google-ads.yaml', version='v24')
svc = c.get_service('GoogleAdsService')
for r in svc.search(customer_id='5342635272', query='SELECT campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.status != \"REMOVED\"'):
    print(f'[{r.campaign.status.name}] {r.campaign.name} \${r.campaign_budget.amount_micros/1e6:.2f}/day')
"
```
