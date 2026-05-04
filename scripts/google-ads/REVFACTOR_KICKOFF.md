# RevFactor Google Ads — Kickoff Checklist

**Status as of 2026-04-27:** Basic Access live. All 3 search campaigns deployed in PAUSED state. Conversion tracking wired. Landing pages shipped.

This is the punch list to flip campaigns on.

---

## ✅ Done (auto-deployed via API + code)

| Item | Detail |
|---|---|
| 5 conversion actions | Created in Google Ads. Labels in `conversion_labels.json`. |
| gtag conversion firing | BaseLayout.astro listens for Cal.com `bookingSuccessful` postMessage event globally — fires `Strategy Call Booked` ($1,500) and GA4 `strategy_call_booked` event. |
| tel: click conversion | Global click handler on `a[href^="tel:"]` fires `Phone Click` ($100). |
| 6 negative keyword lists | Account-level shared sets, 6 themes (free/job/guest/tutorial/wrong-industry/geo). |
| 3 PAUSED campaigns | Tool Intent ($16/day), Consultant Intent ($14/day), Conquest ($10/day) — total $40/day = $1,200/mo budget. |
| 9 ad groups + 9 RSAs | Per blueprint §3-4. Headlines + descriptions within Google length limits, no `→` characters, no competitor TM in conquest copy. |
| 42 keywords | Mix of EXACT (high-bid), PHRASE (medium), BROAD (low) per ad group. |
| 4 sitelinks + 6 callouts | Account-level shared assets, attached to all 3 campaigns. |
| 3 PPC landing pages | `/airbnb-pricing-strategy`, `/short-term-rental-consultant`, `/vs/pricelabs` deployed via Vercel from main branch (commit `b75729e`). |
| US geo + English language | Applied to all 3 campaigns. |
| Search-only network | Display + partner search disabled. |

---

## 🟡 Manual UI steps needed before flipping ON

These can't be done via API or are easier in the UI:

### 1. Verify pages are live (5 min)
After Vercel deploys (auto on push), check:
- https://www.revfactor.io/airbnb-pricing-strategy
- https://www.revfactor.io/short-term-rental-consultant
- https://www.revfactor.io/vs/pricelabs

Click the "Schedule" CTA on each — verify the modal opens with the Cal.com iframe.

### 2. Test the conversion firing end-to-end (5 min)
1. Open `/airbnb-pricing-strategy` in an incognito window
2. Click "Schedule a free 30-min call"
3. Open browser DevTools → Network tab → filter for `googleadservices` or `google-analytics`
4. Book a test slot (or step through Cal.com flow)
5. After booking, you should see a request to `https://www.googleadservices.com/pagead/conversion/...` fire — that's the conversion ping
6. In Google Ads → Tools → Conversions → "Strategy Call Booked", the status should change from "No recent conversions" to "Recording conversions" within 24-48 hours

### 3. Link Google Ads ↔ GA4 (3 min)
- Go to **Google Ads → Tools → Linked accounts → Google Analytics 4 properties**
- Find `RevFactor – GA4` (G-1CTGBJ9RLK) → click **Link**
- Enable: site-link, conversion import, audience import, view metrics

This auto-imports GA4 audiences (Blog Readers, Pricing Page Readers, etc.) to Google Ads for remarketing.

### 4. Enable Enhanced Conversions (2 min)
- Google Ads → **Tools → Conversions → Strategy Call Booked**
- Scroll to **Enhanced Conversions** section
- Toggle ON, choose **Google tag** as the source
- Save. (Cal.com sends hashed email/phone in the booking event; gtag will pass it through.)

### 5. Configure Cal.com confirmation redirect (optional, 2 min)
The postMessage listener already fires conversions inside the iframe. But for redundancy, you can also configure Cal.com to redirect to a thank-you page after booking:
- schedule.revfactor.io → Event types → "Strategy Call" → Advanced → Redirect on success: `https://www.revfactor.io/?call=booked`
- The query param can be used by GA4 to fire a conversion-confirmed event if the iframe listener somehow misses.

### 6. Review the 3 paused campaigns in the Google Ads UI (10 min)
Open each campaign — verify:
- Daily budget matches blueprint ($16, $14, $10)
- Ad groups have keywords + 1 RSA each (Ad strength should be ≥ Average; ideally Good/Excellent)
- Negative keyword lists are attached (6 lists)
- Final URLs point to the right landing page (Tool→`/airbnb-pricing-strategy`, Consultant→`/short-term-rental-consultant`, Conquest→`/vs/pricelabs`)
- Geo = US, Language = English

### 7. Flip the conversions to "Primary" (1 min)
After Enhanced Conversions is on:
- Google Ads → Tools → **Conversion goals**
- Move "Strategy Call Booked" to a **Primary goal** for Account default
- Move the other 4 to **Secondary goals**

(Couldn't do this via API in v24 — `primary_for_goal` is now managed via CustomerConversionGoal which has stricter access rules.)

### 8. Flip campaigns ON (1 min)
Once steps 1-7 look good, set each campaign Status: **ENABLED**. Start with Tool Intent first since it has the highest budget; check spend + impression delivery for 24 hours before flipping the others.

---

## 📊 Week 1 monitoring

Check daily for the first 7 days:
- **Search terms report** (Google Ads → Insights → Search terms): every term that triggered an ad. Anything irrelevant → add as negative keyword to the campaign or shared list.
- **Quality Score** on top 5 keywords: < 5 = bad. Review landing page relevance + ad copy.
- **Cost per booked call**: target < $200 in month 1.
- **Disapproved ads**: Google sometimes flags policy issues post-creation. Look for "Disapproved" or "Limited" status.

Auto-rules to set in UI (Tools → Bulk actions → Rules):
- Pause keyword if 0 conversions after 100 clicks (run daily)
- Email me if any campaign hits >150% target CPA over 7 days

---

## 🚨 Known gaps (work for later)

- **Performance Max + Remarketing campaigns** intentionally held until Month 2-3 per blueprint.
- **Lead magnet** for the "Lead Magnet Download" conversion doesn't exist yet — that conversion action is created but unwired.
- **Schema review** for the 3 PPC landing pages — currently only BreadcrumbList. Consider adding LocalBusiness/Service or FAQPage schema for rich results.
- **A/B test plan**: only 1 RSA per ad group right now. After 14 days of data, add a 2nd RSA variant with different angles for Google to rotate.

---

## 🛠 Repo locations

- **Toolkit**: `/Users/aaronwhittaker/Claude/google-ads/`
  - `campaigns_config.py` — keywords, ads, budgets (edit + rerun deployer)
  - `deploy_campaigns.py` — idempotent deployer
  - `cleanup_campaigns.py` — destructive: removes all `RF — Search — *` campaigns
  - `complete_tool_intent.py` — adds missing pieces to existing partial campaign
  - `conversion_labels.json` — tag snippet labels
- **Landing pages**: `/Users/aaronwhittaker/Claude/RevFactor/src/pages/`
  - `airbnb-pricing-strategy.astro` (Tool Intent)
  - `short-term-rental-consultant.astro` (Consultant Intent)
  - `vs/pricelabs.astro` (Conquest)
- **Shared component**: `src/components/PPCLanding.jsx`
- **Conversion firing**: `src/layouts/BaseLayout.astro` (postMessage + tel: listeners)
