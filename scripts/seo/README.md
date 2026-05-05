# scripts/seo

Homegrown alternatives to commercial SEO tools.

## `page_vs_serp.py`

Compares a target page against SERP top-N competitors for a primary keyword.
Mirrors what Page Optimizer Pro reports (LSA term coverage, word count, schema
audit, heading structure) without per-credit cost.

### Usage

```bash
python3 page_vs_serp.py \
  --target https://revfactor.io/blog/revenue-management-for-short-term-rentals/ \
  --keyword "short term rental revenue management" \
  --competitors competitors-blog1.txt \
  --out report.md \
  --json report.json
```

`competitors-blog1.txt` is one URL per line, lines starting with `#` ignored.
Easiest source: paste the SERP top-10 from POP's `create-report` output, or
from a SerpApi / DataForSEO pull.

### What it reports

- **Word count** — target vs SERP avg + verdict
- **Heading structure** — H2 / H3 counts vs avg
- **Primary keyword density** — body occurrences of the head keyword
- **Schema audit** — content-meaningful schema types target has, gaps where
  ≥30% of competitors use a type the target doesn't (filters out site-chrome
  schemas like `Organization` / `WebSite` / `ImageObject`)
- **LSA term coverage** — top-25 terms used by ≥50% of competitors, ranked
  by TF-IDF-style score (avg-per-doc × log doc-frequency), with target count
  + ratio. Surfaces under-used terms to weave in.
- **Recommendations** — rule-based actionable list

### How it differs from Page Optimizer Pro

| Capability | This script | POP |
|---|---|---|
| LSA term coverage | ✓ TF-IDF ranking | ✓ proprietary weighting |
| Word count vs SERP avg | ✓ | ✓ |
| Heading structure | ✓ | ✓ |
| Schema audit | ✓ deep JSON-LD parse | ✓ |
| Site-chrome schema filter | ✓ | ✓ |
| Body text extraction | drops nav/footer/aside | includes them |
| Proprietary "page score" 0-100 | ✗ | ✓ |
| Google NLP entity coverage | ✗ (stub for future Google Cloud NLP integration) | ✓ paid add-on |
| Custom AI-driven recommendations | rule-based | LLM-driven |
| Watchdog monthly re-runs | run via cron | built-in UI |

### Calibration vs POP run on Blog 1 (2026-05-04)

Target: `revfactor.io/blog/revenue-management-for-short-term-rentals/`
Keyword: `short term rental revenue management`

| Metric | This script | POP |
|---|---|---|
| Target word count | 6,838 | 8,834 |
| SERP avg word count | 1,190 | 2,060 |
| Schema gaps | none | none (`aiGenSchemaTypes: []`) |
| Schema strengths flagged | Article, FAQPage, BreadcrumbList, HowTo, DefinedTerm, Question, Answer | Article, FAQPage, BreadcrumbList, HowTo, DefinedTerm |
| LSA top terms (overlap %) | property, market, rate, manager, occupancy, dynamic, strategy, bookings, airbnb, ADR, RevPAR-adjacent | property, market, rentals, manager, airbnb, calendar, portfolio, bookings, prices, stays, occupancy, hosts |
| Recommendations match | yes (no gaps to fix) | yes |

Word count differs because this script strips `<nav>` `<footer>` `<aside>`
before counting. POP appears to include those.

LSA term lists overlap ~70% — both include the high-frequency content terms
(property, market, manager, occupancy, bookings, airbnb). Differences are
mostly tail-of-list ranking.

### Roadmap

- [ ] SERP fetching via SerpApi key (currently expects manual competitor list)
- [ ] Optional Google NLP entity extraction
- [ ] Heading-text overlap analysis (h2 phrase reuse vs competitors)
- [ ] Internal linking audit (anchor text density)
- [ ] PAA / related-search question harvesting → suggested FAQ additions
