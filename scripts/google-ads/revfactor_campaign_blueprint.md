work # RevFactor — Google Ads Campaign Blueprint

**Drafted:** 2026-04-27 · **Author:** Aaron + Claude
**Status:** Pending Basic Access approval (case 22959839887, submitted 4/24)
**Account:** RevFactor.io (`534-263-5272`) under MCC `Demand Gen MCC` (`822-696-7901`)
**Conversion tag deployed:** `AW-18106897053` (commit 208dc7b on `add-google-ads-gtag` branch)

---

## TL;DR — the play

RevFactor is a high-touch revenue-management consultancy in a market dominated by *tools* (PriceLabs, Wheelhouse, Beyond Pricing). The campaign strategy:

1. **Outbid the tools on their own keywords** with a positioning angle that reframes the category — "the strategist behind the algorithm."
2. **Own the high-intent consultant terms** that match RevFactor's actual offering — small volume but high LTV.
3. **Conquest competitor brand searches** for cheap, high-intent traffic.
4. **Remarket aggressively** to anyone who opened the strategy-call modal but didn't book.

Test budget: **$1,200/mo for 60 days** (≈$40/day), expecting 5-12 booked calls. Then either scale or kill based on CAC.

---

## 1. Conversion actions

| Action | Type | Value | Trigger |
|---|---|---:|---|
| **Strategy Call Booked** *(PRIMARY)* | Lead form | $1,500 | Cal.com confirmation event on `schedule.revfactor.io` |
| Strategy Call Page View | Page view | $50 | `/` scroll past Process section + ScheduleModal opened |
| Lead Magnet Download | Submit | $200 | (TBD — we should build one, see §6) |
| Blog Read 75% | Engagement | $5 | GA4 event `scroll_depth_75` on `/blog/*` |
| Phone Click | Click | $100 | tel: link click on mobile |

Value reasoning: $320/mo × ~12mo retention × 30% close rate from booked call = ~$1,150 expected value per booked call. Round to $1,500 for cVR signal weight.

**Setup tasks:**
- Configure each above in Google Ads → Tools → Conversions
- Mark "Strategy Call Booked" as the only **primary** conversion (others = secondary)
- Enable **Enhanced Conversions** with hashed email/phone → critical post-iOS 14 for view-through and Cal.com cross-device
- Link Google Ads ↔ GA4 (G-1CTGBJ9RLK) for cross-source attribution

---

## 2. Campaign architecture

```
RevFactor Ads Account (5342635272)
├── Campaign 01: Search — Tool Intent           [40% budget · $480/mo · $35-50 CPC max]
│   ├── AG: airbnb-pricing-tool-exact
│   ├── AG: airbnb-pricing-tool-phrase
│   └── AG: dynamic-pricing-tools-broad
│
├── Campaign 02: Search — Consultant Intent     [35% budget · $420/mo · $20-30 CPC max]
│   ├── AG: airbnb-consultant-exact
│   ├── AG: str-consultant-phrase
│   └── AG: vacation-rental-consultant-broad
│
├── Campaign 03: Search — Competitor Conquest   [25% budget · $300/mo · $5-10 CPC max]
│   ├── AG: pricelabs-conquest
│   ├── AG: wheelhouse-conquest
│   └── AG: beyond-pricing-conquest
│
├── Campaign 04: Remarketing — Display          [Month 2+ · $200/mo]
│   ├── AG: schedule-modal-abandoners (90d)
│   ├── AG: pricing-page-readers (60d)
│   └── AG: all-visitors (30d, light frequency)
│
└── Campaign 05: Performance Max                [Month 3+ · $400/mo, after 30+ conversions]
    └── Asset Group: Property owners — STR investors
```

Why this structure:
- **Separate campaigns by intent type**, not match type — lets you set different bid strategies per intent
- **Tool, Consultant, Competitor as 3 campaigns** so you can independently throttle the budget on each
- **Remarketing held until Month 2** because you need a list (>100 users) for Display to work
- **PMax held until Month 3** because Google's algorithm needs ≥30 conversions to learn — wait until you have signal

---

## 3. Keyword targets (from Ahrefs research, US, 2026-04)

### Campaign 01 — Tool Intent (~1,500 vol/mo combined)

**Exact match (highest bids):**
- `[airbnb pricing tool]` — 900/mo, KD 11, $7 CPC → bid $8 max
- `[best airbnb pricing tool]` — 150/mo, KD 9, $6 CPC → bid $7 max
- `[airbnb dynamic pricing tool]` — 150/mo, KD 28, $6 CPC → bid $7 max
- `[airbnb smart pricing tool]` — 80/mo, KD 1, $5 CPC → bid $6 max
- `[dynamic pricing tool airbnb]` — 60/mo, KD 21, $8 CPC → bid $9 max
- `[vrbo pricing tool]` — 100/mo, KD 1, $5 CPC → bid $6 max

**Phrase match (medium bids):**
- `"airbnb pricing software"`, `"vacation rental pricing tool"`, `"str pricing software"`
- Cap at $5 CPC — let Google find variations

### Campaign 02 — Consultant Intent (~330 vol/mo combined)

**Exact match (highest bids — perfect intent fit):**
- `[short term rental consultant]` — 100/mo, KD 0, $3 CPC → bid $5 max (overpay for fit)
- `[airbnb consultant]` — 100/mo, KD 3, $4.50 CPC → bid $6 max
- `[airbnb consultant near me]` — 50/mo, KD 0, $3 CPC → bid $5 max
- `[vacation rental consultant]` — 70/mo, KD 31, $3 CPC → bid $5 max
- `[short-term rental consultant]` — 40/mo, KD 0 → bid $5 max
- `[str consultant]`, `[airbnb revenue consultant]`, `[vacation rental revenue consultant]`

**Phrase match:**
- `"airbnb revenue management"`, `"vacation rental revenue management"`, `"str revenue management"`

### Campaign 03 — Competitor Conquest (~1,500 vol/mo combined for top brands)

**Exact match:**
- `[pricelabs]` — 1,300/mo, KD 18, $1.50 CPC → bid $3 max
- `[pricelabs alternative]` — bid $5 max (high intent)
- `[pricelabs vs]`, `[pricelabs review]`, `[pricelabs reviews]`
- `[wheelhouse pricing]`, `[wheelhouse alternative]`
- `[beyond pricing]`, `[beyond pricing alternative]`, `[beyond pricing review]`
- `[airdna alternative]`, `[hostfully pricing]`, `[guesty pricing]`

**Note:** Competitor brand bidding is allowed but you cannot use their trademark in ad copy (see §4).

---

## 4. Ad copy — Responsive Search Ads

### Campaign 01 — Tool Intent (positioning play: human > algorithm)

**Headlines (15 — Google rotates the best 3):**
1. Beyond Airbnb Pricing Tools
2. The Strategist Behind the Algorithm
3. +18% Revenue vs. Comp Set
4. Pricing Tools Set Numbers. We Set Strategy.
5. Real STR Revenue Consultants
6. Stop Guessing What to Charge
7. Your Properties Deserve a Strategist
8. Algorithm Alone Isn't Enough
9. From Auto-Pricing to Earning More
10. STR Revenue Consultancy
11. PriceLabs Sets Prices. We Build Strategy.
12. $320/mo Per Property
13. We Manage What Algorithms Miss
14. Strategy Call · 30 Min · Free
15. Outperform the Comp Set

**Descriptions (4):**
1. RevFactor pairs every property with a human revenue strategist — not just an auto-pricing algorithm. Top performers see +20% to +75% lifts.
2. Tools set the price. RevFactor sets the strategy that makes the price work. Flat $320/mo per property. Free 30-minute strategy call.
3. We work alongside your pricing tool — PriceLabs, Wheelhouse, Beyond Pricing — to extract the revenue your algorithm leaves on the table.
4. Schedule a strategy call with a real STR revenue manager. Documented +18% uplift vs. comp set across our portfolio.

**Sitelinks:**
- See Our Process · `/#process`
- Meet The Founder · `/about`
- Schedule Strategy Call · `/#schedule`
- The +18% Story · `/blog/dynamic-pricing-str-beginners-guide`

**Callouts:** `+18% vs comp set` · `Flat $320/mo per property` · `Free 30-min strategy call` · `Founder-led service` · `Top performers +20% to +75%` · `Volume discounts`

**Structured snippets:** Service catalog → "Revenue strategy, Comp-set analysis, Calendar optimization, Listing audit, Pricing strategy"

---

### Campaign 02 — Consultant Intent (lean directly into the offer)

**Headlines:**
1. Short-Term Rental Consultant
2. Airbnb Revenue Consulting
3. +18% Revenue vs. Comp Set
4. Real STR Strategist · $320/mo
5. Free 30-Min Strategy Call
6. Vacation Rental Revenue Expert
7. Founder-Led Consulting
8. Top STR Performers +20-75%
9. Beyond DIY Pricing
10. Talk to a Strategist Today
11. Documented Revenue Lift
12. Strategic Revenue Management
13. Your Property's Revenue Strategist
14. Custom Pricing Playbook
15. Stop Leaving Revenue on the Table

**Descriptions:**
1. Work 1:1 with an STR revenue consultant who builds custom pricing strategy for your property. +18% average lift vs. comp set. $320/mo flat.
2. Most consultants run audits and disappear. RevFactor partners ongoing — strategy calls, calendar optimization, comp tracking, monthly review.
3. Founder-led STR consulting. We've taken hosts from +20% (Kassidy & Erin) to +75% (Kate Henry) revenue lift. Schedule a free 30-min call.
4. Whether you have 1 property or 50, we build strategy for each. Flat $320/mo per property — no percent-of-revenue gotchas.

---

### Campaign 03 — Competitor Conquest (compliance-safe phrasing)

**Compliance rule:** Cannot use competitor trademark in ad copy headlines/descriptions. *Can* bid on the keyword. *Can* reference category.

**Headlines:**
1. Looking For STR Pricing Tools?
2. Beyond Auto-Pricing Algorithms
3. Strategy + Tool, Not Tool Alone
4. Real Humans Behind Your Pricing
5. The Consultant Tools Don't Replace
6. +18% Lift vs. Comp Set
7. STR Revenue Strategy Service
8. Algorithm Set Wrong? Talk to Us.
9. We Optimize What Tools Miss
10. STR Revenue Consultancy

**Descriptions:**
1. If you're shopping pricing tools, you may also want a strategist. RevFactor works alongside any tool — PriceLabs, Wheelhouse, Beyond Pricing — to extract maximum revenue.
2. Tools set the prices. RevFactor builds the strategy that makes them work. Documented +18% vs. comp set. Flat $320/mo per property.

---

## 5. Negative keyword lists

Apply at the **account level** (Tools → Shared Library → Negative keyword lists):

**List A: "Free / cheap / DIY" seekers**
```
free, cheap, diy, do it yourself, template, spreadsheet, "for free", "free template"
```

**List B: Job / career seekers** (huge issue with "consultant" terms)
```
job, jobs, career, careers, salary, hiring, "consultant jobs", "consultant salary",
"consultant career", linkedin, indeed, glassdoor, intern, internship
```

**List C: Wrong audience (guests, not hosts)**
```
guest, stay, book, booking, "vacation home", "vacation rental for rent",
hotel, hotels, motel, resort, "places to stay"
```

**List D: Tutorial / informational**
```
tutorial, "how to", "what is", definition, meaning, course, training, certification,
"sample resume", template, examples, wiki, wikipedia, reddit
```

**List E: Wrong industry**
```
hotel, hotels, motel, "long term", "long-term", "annual lease", apartment,
commercial, retail, office space, b&b, "bed and breakfast"
```

**List F: Geographic exclusions (if running US-only)**
```
india, philippines, kenya, nigeria, bali, dubai, mexico
(per Ahrefs: "airbnb consultant bali" returned 10/mo — exclude)
```

---

## 6. Landing pages

**Strategic decision:** Build **3 dedicated PPC landing pages**, don't send paid traffic to the homepage.

The current homepage at `revfactor.io` is a brand experience page (cinematic, multi-section, slow scroll). It's beautiful for organic traffic and direct visits but **kills paid conversion rate** because:
- Multiple CTAs compete with the primary
- Scroll-heavy hides the booking action
- Doesn't address the specific search intent that brought the visitor

For paid search, intent-matched single-purpose pages convert 2-4× better.

### Page 1: `/airbnb-pricing-strategy` (for Campaign 01)

**Headline angle:** "PriceLabs sets your prices. RevFactor sets your strategy."

**Structure:**
1. Above-fold hero: headline + sub-head + book button (single CTA)
2. The +18% claim with data viz
3. "Tools alone vs. tools + strategy" comparison table
4. 3 testimonials with revenue lift metrics
5. How the strategy call works (3-step animation)
6. Inline calendar embed (`schedule.revfactor.io/embed`)
7. FAQ (5 questions max)
8. Footer

**Performance targets:** LCP < 2s, CLS < 0.1, no third-party fonts on critical path. **Quality Score impact: 1-2 points easy lift.**

### Page 2: `/short-term-rental-consultant` (for Campaign 02)

**Headline angle:** "An STR consultant who actually stays around."

Lean into "ongoing partner, not audit-and-disappear" positioning. Highlight Federico's name (founder-led). Show the +20% to +75% range as a band, not a single number.

### Page 3: `/vs/pricelabs` (for Campaign 03 — and SEO bonus)

**Headline angle:** "Already using PriceLabs? Here's how to get more from it."

Critical: this is a "how to combine" page, **not** a competitor-bashing page. Reframe RevFactor as the *layer above* PriceLabs, not the replacement. This:
- Avoids trademark issues
- Resonates with prospects who like their tool but want better results
- Earns goodwill (and possibly future PriceLabs partnership)

**Reusable component**: build one `<PPCLanding>` component with prop-driven hero / value-stack / testimonial sections. The 3 pages share 90% of code, just differ in copy + headline angle.

### Conversion infrastructure

On each PPC page:
- Single primary CTA (book strategy call) — 3 placements (hero, mid-page, end-page) all triggering same modal
- Phone number visible top-right with `tel:` link (mobile conversion)
- Trust strip with logos / press mentions if any
- Cal.com confirmation page → fire `gtag('event', 'conversion', { 'send_to': 'AW-18106897053/<conversion_label>', 'value': 1500.00, 'currency': 'USD' })`

---

## 7. Funnel + remarketing

### Yes, do remarketing. It's the highest-ROI part of paid for a high-touch service like this.

Reasoning: Strategy-call buyers don't decide on first visit. They visit, think about it, compare tools, ask their property manager, then come back. Without remarketing, you pay for the first click and lose them. With remarketing, you stay in front of them for 30-90 days for pennies per impression.

### Audiences to build (set up immediately, even before remarketing campaigns launch)

| Audience | Window | Purpose |
|---|---:|---|
| All Site Visitors | 30d | Brand reinforcement (light frequency) |
| Strategy Modal Opened, Did Not Submit | 90d | The money audience — high frequency, social proof creative |
| Pricing Page Readers (`/#pricing`) | 90d | ROI-focused remarketing |
| Blog Readers (`/blog/*`) | 60d | Education → conversion path |
| Schedule.revfactor.io Visitors | 60d | Visited Cal.com but didn't complete |
| Customer Match — Lead List | n/a | Existing email leads from Federico's network |
| Lookalike of Customer List | n/a | Top-of-funnel display |

Build via Google Ads → Tools → Audience Manager. GA4 audiences also auto-import once accounts are linked.

### Remarketing creative

- **Display banners (HTML5):** 3 sizes (300×250, 728×90, 160×600) for each audience
  - Modal abandoners: "Still thinking about that strategy call?" + 6/10 social proof + book button
  - Pricing readers: "Flat $320/mo. Volume discounts after 5 properties."
  - Blog readers: Featured testimonial with metric (+47% lift, etc.)
- **YouTube remarketing (TrueView):** 15-second testimonial cuts + 6-second bumpers. Auto-skip after 5s = pay only for engaged viewers.
- **Discovery / Demand Gen:** native placements in Gmail Promotions + YouTube feed. Cheap reach for awareness layer.

### Frequency caps

- Display: 3 impressions/day, 15/week per user
- YouTube: 2 impressions/day, 8/week per user

Without caps, remarketing creep kills brand goodwill and burns budget on people who already saw the ad 20 times.

---

## 8. Audience signals (for PMax + Search "audience expansion")

**In-market segments:**
- Real Estate / Investment Properties
- Real Estate / Property Management
- Travel / Vacation Rentals
- Business Services / Marketing & Advertising

**Affinity segments:**
- Real Estate Investors
- Travel Buffs / Frequent Hospitality
- Small Business Owners

**Custom Intent (build these — they outperform pre-built segments):**
- Searches: `pricelabs`, `wheelhouse pricing`, `beyond pricing`, `airdna`, `revpar airbnb`, `vrbo pricing`
- Visits URLs: `pricelabs.co`, `usewheelhouse.com`, `beyondpricing.com`, `airdna.co`, `hostfully.com`, `guesty.com`

**Detailed Demographics:**
- Homeowners
- Income: top 30% (where available)

**Customer Match (upload Federico's existing CRM list):**
- Free to upload, drives both targeting and lookalike audiences
- Critical for Enhanced Conversions accuracy too

---

## 9. Conversion tracking checklist

**Already done:**
- [x] gtag.js deployed on revfactor.io (`AW-18106897053`) — commit 208dc7b on `add-google-ads-gtag` branch (still in preview, needs merge to main)

**To do before campaigns launch:**
- [ ] Merge `add-google-ads-gtag` PR into `main` so the tag is on production revfactor.io
- [ ] Verify gtag fires on production via Tag Assistant
- [ ] Create 5 conversion actions in Google Ads (see §1)
- [ ] Wire `gtag('event', 'conversion', {...})` into Cal.com confirmation page on `schedule.revfactor.io` — get conversion label from Google Ads after creating the action
- [ ] Enable Enhanced Conversions with hashed email/phone
- [ ] Link Google Ads ↔ GA4 (G-1CTGBJ9RLK)
- [ ] Verify GA4 events `view_pricing`, `open_schedule_modal`, `submit_lead`, `scroll_75` fire correctly
- [ ] Add `tel:` link tracking to mobile header
- [ ] Set up Audience Manager audiences (see §7)
- [ ] Apply for Customer Match approval (some accounts require it; usually instant)

**To do once Basic Access lands (then I can do all of this via API):**
- [ ] Deploy Campaign 01-03 with keyword sets, ad copy, sitelinks, callouts
- [ ] Apply negative keyword lists at account level
- [ ] Set bid strategy: **Maximize Conversions** with Target CPA = $150 once you have ≥15 conversions; before that, **Manual CPC**
- [ ] Set up automated rules: pause keyword if 0 conversions after 100 clicks; raise bid 10% if CPA <$80 over 14 days

---

## 10. Budget + 30/60/90-day milestones

### Month 1 ($1,200 — Search only)
- Goal: validate the channel, get baseline CPA, prove conversion tracking
- Campaign 01: $480 / Campaign 02: $420 / Campaign 03: $300
- Expect ~150-250 clicks, 5-12 booked calls
- KPI: CAC < $200 per booked call

### Month 2 ($1,400 — add Remarketing)
- Goal: lower blended CAC by recapturing modal abandoners
- Add Campaign 04 (Remarketing) at $200/mo
- Optimize ad copy based on Month 1 search-term data
- Pause keywords with 0 conv after 100 clicks
- KPI: CAC < $150 per booked call

### Month 3 ($1,800 — add Performance Max)
- Goal: scale via Google's algorithm once 30+ conversions are accumulated
- Add Campaign 05 (PMax) at $400/mo
- Build first asset group with full creative library + audience signals
- KPI: CAC < $120 per booked call, 25+ booked calls/mo

### 90-day decision point
- **If CAC < $200, scale to $3-5K/mo and add more channels** (LinkedIn STR groups, Meta with custom audiences)
- **If CAC > $400, pause and re-strategize landing page or offer** (probably not the channel — Google Ads should work for this segment)
- **If $200-400, optimize for 60 more days** before scaling

---

## 11. What I (Claude) will do automatically once Basic Access lands

1. Deploy all 3 search campaigns + ad copy + keywords + negative lists via API
2. Set up Audience Manager audiences
3. Wire conversion actions
4. Run weekly performance reports automatically (Saturday 8am, push to a Google Doc + email Aaron the highlights)
5. Auto-pause keywords with 100+ clicks and 0 conversions
6. Auto-flag any campaign hitting >150% of target CPA for 7+ days
7. Monthly competitor benchmark report (search impression share lost to PriceLabs/Wheelhouse)

This blueprint is the source of truth — when Basic Access lands, the API turns this doc into running campaigns within an hour.
