# RevFactor Weekly Toolkit Sweep — 2026-08-30

- Pages scanned: **17**
- Runtime: 1.4 min
- Ranking uses deterministic metrics only: inline_citability, receipts score, failed-passage count, CQF. The ai-eligibility fanout check (LLM, non-deterministic) never gates.
- Priority = (100−inline_citability) + (100−receipts) + 8×failed_passages + 0.5×(100−cqf); higher = fix first.

## Top 5 pages to optimize this week

| # | Page | Priority | Inline citability | Receipts | Failed passages | CQF |
|---|------|----------|-------------------|----------|-----------------|-----|
| 1 | /blog/how-to-build-comp-set-str/ | 399.0 | 55 | 90 | 43 | 100 |
| 2 | /blog/orphan-nights-gap-nights-airbnb/ | 326.5 | 55 | 80 | 32 | 89 |
| 3 | /blog/revenue-management-for-short-term-rentals/ | 249.0 | 100 | 85 | 29 | 96 |
| 4 | /blog/best-airbnb-property-managers-with-dynamic-pricing-2026/ | 238.5 | 80 | 88 | 25 | 87 |
| 5 | /blog/dynamic-pricing-str-beginners-guide/ | 238.0 | 80 | 86 | 25 | 92 |

## Concrete fixes (from the tools' own recommendations)

### 1. /blog/how-to-build-comp-set-str/
- [ai-eligibility/inline_citability] Increase atomic-claim density: add stats, dated specifics, named studies, or 'according to X' citations targeting ≥5 per 1k words.
- [passages] 43 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (43 of 43); no attribution phrase (42 of 43); no quantifiable fact (32 of 43); no named entity (32 of 43).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 2. /blog/orphan-nights-gap-nights-airbnb/
- [ai-eligibility/inline_citability] Increase atomic-claim density: add stats, dated specifics, named studies, or 'according to X' citations targeting ≥5 per 1k words.
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 32 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (28 of 32); no attribution phrase (27 of 32); long (23 of 32); no named entity (20 of 32).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Surface a visible 'Last updated' date AND set dateModified in schema.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 3. /blog/revenue-management-for-short-term-rentals/
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 29 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (29 of 29); no attribution phrase (24 of 29); no quantifiable fact (17 of 29); long (15 of 29).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 4. /blog/best-airbnb-property-managers-with-dynamic-pricing-2026/
- [cqf] Question headings median 7 words; lengthen toward full conversational phrasing (AI Mode queries run ~3x longer than classic keywords).
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 25 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (25 of 25); no attribution phrase (23 of 25); long (21 of 25); no quantifiable fact (13 of 25).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 5. /blog/dynamic-pricing-str-beginners-guide/
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 25 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (25 of 25); no attribution phrase (25 of 25); no quantifiable fact (15 of 25); no named entity (13 of 25).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

## Site-level flags

- **Sitemap hygiene**: score 100/100 — Sitemap hygiene 100/100 — 17/17 URLs checked; lastmod: 0 present, 0 contradicted, 0 unverifiable; canonical: 0 missing, 0 cross-URL
- **Signal conflicts (homepage)**: CONSISTENT
- **Crawl budget**: efficiency 100% (15/15 support 304; 0 TTFB warn/fail)
- **Bing index**: 1 URLs indexed (Δ -12499 vs last snapshot) — ⚠ PROBABLE DEINDEX EVENT

**Bing indexed count trend**: 2026-08-23: 12500 -> 2026-08-30: 1

## Full ranking

| Page | Priority | Inline cit. | Receipts | Failed passages | CQF |
|------|----------|-------------|----------|-----------------|-----|
| /blog/how-to-build-comp-set-str/ | 399.0 | 55 | 90 | 43 | 100 |
| /blog/orphan-nights-gap-nights-airbnb/ | 326.5 | 55 | 80 | 32 | 89 |
| /blog/revenue-management-for-short-term-rentals/ | 249.0 | 100 | 85 | 29 | 96 |
| /blog/best-airbnb-property-managers-with-dynamic-pricing-2026/ | 238.5 | 80 | 88 | 25 | 87 |
| /blog/dynamic-pricing-str-beginners-guide/ | 238.0 | 80 | 86 | 25 | 92 |
| /blog/f1-race-weekend-str-pricing-playbook/ | 223.5 | 80 | 86 | 23 | 89 |
| / | 218.0 | 25 | 31 | 8 | 80 |
| /blog/adr-vs-revpar-airbnb-hosts/ | 197.0 | 100 | 73 | 21 | 96 |
| /about/ | 196.0 | 25 | 37 | 1 | 0 |
| /blog/ | 177.0 | 55 | 21 | 4 | 58 |
| /blog/best-str-revenue-management-companies-2026/ | 173.0 | 100 | 87 | 20 | 100 |
| /blog/is-a-pricing-tool-enough-airbnb-revenue-management/ | 142.0 | 100 | 78 | 15 | 100 |
| /blog/the-revfactor-method/ | 136.0 | 55 | 75 | 8 | 96 |
| /blog/pricelabs-vs-wheelhouse-vs-done-for-you/ | 112.0 | 100 | 78 | 11 | 96 |
| /blog/airbnb-revenue-management-company/ | 110.0 | 80 | 86 | 9 | 92 |
| /blog/str-revenue-benchmarks-2026/ | 91.0 | 100 | 72 | 7 | 86 |
| /blog/fifa-2026-world-cup-str-pricing/ | 74.0 | 100 | 70 | 5 | 92 |
