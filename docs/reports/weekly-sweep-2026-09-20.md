# RevFactor Weekly Toolkit Sweep — 2026-09-20

- Pages scanned: **27**
- Runtime: 2.6 min
- Ranking uses deterministic metrics only: inline_citability, receipts score, failed-passage count, CQF. The ai-eligibility fanout check (LLM, non-deterministic) never gates.
- Priority = (100−inline_citability) + (100−receipts) + 8×failed_passages + 0.5×(100−cqf); higher = fix first.

## Top 5 pages to optimize this week

| # | Page | Priority | Inline citability | Receipts | Failed passages | CQF |
|---|------|----------|-------------------|----------|-----------------|-----|
| 1 | /blog/f1-race-weekend-str-pricing-playbook/ | 223.5 | 80 | 86 | 23 | 89 |
| 2 | / | 218.0 | 25 | 31 | 8 | 80 |
| 3 | /blog/adr-vs-revpar-airbnb-hosts/ | 213.0 | 100 | 73 | 23 | 96 |
| 4 | /about/ | 196.0 | 25 | 37 | 1 | 0 |
| 5 | /blog/dynamic-pricing-str-beginners-guide/ | 188.0 | 100 | 88 | 22 | 100 |

## Concrete fixes (from the tools' own recommendations)

### 1. /blog/f1-race-weekend-str-pricing-playbook/
- [ai-eligibility/hover_preview] Tighten <title> to 40-60 chars, ensure og:site_name + Organization schema name are present for the desktop hover-preview surface.
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 23 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (23 of 23); no attribution phrase (23 of 23); no quantifiable fact (20 of 23); no named entity (8 of 23).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Link to About/Contact/Editorial-policy and expose consistent NAP (name/address/phone).
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 2. /
- [ai-eligibility/perspectives_byline] Add a visible byline (e.g. 'By Jane Doe') and Person schema with sameAs profile links. Required for AI Mode's perspectives/firsthand surface.
- [ai-eligibility/inline_citability] Sparse citable claims — content reads as opinion. Add original data, dated facts, named-entity references so AI can lift sentences as inline citations.
- [cqf] Question headings median 7 words; lengthen toward full conversational phrasing (AI Mode queries run ~3x longer than classic keywords).
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 8 passages can't stand alone as grounding evidence. Most common gaps: no date reference in passage or fresh dateModified on page (8 of 8); no outbound source link in passage (8 of 8); no attribution phrase (8 of 8); no quantifiable fact (7 of 8).
- [passages] Add id= attributes to H2/H3s so agents can deep-link/cite individual passages.
- [passages] Add dateModified to the page schema — freshness is one of the three GDSAT axes.

### 3. /blog/adr-vs-revpar-airbnb-hosts/
- [cqf] No Create-intent section — add a template, checklist, or calculator block.
- [passages] 23 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (23 of 23); no attribution phrase (18 of 23); no quantifiable fact (18 of 23); no named entity (11 of 23).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Surface a visible 'Last updated' date AND set dateModified in schema.
- [receipts] Link to About/Contact/Editorial-policy and expose consistent NAP (name/address/phone).
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

### 4. /about/
- [ai-eligibility/facet_depth] Add H2 sections covering missing facets so the page qualifies for AI Mode's 'where to go next' suggestion slot. Missing: definition, how, examples, comparison, cost.
- [ai-eligibility/perspectives_byline] Add Person schema for the author with name + sameAs.
- [ai-eligibility/inline_citability] Sparse citable claims — content reads as opinion. Add original data, dated facts, named-entity references so AI can lift sentences as inline citations.
- [cqf] Rewrite ≥2 H2/H3s to open with what/how/can/which — AI Mode queries start there.
- [cqf] No Learn-intent section — add a 'What is / how does X work' section.
- [cqf] No Decide-intent section — add a 'Which X should I choose' comparison or table.
- [cqf] No Explore-intent section — add examples / types-of / options section.
- [cqf] No Create-intent section — add a template, checklist, or calculator block.

### 5. /blog/dynamic-pricing-str-beginners-guide/
- [passages] 22 passages can't stand alone as grounding evidence. Most common gaps: no outbound source link in passage (22 of 22); no attribution phrase (22 of 22); no quantifiable fact (14 of 22); no named entity (13 of 22).
- [passages] Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- [receipts] Place a citation link next to each quantitative claim (stats, %, $ figures).

## Site-level flags

- **Sitemap hygiene**: score 100/100 — Sitemap hygiene 100/100 — 25/27 URLs checked; lastmod: 0 present, 0 contradicted, 0 unverifiable; canonical: 0 missing, 0 cross-URL
- **Signal conflicts (homepage)**: CONSISTENT
- **Crawl budget**: efficiency 93% (15/15 support 304; 1 TTFB warn/fail)
- **Bing index**: 24 URLs indexed (source: webmaster_api)

**Bing indexed count trend**: 2026-09-14: 24 -> 2026-09-20: 24

## Full ranking

| Page | Priority | Inline cit. | Receipts | Failed passages | CQF |
|------|----------|-------------|----------|-----------------|-----|
| /blog/f1-race-weekend-str-pricing-playbook/ | 223.5 | 80 | 86 | 23 | 89 |
| / | 218.0 | 25 | 31 | 8 | 80 |
| /blog/adr-vs-revpar-airbnb-hosts/ | 213.0 | 100 | 73 | 23 | 96 |
| /about/ | 196.0 | 25 | 37 | 1 | 0 |
| /blog/dynamic-pricing-str-beginners-guide/ | 188.0 | 100 | 88 | 22 | 100 |
| /blog/ | 177.0 | 55 | 21 | 4 | 58 |
| /blog/is-a-pricing-tool-enough-airbnb-revenue-management/ | 134.0 | 100 | 78 | 14 | 100 |
| /blog/best-str-revenue-management-companies-2026/ | 133.0 | 100 | 87 | 15 | 100 |
| /blog/best-airbnb-revenue-management-services-1-to-5-properties-2026/ | 126.0 | 80 | 78 | 10 | 92 |
| /blog/the-revfactor-method/ | 111.0 | 80 | 75 | 8 | 96 |
| /blog/airbnb-revenue-management-company/ | 104.0 | 100 | 86 | 11 | 96 |
| /case-studies/3br-norton-shores-mi-lake-home/ | 96.0 | 100 | 62 | 4 | 48 |
| /case-studies/4br-minneapolis-metro-home/ | 96.0 | 100 | 62 | 4 | 48 |
| /case-studies/2br-albion-mi-waterfront/ | 89.0 | 100 | 62 | 4 | 62 |
| /case-studies/5br-north-myrtle-beach-sc-home/ | 89.0 | 100 | 62 | 4 | 62 |
| /blog/str-revenue-benchmarks-2026/ | 88.5 | 100 | 72 | 7 | 91 |
| /blog/pricelabs-vs-wheelhouse-vs-done-for-you/ | 87.0 | 100 | 87 | 9 | 96 |
| /case-studies/ | 85.0 | 100 | 37 | 2 | 88 |
| /case-studies/6br-gatlinburg-cabin/ | 84.0 | 100 | 62 | 3 | 56 |
| /case-studies/2br-glenwood-springs-co-cabin/ | 81.0 | 100 | 62 | 3 | 62 |
| /case-studies/4br-norfolk-va-home/ | 79.5 | 100 | 62 | 3 | 65 |
| /blog/best-airbnb-property-managers-with-dynamic-pricing-2026/ | 79.0 | 55 | 90 | 3 | 100 |
| /case-studies/4br-san-diego-ca-rental/ | 75.5 | 100 | 62 | 2 | 57 |
| /blog/fifa-2026-world-cup-str-pricing/ | 74.0 | 100 | 70 | 5 | 92 |
| /blog/orphan-nights-gap-nights-airbnb/ | 55.0 | 80 | 91 | 3 | 96 |
| /blog/revenue-management-for-short-term-rentals/ | 44.0 | 100 | 88 | 4 | 100 |
| /blog/how-to-build-comp-set-str/ | 34.0 | 80 | 94 | 1 | 100 |
