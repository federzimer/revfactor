# RevFactor Journal — Deep SEO + GEO Audit

**Date**: 2026-05-16
**Scope**: 5 cluster spokes + RM pillar
**Tools used**: seo-toolkit (SERP comparison + page scoring vs. top-10 + AI-eligibility surfaces), Peec.ai (90-day brand-mention report across 75 tracked prompts), AirROI (market data benchmarking)

> Note: I used the **seo-toolkit** instead of Page Optimizer Pro on the standing instruction in memory (POP credits get reserved for 1-2 strategic pages per quarter; seo-toolkit replicates POP's LSA + schema + scoring for free). If you want a POP second-opinion on one of these I'd burn the credit on the PM listicle since it's the weakest.

---

## 1. Headline numbers

### SEO composite (seo-toolkit, 0–100)

| Post | Score | Grade | Words | SERP avg | LSA % | Density % | Key gap |
|---|---|---|---|---|---|---|---|
| Dyn pricing primer | **88.2** | B | 5,875 | 1,349 (4.4×) | 82% | 0.14% | "competitive" / "algorithms" |
| STR RM cos listicle | **88.5** | B | 8,331 | 1,302 (6.4×) | 92% | 0.10% | "strategies" 5× under, geo intent |
| RM pillar | **84.9** | B | 8,064 | 1,280 (6.3×) | 98% | 0.09% | Density low, Person schema thin |
| Comp Set | **76.2** | C | 4,127 | 1,771 (2.3×) | 54% | 0.17% | "compset"/"hotels" 0%, missing BlogPosting schema |
| ADR vs RevPAR | **73.5** | C | 3,227 | 1,580 (2.0×) | 54% | 0.03% | "hotel"/"room/rooms" gap, density 0.03%, missing BlogPosting |
| **PM listicle** | **69.5** | **D** | 6,613 | 2,360 (2.8×) | **26%** | **0.03%** | Massive vocab gap, no entity-anchor schema, no per-vendor visuals |

### AI eligibility (seo-toolkit `ai-eligibility`, 0–100 per surface)

Surfaces correspond to the 5 ways Google AI Mode / AI Overviews can surface a page (fanout coverage, facet depth, perspectives byline, hover preview, inline citability). Subscription-link is FAIL on all — that's expected, they aren't subscription pages.

| Post | Overall | Fanout | Facet | Byline | Hover | **Inline citability** |
|---|---|---|---|---|---|---|
| ADR vs RevPAR | 81 | 88 | 100 | 100 | 100 | **100** ✓ |
| RM pillar | 79 | 96 | 100 | 100 | 100 | **80** |
| PM listicle | 75 | 96 | 100 | 100 | 100 | **55** ⚠ |
| Dyn pricing primer | 73 | 75 | 100 | 100 | 85 | **80** |
| Comp Set | 70 | 92 | 100 | 100 | 100 | **25** ❌ |
| STR RM cos listicle | 70 | 96 | 100 | 100 | 100 | **25** ❌ |

The two listicles + Comp Set are starved of atomic claims (specific numbers / dated specifics / "according to X" citations). That's the single biggest GEO unlock across the cluster.

### Peec.ai brand visibility (90 days, 75 prompts tracked in RevFactor project)

**RevFactor: 0 mentions across all 75 tracked STR-revenue prompts.** Competitors that own the AI-citation share:

| Brand | Share of Voice | Mentions | Prompts hit |
|---|---|---|---|
| PriceLabs | 20.2% | 13,504 | 75/75 |
| Vrbo | 12.1% | 8,091 | 67/75 |
| Wheelhouse | 10.8% | 7,208 | 75/75 |
| AirDNA | 7.5% | 5,009 | 73/75 |
| Beyond Pricing | 6.4% | 4,296 | 75/75 |
| Guesty | 5.8% | 3,870 | 68/75 |
| Hospitable | 5.4% | 3,637 | 62/75 |
| Hostaway | 4.8% | 3,220 | 64/75 |
| Vacasa | 4.4% | 2,926 | 49/75 |
| Evolve | 2.9% | 1,949 | 44/75 |
| (RevFactor) | **0.0%** | **0** | **0/75** |

This is the entire commercial case for the journal: every "who can manage my Airbnb pricing" / "what's the best STR revenue management company" prompt routes the buyer through LLMs that have never heard of RevFactor. Eight of the cluster's spokes are aimed directly at these prompts — they just haven't earned citations yet because (a) most of the content was published in the last 2 weeks and (b) the inline-citability score on three of them sits below 60.

---

## 2. Per-post recommendations

### 2a. PM listicle — `/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/` — **69.5/D, biggest lift**

**Score-driving issues**:

1. **LSA coverage 26%** — the page uses 26% of the semantic vocabulary that the top-10 SERP results all share. Specific terms competitors use that the post barely touches:
   - `rentals` (137 avg use / 11 here, ratio 0.08)
   - `vacation` (110 / 23, 0.21)
   - `beach` (50 / 2)
   - `hosts` (44 / 2)
   - `luxury` (24 / 0)
   - `island` (17 / 0), `mountain` (14 / 0), `home` (16 / 0)
   - `redawning` (11 / 0) — RedAwning is in 3/5 competitor pages, missing here
   - Cities: `chicago` (11 / 0), several other-market mentions

   These aren't keyword-stuffing targets — they signal Google that you're talking about the same domain the SERP top-10 is talking about (vacation-rental-by-property-type, by-market, by-host-profile). The current page leans heavily on operator-fit framing without grounding in property types or geo.

2. **Keyword density 0.03%** — primary "best airbnb property managers" appears 2 times in 6,613 words. Competitor avg is ~0.5%. Push to ~30 mentions naturally (incl. variants: "Airbnb property management company", "full-service Airbnb manager", "best Airbnb PM").

3. **Inline citability 55/100** — 33 atomic claims across 6,613 words = 5.0 per 1k. Threshold is ≥5/1k. Need to push to ~7-8/1k by adding more dated specifics and named sources:
   - Add "[Vendor X] manages N properties across [N markets]" stats for each entry (pulled from their public marketing pages — verifiable)
   - Add "Vacasa filed S-1 on YYYY-MM-DD" / "Evolve raised $XM Series N" type dated facts
   - Add a "What the data shows" callout per vendor: "AirDNA's H1 2026 STR report puts AvantStay's portfolio at X units in N markets"
   - Direct attribution: "According to RedAwning's 2026 host playbook, ..."

4. **No per-vendor visuals** — this is the single biggest visible-trust gap and connects to your photo question (see §3 below).

5. **PAA gap**: post doesn't directly answer "Who is the best Airbnb management company?" or "How much to pay an Airbnb property manager?" as standalone answer blocks. Both questions have an answerable one-liner that should be the FIRST line of a section H2.

**Top SERP competitors**: redawning.com (the page Google ranks #1), airbnb.com/host/co-hosts (Airbnb's own), airbtics.com, awning.com, avantstay.com/texas. All five lean heavily on per-vendor visuals + market/property-type breakdowns.

**Priority fixes (effort vs. impact)**:
- 🔴 CRITICAL: Add per-vendor logo + 1 dashboard/website screenshot for each of the 7 vendors (~30 min/vendor)
- 🔴 CRITICAL: Add a market-coverage table: vendor × markets they operate × property type focus (closes the geo/property-type LSA gap in one block)
- 🟠 IMPORTANT: Rewrite the "Who is the best…" answer-first paragraph as the first sentence under the H1
- 🟠 IMPORTANT: Add 4-5 dated stats per vendor (portfolio size, founded year, last funding round date, fee % range with source link)
- 🟡 OPTIONAL: Add a "near California" / "near Texas" geo-intent sub-section — both show up as related searches across the cluster

---

### 2b. STR RM companies listicle — `/blog/best-str-revenue-management-companies-2026/` — 88.5/B, **but AI citability 25/100**

This is the post most likely to capture "best STR revenue management companies" / "STR revenue management solutions" SERP traffic — already scored well on LSA + schema, but is getting starved of AI citations.

**Inline citability 25/100**: needs ~3× more atomic claims. Specifically: each of the 10 vendors needs at least 4 dated/sourced facts (founded date, portfolio size with timestamp, fee model with effective date, last public mention). Right now several vendor blocks are qualitative ("Specialist", "Bundled-PM") without verifiable specifics.

**LSA**: "strategies" used 1× vs. competitor avg 5×. Add a "Pricing strategies offered by each vendor" comparison row.

**SERP competitors**: pacerrev.com, maverickstr.co, synchronest.com, stepbystepbnb.com — all are vendor sites that rank, not editorial. RevFactor as a publication CAN beat them with depth, but needs the inline-citability score above 70.

**Meta description**: 257 chars (will be truncated by Google at 160). Trim.

**Specific tactical adds**:
- "RevFactor vs. Pacer" and "RevFactor vs. Beyond Pricing" comparison call-outs (with named entity disambiguation — this is what Peec's PriceLabs is winning)
- A "Last verified" timestamp per vendor row — both an SEO signal (freshness) and an LLM citation signal
- Add inline link to each vendor's pricing page (external auth signal)

---

### 2c. RM pillar — `/blog/revenue-management-for-short-term-rentals/` — 84.9/B, **inline cite 80/100**

Strongest post in the cluster. Issues are now polish-tier:

- Meta description 211 chars — trim to ≤160
- Primary keyword density 0.09% (page is 8,064 words — push to ~40 mentions of "revenue management for short-term rentals" or close variants)
- Title 66 chars (close to truncation limit) — consider shortening to under 60
- **Add Person schema linking Federico Zimerman to Organization (RevFactor)** with `sameAs` to LinkedIn + the case-study pages. Right now the byline shows Person but the entity isn't fully connected — this is one of the highest-leverage AI-citation moves per the Cyrus/Zyppy factor analysis in memory
- Cover "near California" / "near Texas" geo-intent variants in a single FAQ block

---

### 2d. Dyn pricing primer — `/blog/dynamic-pricing-str-beginners-guide/` — 88.2/B, **hover preview 85**

Highest-scoring post. Two fixes:

- Title length 77 chars — trim
- Cover "competitive" / competitor-set language explicitly (currently 0 mentions, competitors use 5×). Easy add in the "How dynamic pricing reads your comp set" section
- "Algorithms" coverage 1 vs. 6 avg — explain the pricing algorithm family (rule-based vs. ML vs. hybrid) directly
- Answer "What is the 75-55 rule for Airbnb?" in a one-paragraph FAQ block — that PAA is unaddressed across this whole cluster
- Rebalance "tool"/"tools" usage (currently overused; competitors lean on "pricing software" / "pricing engine")

---

### 2e. Comp Set — `/blog/how-to-build-comp-set-str/` — 76.2/C, **inline cite 25/100**

**Big LSA gaps**: "compset" 0/50, "hotels" 1/22, "competitors" 1/18, "compsets" 0/11, "benchmarking" 2/8. The page is so committed to "comp set" as the canonical phrase that it never uses the single-word "compset" variant that the entire hotel-RM literature uses. Add 8-10 natural uses of "compset" + 5-6 uses of "hotels" (as the discipline's origin), "competitors", "benchmarking".

**Inline citability 25**: 4 fixes
- Add "Smith Travel Research / STR (CoStar) compsets typically include X-Y properties" type sourced claim
- Add a dated "RevFactor's portfolio compset construction across N properties shows..." stat
- 2 specific named-source citations (any reputable industry source) per major section
- 8-10 atomic numerical claims (specific dollar amounts, percentages, sample sizes)

**Missing schema**: BlogPosting type is in 40% of competitor pages, missing here.

**PAA gaps** — these are NOT directly answered as standalone H2/FAQ blocks:
- "What is STR compset?" (1-sentence answer first)
- "What is included in a STR report?" (subhead block)

**Related-searches opportunity**: "Str comp set costar", "Str comp set price", "STR Benchmark" — these are commercial-intent variants that suggest a small "How RevFactor's compset methodology compares to AirDNA / Key Data / STR" comparison block.

---

### 2f. ADR vs RevPAR — `/blog/adr-vs-revpar-airbnb-hosts/` — 73.5/C, **inline cite 100/100**

Already AI-citable (the strongest score on this surface). SEO score is held back by:

- **Density 0.03%** — primary phrase "ADR vs RevPAR" appears only once in 3,227 words. Push to ~10-15 natural uses.
- **LSA gaps**: "hotel" (22 / 3), "rooms" (19 / 0), "formula" (10 / 3), "goppar" (8 / 0). The post deliberately positions away from hotel language but Google still expects the page to acknowledge the hotel origin. Add a short "Why these metrics came from hotels — and what changes for STR" framing paragraph.
- **GOPPAR** (Gross Operating Profit Per Available Room) is missing entirely — this is a related metric STR operators search for; adding a 2-paragraph callout earns related-keyword coverage.
- **Missing BlogPosting schema** — in 57% of competitor pages.
- **PAA gaps**:
  - "Is RevPAR the same as ADR?" → 1-sentence answer
  - "How do you calculate RevPAR and ADR?" → formula block (already covered, just needs FAQ schema)
  - "Which is better, RevPAR or ADR?" → editorial position
- **Related searches** suggest opportunity: "RevPAR Calculator", "ADR and RevPAR formula". Adding an interactive calculator (or even a side-by-side worked example with copy-pasteable formulas) is a high-leverage move.

---

## 3. Listicle photos — yes, here's why

**Should each entry have a photo, ideally a website screenshot?** Yes — both for SEO and GEO.

Current state:
- PM listicle: 4 photos, but they're STR-archetype scenery (fireplace cabin, coastal villa, mountain road) — not vendor-specific
- STR RM cos listicle: 3 photos, also generic scenery
- All 5 SERP top-10 competitors for the PM listicle use per-vendor visuals (logos or website screenshots)

### Why it matters

| Lever | Effect |
|---|---|
| **Image SERP** | Per-vendor screenshots tagged "[Vendor] dynamic pricing dashboard" can rank in Google Images for [Vendor]+ branded queries → discovery traffic |
| **Dwell time / scroll depth** | Visual differentiation increases scroll completion, the #2 lever Google uses for "is this content satisfying" (after click-through) |
| **AI citation eligibility** | Anthropic + OpenAI's product-comparison answers increasingly cite pages with verifiable per-product visuals (the model can ground its answer to the visual). The Cyrus/Zyppy 23-factor analysis put "verified visual proof" at score 1.4 |
| **Trust / E-E-A-T** | For a comparison page, "show, don't tell" — readers trust that you've actually looked at each vendor |
| **Schema** | Per-vendor `Product` or `Organization` schema with `logo` + `image` props is a structured-data path that the listicles currently can't take |

### Practical recommendation

Per vendor in BOTH listicles:

1. **Logo** (PNG with transparency, ~120px wide) — pulled from their press kit or homepage; alt text = "[Vendor name] logo"
2. **1 website screenshot** (above-the-fold of their homepage, OR their pricing/dashboard page if more relevant) — 1200×750 webp; alt text = "[Vendor] [page type] — [1-sentence summary of what's shown]"
3. Optional: 1 dashboard/UI screenshot if publicly available (from their case studies or YouTube demos)

Layout: small logo top-left of each entry card, screenshot inline within the entry body (right after the first paragraph).

Production: I can build a screenshot pipeline using `playwright` against each vendor's homepage + a watermark/crop step. ~10 min per vendor once the script is built. Or I can pull the logos in 30 minutes from each vendor's brand page.

**Trade-off**: this adds 70-90 KB per vendor × 7 vendors = ~600 KB to the page (offset by lazy-loading below the fold). LCP stays clean since none of these are above the fold.

---

## 4. Cross-cutting GEO recommendations (highest leverage, all 6 posts)

The Peec data says it plainly: **RevFactor is invisible in LLM answers.** Six things move that:

### 4a. Inline citability across the cluster

Three of the six posts have inline citability below 60. Each needs +20-30 atomic claims. Cheap to add, immediate effect on Anthropic + OpenAI + Perplexity citation likelihood. **Specific format that works** (per the AI-citation factors research in memory):

```
Federico's revenue management process compresses the typical
3-week comp-set rebuild down to 4 days — measured across 12
RevFactor onboardings between Jan 2026 and May 2026.
```

vs. the current pattern:

```
Federico's process compresses the comp-set rebuild meaningfully.
```

### 4b. Reddit + community surface seeding

Per memory's "AI Citation Ranking Factors" notes — fan-out coverage (passages cited from Reddit + Quora + ChatGPT-indexed forums) is the #4 ranked AI-citation factor. The PM listicle and STR RM cos listicle should:

- Have 1 Reddit thread cross-posted (in r/AirBnB, r/realestateinvesting, r/Vacationrentals) summarizing the framework
- Be linked from 2-3 authoritative non-self comments in existing discussion threads

This is where most of the SoV competitors are winning — PriceLabs is in 75/75 Peec prompts partly because of its Reddit + Skift + AirDNA citations.

### 4c. Person/Org entity graph

The journal byline currently shows "Federico Zimerman" but the JSON-LD Person entity isn't fully linked to the Organization (RevFactor). Add:

```json
"author": {
  "@type": "Person",
  "name": "Federico Zimerman",
  "jobTitle": "Founder, RevFactor",
  "worksFor": { "@id": "https://revfactor.io/#organization" },
  "sameAs": [
    "https://www.linkedin.com/in/federicozimerman/",
    "https://x.com/...",
    "https://revfactor.io/about"
  ]
}
```

Cyrus/Zyppy puts the author-Person entity at score 1.7 — top-10 factor.

### 4d. llms.txt

The cluster URLs are listed in `llms.txt` per the memory note. Verify it's at `revfactor.io/llms.txt` and returns 200. Add the new spokes if not already in.

### 4e. Geo-intent variants

Every post's `related searches` includes "near California" / "near Texas". RevFactor operates across 56 markets — adding a single section per post that lists "RevFactor's California portfolio averages X / Texas portfolio averages Y" gets you geo-intent coverage AND grounds the post in proof-of-portfolio.

### 4f. Direct AI prompt-pull validation

I can run a manual Peec-style pull for the 8 prompts most directly aimed at the cluster posts:

1. "what is the best dynamic pricing tool for Airbnb?"
2. "what companies provide revenue insights for vacation rental owners?"
3. "who can help me forecast demand for my vacation rental?"
4. "best STR revenue management companies"
5. "Best Airbnb property managers with dynamic pricing"
6. "What is the 75-55 rule for Airbnb?"
7. "ADR vs RevPAR for STR"
8. "How to build an STR comp set"

…and snapshot the actual current GPT-5 / Claude / Perplexity answer for each, see which competitor brands they cite, and identify the 1-2 brands we need to displace per prompt. Want me to wire that as a recurring cron so we can watch the SoV needle move?

---

## 5. Quick-win priority order (effort × impact ranking)

1. **🔴 PM listicle visuals** — add per-vendor logos + 1 screenshot each (3-4 hr) — biggest visible upgrade + image SERP unlock
2. **🔴 Add inline atomic claims to Comp Set + STR RM cos** — +20 numbered/dated facts each (2-3 hr) — moves AI citability from 25 → 70+
3. **🟠 Person/Org schema linking** — single block, applies to all 6 posts (30 min) — top-10 GEO factor
4. **🟠 BlogPosting schema** on ADR vs RevPAR + Comp Set (15 min)
5. **🟠 Meta description + title trims** on RM pillar, Dyn pricing, STR RM cos (10 min)
6. **🟠 PAA answer blocks** — Add 4 missing FAQ-format answers (90 min)
7. **🟡 Reddit cross-posts** for PM + STR RM listicles (1 hr each + delayed authentic engagement)
8. **🟡 Geo-intent sections** — near California / near Texas roll-up (45 min per post)
9. **🟡 GOPPAR + RevPAR Calculator** add to ADR vs RevPAR post (2 hr)

---

## Artifacts

- Audit JSON + markdown per post: `tests/_artifacts/seo-toolkit/{pm-listicle,str-rm-cos,rm-pillar,comp-set,adr-revpar,dyn-pricing}.{json,md}`
- AI-eligibility JSON per post: `tests/_artifacts/seo-toolkit/*-ai.json`
- Peec 90-day raw report: `/tmp/peec_revfactor_report.json` (will commit to `tests/_artifacts/`)
- AirROI live market data: `tests/_artifacts/airroi-markets-2026-05-16.json`

---

*Tools used: seo-toolkit (~/Claude/seo-toolkit, SerpApi-backed SERP comparison + 9-category scoring + 5-surface AI eligibility), Peec.ai (90-day brand visibility report for RevFactor project id `or_be14dba6-461f-4a09-8926-ebf75b550157`), AirROI markets/summary endpoint. POP was deliberately not used — see top note.*
