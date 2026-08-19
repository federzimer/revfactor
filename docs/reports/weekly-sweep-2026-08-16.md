# RevFactor Weekly Toolkit Sweep — 2026-08-16

- Pages scanned: **14**
- Runtime: 1.0 min
- Ranking uses deterministic metrics only: inline_citability, receipts score, failed-passage count, CQF. The ai-eligibility fanout check (LLM, non-deterministic) never gates.
- Priority = (100−inline_citability) + (100−receipts) + 8×failed_passages + 0.5×(100−cqf); higher = fix first.

## Top 5 pages to optimize this week

| # | Page | Priority | Inline citability | Receipts | Failed passages | CQF |
|---|------|----------|-------------------|----------|-----------------|-----|
| 1 | /blog/how-to-build-comp-set-str/ | 406.0 | 55 | 85 | 43 | 96 |
| 2 | /blog/orphan-nights-gap-nights-airbnb/ | 326.5 | 55 | 80 | 32 | 89 |
| 3 | /blog/revenue-management-for-short-term-rentals/ | 249.0 | 100 | 85 | 29 | 96 |
| 4 | /blog/dynamic-pricing-str-beginners-guide/ | 238.0 | 80 | 86 | 25 | 92 |
| 5 | /blog/best-str-revenue-management-companies-2026/ | 237.0 | 55 | 80 | 21 | 92 |

## Concrete fixes (from the tools' own recommendations)

### 1. /blog/how-to-build-comp-set-str/
- [ai-eligibility/inline_citability] Increase atomic-claim density: add stats, dated specifics, named studies, or 'according to X' citations targeting ≥5 per 1k words.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 43 passages can't stand alone as grounding evidence. Most common gaps: long (121 words; consider splitting); long (126 words; consider splitting); long (135 words; consider splitting); long (165 words; consider splitting).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Link to About/Contact/Editorial-policy and expose consistent NAP (name/address/phone).
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 2. /blog/orphan-nights-gap-nights-airbnb/
- [ai-eligibility/inline_citability] Increase atomic-claim density: add stats, dated specifics, named studies, or 'according to X' citations targeting ≥5 per 1k words.
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 32 passages can't stand alone as grounding evidence. Most common gaps: depends on a visual ('see chart/table'); long (121 words; consider splitting); long (129 words; consider splitting); long (135 words; consider splitting).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Surface a visible 'Last updated' date AND set dateModified in schema.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 3. /blog/revenue-management-for-short-term-rentals/
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 29 passages can't stand alone as grounding evidence. Most common gaps: long (122 words; consider splitting); long (145 words; consider splitting); long (150 words; consider splitting); long (160 words; consider splitting).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 4. /blog/dynamic-pricing-str-beginners-guide/
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 25 passages can't stand alone as grounding evidence. Most common gaps: long (165 words; consider splitting); long (186 words; consider splitting); long (208 words; consider splitting); long (213 words; consider splitting).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 5. /blog/best-str-revenue-management-companies-2026/
- [ai-eligibility/inline_citability] Increase atomic-claim density: add stats, dated specifics, named studies, or 'according to X' citations targeting ≥5 per 1k words.
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 21 passages can't stand alone as grounding evidence. Most common gaps: long (165 words; consider splitting); long (173 words; consider splitting); long (214 words; consider splitting); long (216 words; consider splitting).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Surface a visible 'Last updated' date AND set dateModified in schema.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

## Site-level flags

- **Sitemap hygiene**: score 100/100 — Sitemap hygiene 100/100 — 14/14 URLs checked; lastmod: 0 present, 0 contradicted, 0 unverifiable; canonical: 0 missing, 0 cross-URL
- **Signal conflicts (homepage)**: CONSISTENT
- **Crawl budget**: efficiency 100% (14/14 support 304; 0 TTFB warn/fail)
- **Bing index**: 9740 URLs indexed (Δ +9740 vs last snapshot)

**Bing indexed count trend**: 2026-08-04: 0 -> 2026-08-09: 0 -> 2026-08-16: 9740

## Full ranking

| Page | Priority | Inline cit. | Receipts | Failed passages | CQF |
|------|----------|-------------|----------|-----------------|-----|
| /blog/how-to-build-comp-set-str/ | 406.0 | 55 | 85 | 43 | 96 |
| /blog/orphan-nights-gap-nights-airbnb/ | 326.5 | 55 | 80 | 32 | 89 |
| /blog/revenue-management-for-short-term-rentals/ | 249.0 | 100 | 85 | 29 | 96 |
| /blog/dynamic-pricing-str-beginners-guide/ | 238.0 | 80 | 86 | 25 | 92 |
| /blog/best-str-revenue-management-companies-2026/ | 237.0 | 55 | 80 | 21 | 92 |
| /blog/best-airbnb-property-managers-with-dynamic-pricing-2026/ | 231.5 | 80 | 87 | 24 | 87 |
| /blog/f1-race-weekend-str-pricing-playbook/ | 223.5 | 80 | 86 | 23 | 89 |
| / | 218.0 | 25 | 31 | 8 | 80 |
| /blog/ | 212.0 | 25 | 21 | 4 | 48 |
| /blog/adr-vs-revpar-airbnb-hosts/ | 197.0 | 100 | 73 | 21 | 96 |
| /about/ | 196.0 | 25 | 37 | 1 | 0 |
| /blog/the-revfactor-method/ | 136.0 | 55 | 75 | 8 | 96 |
| /blog/airbnb-revenue-management-company/ | 110.0 | 80 | 86 | 9 | 92 |
| /blog/fifa-2026-world-cup-str-pricing/ | 74.0 | 100 | 70 | 5 | 92 |
