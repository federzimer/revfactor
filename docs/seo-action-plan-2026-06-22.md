# RevFactor SEO Action Plan — 2026-06-22

Comprehensive audit results from 5 parallel agents (pillar gap, Blog 7 gap, consultant LP gap, cluster content+freshness, schema audit). Source reports in `/tmp/seo-*-2026-06-22.md`.

---

## ✅ Already shipped (today, on main + live)

| Fix | Commit | Why |
|---|---|---|
| Blog 5 stale Review schema pricing ($320/$256/$125 → $350/$150) | `82a3d59` | AI engines were citing wrong fee for "what does RevFactor cost?" queries |
| Blog 4 self-review Review schema removed | `c23c677` | Google manual-action risk for biased review markup (founder reviewing own company, 5-star) |
| FIFA NewsArticle duplicate removed | `f59986f` | Was orphaning author/publisher from entity graph (no @id refs to canonical entities) |
| Blog 5 self-review Review schema removed | `f59986f` | Same manipulation risk as Blog 4 |

---

## 🟡 Awaiting Aaron decisions

| Item | Source | Why it needs your call |
|---|---|---|
| `/short-term-rental-consultant/` is `noindex={true}` | Consultant LP gap analysis | Blocks organic ranking entirely. PPC-only intentionally, OR remove noindex + build out as the primary indexed consultant page? AJL has 2,500-word indexed competitor page at DR 32 — winnable if unblocked. |
| "Casago (formerly Vacasa)" framing across cluster | Content audit | Agent claims this is backward — Casago *acquired* Vacasa, Vacasa continues to operate. Used in Blog 5 (and probably elsewhere). Verify and roll forward. |
| "Freewyld Foundry" in Blog 7 + cluster | Content audit | Agent flagged as possibly unverifiable. Worth confirming the company exists and is positioned correctly before next pricing/positioning sweep. |

---

## 🔴 High-priority queued (not yet applied)

### 1. Pillar additions (estimated +30% AI-citation surface)
From pillar gap agent — 3 new H2 sections all 3 top-ranking competitors have that pillar doesn't:

- **New H2: "How Much Does a Revenue Manager Cost? Fee Structures Compared"** — pillar has the $350/mo table but doesn't frame it as the answer to the highest-intent commercial query. Lift into dedicated H2 before "How RevFactor Approaches Revenue Management."
- **New H2: "How to Hire a Revenue Manager: 7 Questions to Ask"** — both PriceLabs (rank #4) and AirDNA (rank #3) rank with this section. Pillar has nothing. Add 7 numbered questions covering local-market experience, tools fluency, fee structure, RevPAR reporting cadence, comp-set methodology, LOS strategy, communication rhythm.
- **New H2: "Signs You Need a Revenue Manager"** (5 numbered triggers) — pillar buries these in body prose; lift into dedicated H2 for featured-snippet capture.
- **Add 10–15 in-cluster internal links** — pillar has only ~6 internal links across 9K words. Add links from every RevPAR/ADR mention to glossary terms, every market name to market hub pages, every tool name (PriceLabs/Beyond/Wheelhouse) to comparison page.

### 2. Blog 7 additions (the data-density gaps vs PriceLabs at DR 72)
From Blog 7 gap agent — Blog 7 already beats competitors on word count (3,500 vs ~2,300 avg) and schema breadth (Service + Offer + ItemList + Review + FAQ; PriceLabs only has Article + FAQ + Breadcrumb + Person). Five Tier 1 adds:

- **Market-size opener stat band** — anchor with "$344B by 2034 / 10.70% CAGR (Precedence Research)" + flat-fee vs 5–8% industry fee benchmark
- **Profit Formula callout box** after "The Metric That Tells You the Truth": `Profit = ADR × Occupancy × Available Nights − OpEx` (both PriceLabs and Truvi have this — Perplexity/AIO citation bait)
- **Expand "What to Ask Before You Hire" 6 → 10 questions** and rebrand as **"The 10-Question RM Interview"** with its own H2. Add: retention rate, RevPAR-lift guarantee, PriceLabs config ownership on exit, sample monthly report.
- **Fee-structure side-by-side table**: flat $350 vs 5% of revenue vs 25% full management across portfolio sizes 1–10. We have a flat-fee table but no apples-to-apples comparison.
- **Quick Navigation / TOC block** below Key Takeaways. AirDNA's #1 page has this — free UX + AI-Overview formatting win.

### 3. Consultant LP additions (if Aaron unblocks indexing)
- Add **FAQPage schema** to 6 existing FAQs (currently unmarked-up) — 10-min change, AI Overview eligible
- Add **Review + AggregateRating schema** to 3 testimonials — get stars in SERP
- Put **exact-match keyword in an H2** above the comparison table ("Short-Term Rental Consulting Services")
- Add a **"Trusted by / Recognized by" logo strip** — AirDNA, Hospitable, PriceLabs, podcast logos. Closes AJL's 12-logo credibility gap.
- Add **3-audience segmentation** (PM / Provider / Investor — AJL's pattern) or **3-stage operator segmentation** (pre-purchase / under-contract / scaling — BYB's pattern)

### 4. Schema opportunities (from schema audit)
- **HowTo schema on Comp Set guide** — `how-to-build-comp-set-str` has a clearly sequenced 7-filter methodology. HIGH IMPACT. Pattern code in the schema audit report ready to paste.
- **DefinedTerm additions on ADR/RevPAR post** — perishable inventory, yield management, GOPPAR. Pattern code ready.
- **Service/Product schema for vendor entries on Blog 4 listicle** — upgrade bare ListItems to typed Organization/Service entities with each vendor's pricing model + service scope (data already in editorial).
- Add `description` property to Blog 7's Service schema (Google-recommended).

---

## 📅 Freshness refresh queue (8 stale posts)

Per content audit. Order by refresh priority (1 = do first):

| # | Post | Days since update | Why now |
|---|---|---|---|
| 1 | FIFA post | 31 | Tournament started June 11 — fresh data window open; add Quick Answer box, 5 FAQs, 5 internal links |
| 2 | Blog 7 (newest) | 13 | "Casago (formerly Vacasa)" fact-check; Freewyld Foundry verify; add Quick Answer box; add 27% within-7-days AirROI URL |
| 3 | Blog 4 listicle | 38 | Verify vendor portfolio stats + Rented/Track current operating status; add internal link to FIFA post at Texas geography |
| 4 | Blog 5 PM listicle | 37 | Casago/Vacasa fact-check fallout (multiple post family) |
| 5 | Dynamic Pricing guide | 47 | Stat freshness check |
| 6 | Pillar | 49 | Pillar additions above + freshness pass |
| 7 | ADR vs RevPAR | 38 | DefinedTerm additions above + freshness pass |
| 8 | Method | 38 | Freshness pass |
| 9 | Comp Set | 38 | HowTo schema add (above) + freshness pass |

**Important:** for each refresh, do REAL content updates (refresh stats, swap dead source links, add new internal links, verify portfolio stats match SSOT, confirm pricing is $350/$150) BEFORE bumping `updatedDate`. Cosmetic-only date bumps are detected by Google and discounted.

After bumping, ping IndexNow to Bing for re-crawl.

---

## Ahrefs context

- RevFactor.io DR: **2.7** (very early)
- Organic ranking keywords (Ahrefs index): **0**
- This means every entity signal + schema fix + freshness lift compounds — no ranking inertia to overcome, but no signals to rest on either. The optimization work matters more than usual.

MCPs activated for next session: **ahrefs, peec**. Will load automatically.

---

## Reports

- `/tmp/seo-gap-pillar-2026-06-22.md`
- `/tmp/seo-gap-blog7-2026-06-22.md`
- `/tmp/seo-gap-consultant-2026-06-22.md`
- `/tmp/seo-content-audit-2026-06-22.md`
- `/tmp/seo-schema-audit-2026-06-22.md`
