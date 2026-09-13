# RevFactor GEO Citation Strategy: 2026-09-13 validation and update

**Validates:** `geo-citation-strategy.md` (built 2026-05-10). **Checked this session:** Peec history export (daily_brand_model.csv to 2026-09-12), ProCloser AI tracker (450 answers, 30d, ChatGPT/Perplexity/Claude), master placement sheet (Order Tracker, Published Tracking, RevFactor tab), backlinks.db, headless-browser renders of every target page named below.

---

## 1. Scorecard: what the May plan promised vs what happened

| Metric (May plan) | Day 90 target | Actual | Verdict |
|---|--:|--:|---|
| Peec visibility (5 scrapers, monthly avg) | 12% | Jul 1.7%, Aug 4.4%, Sep 3.6% | Missed, about a third of target |
| Tracker visibility (new baseline 9/12, 3 API engines) | n/a | 6.2%, #13 of 28 brands | New baseline |
| Source domains citing RevFactor | 15 | 4 verified (techbullion, freewyldfoundry, uprev.co, revfactor.io) | Missed |
| Paid placements live | 6 | 1 (TechBullion, ~$50) | Missed |
| Editorial mentions earned | 7 | 0 | Missed |
| revfactor.io citations (Peec 30d) | not set | 0 in May, 12 in June, 183 in Sept | Big win, own blog is now a cited source |

Per engine today: Perplexity 10.7%, Claude 5.3%, ChatGPT 2.7%. Google AI Mode 3.6% and AI Overview 1.3% on Peec. Commercial prompts 8.6% (#12). Informational prompts 0.0% (#21, Vrbo and PriceLabs lead every one).

## 2. The three "must-land" pages: none landed

| Page | May claim | Verified 2026-09-13 | What happened |
|---|---|---|---|
| HotelTechReport | 391 cites, buy Premium $2K | 0 RevFactor mentions on the RM systems page; Bing site search empty; HTR now 148 cites/30d (rank 16, down 62%) | Pitched 6/24 from federico@revfactorwa.com. No profile, no purchase, no reply. |
| StaySTRA | 158 cites, free pitch | Site search "revfactor" returns nothing; no longer in Peec top 30 | Never pitched (no Order Tracker row). |
| RentalScaleUp | 76 cites, $750 sponsored | Site search returns nothing; not in Peec top 30 | Pitched 6/24 and 6/27. No reply. |

The thesis that these three pages were "~600 citations" is stale. The engines moved on. The pages that now feed the vendor-list prompts are mid-tier listicles, and one of ours already proves the mechanic.

## 3. What actually produced the mentions (tracker, 27 answers naming RevFactor)

| Source cited in RevFactor-naming answers | Answers | Names RevFactor on page? |
|---|--:|---|
| techbullion.com/the-9-best-airbnb-revenue-management-companies-for-2026 | 16 | Yes, #1 spot. Placed 7/30 via Raheel, ~$50 |
| revenuenaire.com/airbnb-revenue-management | 11 | No |
| hostlyft.com/revenue-management | 9 | No |
| gowithsurge.com best-airbnb-management-companies-2026 | 9 | No |
| freewyldfoundry.com/blog/best-str-revenue-management-companies | 6 | Yes, #7 (organic, untracked) |
| uprev.co/best-str-revenue-management-services | 3 | Yes (organic, untracked) |
| fairly.com/blog/best-airbnb-management-companies | 5 | No |
| skift.com 9/1 "AirDNA enters revenue management market" | 4 | No |

One $50 listicle placement drives 16 of 27 mentions and 89 Peec citations. The LinkedIn Pulse listicle (placed 7/9) has 0 citations after 9 weeks. The six Cito web-2.0 links: 2 dead (Weebly 404, Facebook 400), 3 grade D, 1 grade A. They contribute nothing measurable.

## 4. What changed in the market since May

- **AirDNA launched a host dynamic-pricing / revenue management product (Skift, 2026-09-01).** It is already cited in answers to our prompts. Every "vs" and comparison post on the site needs an AirDNA section, and the positioning ("tool vs done-for-you service") gets sharper, not weaker.
- **Wheelhouse (47%) and Vrbo (40%)** are top-3 on the tracker; neither was in the May competitor tier list. Vrbo owns the informational "how do I price / increase occupancy" prompts via its help center.
- **Citation surface shifted to vendor-blog listicles:** hostfully.com airbnb-pricing-tools (139 URL cites/30d), stayfi.com best-dynamic-pricing-software (138), rakidzich.com airbnb-pricing-tools-comparison (106), boringhost.ai (85), triadvacationrentals (67), truvi.com (67), aeve.ai (59), renttools.io. None existed in the May plan.
- **Peec is being replaced** by the in-house tracker (3 API engines, no Google AIO/AI Mode/Copilot, Gemini off pending billing). RevFactor still has 3 live Peec readers (peec-snapshot cron, placement monitor, digitalpr default project) so Peec stays on for RF until they are repointed.

## 5. Updated plan (replaces sections 3, 4, 6 and 8 of the May doc)

### Track A: replicate TechBullion on the pages the engines already retrieve for our prompts
Priority order = pages already cited in answers that name RevFactor but do not list us (the engine is one edit away), then the highest-cited done-for-you listicles.

| # | Page | Why | Path | Est. cost |
|---|---|---|---|---|
| 1 | revenuenaire.com/airbnb-revenue-management | Cited in 11 RF-naming answers, no mention | Inclusion pitch (they are an RM peer; offer reciprocal mention in our listicle) | Free |
| 2 | gowithsurge.com best-airbnb-management-companies-2026 | 9 cites, 11.6% of all answers retrieve gowithsurge | Inclusion or paid | Free to $150 |
| 3 | hostlyft.com/revenue-management | 9 cites | Inclusion | Free |
| 4 | fairly.com best-airbnb-management-companies | 5 cites | Inclusion | Free |
| 5 | stayfi.com best-vacation-rental-dynamic-pricing-software | 138 URL cites/30d, retrieved in 11.6% of answers | Pitch a "done-for-you alternative" section | Free to paid |
| 6 | hostfully.com/blog/airbnb-pricing-tools | 139 URL cites/30d | Same angle (Hostfully is a PMS, not a pricing competitor) | Free |
| 7 | rakidzich.com airbnb-pricing-tools-comparison + done-for-you-airbnb-management-2026 | 106 + retrieved in 12% of answers; was in the May plan, never worked | Avery is a coach; guest quote from Fede | Free |
| 8 | truvi.com/blog/airbnb-pricing-tools | 67 URL cites | Partnership content | Free |
| 9 | chekin, realestatebees, stepbystepbnb, redawning "best airbnb property management" pages | cited 3 to 4x each in RF answers | Inclusion | Free |
| 10 | Vendor-list sites already cited 9 to 10x for our prompts but not listing us (sheet "Backlink-Only & AI Candidates"): getapp.com, cubi.casa, yesassistant.com | DEEPEN rows from 8/21 | Profile submission | Free |
| 11 | Second paid listicle via Raheel / vetted vendor list on a different domain | Diversifies the one source we depend on | Order | ~$50 to $150 |

Drop from the plan: HotelTechReport Premium (share collapsed, no response in 80 days, $2K), StaySTRA and RentalScaleUp (no longer cited), Wikipedia, Skift/PhocusWire sponsored, VRMA newsletter as a citation play (keep the membership only if Fede wants the booth). Also drop web-2.0 mention orders (Medium, Weebly, Strikingly, Smore, 8b): proven invisible.

Budget: $300 to $600 for the quarter instead of $3K to $5K. The one paid placement that worked cost $50.

### Track B: the informational half of the prompt set (21 prompts at 0%)
The own blog gets cited only on "best companies" prompts. Vrbo and PriceLabs own "how do I price for peak season / increase occupancy / know if I am underpriced". The 9/6 weekly-sweep backlog is the fix and it is unimplemented: per-passage source links and "according to X" attributions on the top 5 posts (comp-set guide has 43 failing passages, orphan-nights 32, pillar 28), plus Explore and Create-intent sections. Add one short answer-first post per unowned informational prompt cluster (peak/off-season pricing, underpriced-or-overpriced check, occupancy vs rate) anchored on the first-party orphan-rate benchmark (25% to 11.9%), which is the only stat we own that no competitor can cite.

### Track C: ChatGPT is the laggard (2.7%)
ChatGPT search rides the Bing index. Confirm revfactor.io in Bing Webmaster Tools, IndexNow on every publish, and fix the broken Bing indexed-count check in the weekly sweep (12,500 to 1 to 111,000 on a 17-page site). The `seo-bing-chatgpt` skill is the checklist. Off-site signals Bing weights (LinkedIn, Reddit, G2/GetApp) overlap with Track A row 10.

### Track D: Reddit, still the top UGC source (9.1% of answers, 217 Peec cites/30d)
The 5/16 question to Fede (is his Reddit account 6+ months old with real STR comment history?) was never asked. Decide at the 9/16 sync: Fede warms up personally for 30 to 45 days, or the Cito Reddit pilot ($15 to $30 per thread, still "negotiating" in the Order Tracker) runs on aged accounts. Either way, no link drops; 3 draft cross-posts already exist in `reddit-crosspost-drafts-2026-05-16.md`.

### Track E: AirDNA response (new)
Add AirDNA's new pricing tool to `pricelabs-vs-wheelhouse-vs-done-for-you`, the beginners guide and the tools listicle within two weeks, before the engines settle on a "PriceLabs vs AirDNA" narrative that leaves us out. Same "tool vs service" framing.

### Measurement reset
- Baseline = tracker 6.2% (week to 9/12). Targets: 10% at 30 days, 15% at 60, 20% at 90; ChatGPT to 8%; informational slice above 0; source domains naming RevFactor from 4 to 10.
- Fix the prompt tags in `config/revfactor.json`: 21 prompts are tagged "branded" but contain no brand name, so the branded/non-branded slice on the dashboard is wrong.
- Keep the RevFactor Peec project until the 3 readers are repointed; Peec is the only view of Google AI Overview and AI Mode.
- Placement monitor already checks TechBullion and the LinkedIn post; add freewyldfoundry and uprev.co rows to Published Tracking so organic wins are tracked too.

## 6. Housekeeping
- RevFactor pitch cron (Render crn-d7lss6m7r5hc739l5gb0) is suspended; the May plan counted on it for 5 to 10 placements a quarter. Retire it or fold the STR angles into digitalpr-app; decide, do not leave it half-on.
- Cito web-2.0 links: 2 dead. Do not reorder.
- Outreach from 6/24 (hospitalitynet, phocuswire, vrmb, internationalhospitality.media): closed, no replies after 2 sends. VRMA membership thread still open (booth pitch).
