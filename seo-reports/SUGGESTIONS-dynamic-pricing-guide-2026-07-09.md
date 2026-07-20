# Passage-grounding suggestions — Dynamic Pricing Guide (2026-07-09)

Page: https://revfactor.io/blog/dynamic-pricing-str-beginners-guide/
Current: 62/100 citation-readiness, 10/35 passages citable. CQF already 92 — content structure needs nothing; this is an evidence retrofit only. Keep Fede's voice; no invented stats.

## 1. Link the sources already cited (biggest single lever)
The guide names Lighthouse / Key Data (2×), AirROI (4×), and Your.Rentals — with **zero actual outbound links**. Every "according to" passage scores authority 25 instead of 55+ because the attribution phrase is there but the link isn't.
- Lighthouse / Key Data 41% adoption stat → link the Jamie Lane / Lighthouse source post
- AirROI chart figcaptions + intra-market spread paragraph → link airroi.com (or the market page used)
- Your.Rentals 541-listing study (+15–36%) → link the study
Internal links don't count for this axis — external only.

## 2. Rewrite 4 thin section intros to stand alone (each currently <35 words, no entity, no number)
- **"Reading the Pricing Dashboard"** → open with the complete claim: name all four numbers (pacing, RevPAR, conversion rate, comp-set position percentile) + "weekly" in the first sentence.
- **"The Most Common Beginner Mistakes"** → quantify the sample: "Across the ~N host audits I've run…" (real N from Fede).
- **"Two Real Airbnb Properties"** → pull the numbers up into the intro: "$4,000 → $7,000 in one month" + "40% occupancy at 3× revenue".
- **"Trigger 1: Scaling beyond three properties"** → add the concrete threshold claim with digits ("3+ properties", hours/week).

## 3. One digit per Mistake section
Mistakes 2, 3, 4, and 6 contain no quantifiable fact, so none is citable. Each needs one real number, in digits:
- Mistake 2: "roughly 50% of auto-suggested comps don't compete with you" (already says "half" — use digits)
- Mistake 3: "set-and-forget decays after ~6 months" (digits) + what a stale base rate cost a real property (%/$, from portfolio)
- Mistake 4: quantify the off-season leak from a blanket 3-night minimum (portfolio example)
- Mistake 6: pacing lead time in days (already implied 30–60 — state it here)
Source: Fede/portfolio data only. If no real number exists, leave prose as is.

## 4. Add a standalone quotable sentence under the big visual blocks
The seven-signals grid (313w), six-step playbook (364w), and four-number scoreboard (322w) extract as one giant passage each — too long to lift. Add one self-contained summary sentence directly under each heading, e.g.:
> "Modern pricing engines read seven signals — seasonality, day of week, lead time, comp-set rates, local events, supply pressure, and your own booking pace — and six of them shift every week."
That sentence becomes the citable passage; the grid stays as-is for humans.

## 5. Date-stamp current-state claims
Add "as of 2026" (or month-year) next to the adoption stat, the PriceLabs market-share claim, and the RevFactor portfolio figures. Kate Henry (2021) is fine as history — pair it with one current-portfolio result if available.

## Template note (already verified, no action)
BlogPosting schema with datePublished/dateModified + Person(sameAs) is emitted correctly by `src/pages/blog/[...slug].astro`. The earlier "no dateModified" finding was a toolkit parser bug (fixed, commit 9b130cc in axw4319/seo-toolkit).

## Corrected scores across all three pages (post-bugfix)
| Page | CQF | Passage grounding |
|---|---|---|
| Homepage | 80 | 43 (0/8 citable) |
| Revenue-management pillar | 96 | 66 (16/45) |
| Dynamic-pricing guide | 92 | 62 (10/35) |
