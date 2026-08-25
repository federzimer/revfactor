# Do we need Page Optimizer Pro? — evaluation, 2026-08-24

**Answer: no.** Build on `scripts/seo/page_vs_serp.py`. Keep POP as a quarterly calibration
check on one page (~4 credits/year) rather than a data source (~192/year).

Three things were done to reach that answer: the homegrown tool was fixed and wired to live
SERP data, it was run against every blog page, and GSC was checked to see which kind of query
actually earns this site its impressions. The third one is the finding that matters most.

---

## 1. The GSC finding that reframes the question

90-day window (2026-05-23 to 2026-08-21), `https://www.revfactor.io/`, non-branded:

| Query shape | Queries | Impressions | Clicks | Avg position |
|---|--:|--:|--:|--:|
| 1-3 words (classic head) | 134 | 2,126 (26.5%) | **144** | 12.4 |
| 4-7 words (long tail) | 108 | 687 (8.6%) | 2 | 16.6 |
| **8+ words (conversational / AI Mode)** | 316 | **5,220 (65.0%)** | **0** | **6.2** |

558 unique queries, 8,033 impressions, 146 clicks total.

Two thirds of impressions come from long conversational queries that rank at position 6.2 and
return **zero** clicks. That is the AI-surface signature: the answer is synthesized, not clicked.
Real examples pulled from GSC:

- "does beyond provide dynamic pricing tools that automatically adjust short-term rental rates based on demand signals, seasonality, and market data?" (96 imp, pos 5.4)
- "evaluate the revenue management company rankbreeze on short term rental pricing tool" (57 imp, pos 3.9)
- "find management companies that handle dynamic pricing for my us property." (40 imp, pos 4.4)

**Why this decides the POP question.** POP's entire model is keyword to SERP top-10 to term
coverage. That model only addresses the 26.5% classic-keyword bucket. It has nothing to say about
the 65% bucket, which is a citation game and is exactly what the weekly sweep already measures
(passages, inline citability, CQF).

The 26.5% is still worth optimising — it produces 100% of the clicks, at a weak average position
of 12.4. But it should be sized as a quarter of the opportunity, not the whole programme, and it
does not justify a per-credit vendor when we already have the tool.

## 2. The homegrown tool now works

`scripts/seo/page_vs_serp.py`, built 2026-05 and unused since. Three fixes today (commit 77346a5):

1. **Lemma families.** It counted raw surface forms, so `guest` and `guests` were different terms.
   That is the identical defect that produced four false gap recommendations in the 2026-08-23
   autopilot run. Now collapses plurals before counting, leaving business/analysis/status intact.
2. **Live SERP competitors via DataForSEO.** The competitor list was a hand-kept file seeded from
   one POP run in May and hardcoded to a single keyword. `--auto` now pulls the live top-N plus PAA.
3. **Coverage gate.** Competitor sites are heavily bot-guarded. A bare requests UA got 403 from 5
   of 9 on the first test and the tool computed "SERP averages" from the surviving 4 without saying
   so. Browser headers fixed most of it; what still fails is now counted and the report renders an
   UNRELIABLE banner below 60% coverage.

## 3. Full run across all 14 blog pages

| Page | Coverage | Usable | Our words | SERP avg | Ratio | Sweep rank |
|---|--:|:--:|--:|--:|--:|--:|
| adr-vs-revpar-airbnb-hosts | 100% | yes | 3,523 | 1,763 | 2.0x | 8 |
| best-airbnb-property-managers-with-dynamic-pricing-2026 | 86% | yes | 7,870 | 1,939 | 4.1x | 4 |
| dynamic-pricing-str-beginners-guide | 78% | yes | 5,783 | 1,152 | 5.0x | 5 |
| best-str-revenue-management-companies-2026 | 71% | yes | 5,464 | 2,011 | 2.7x | 11 |
| f1-race-weekend-str-pricing-playbook | 71% | yes | 3,584 | 1,502 | 2.4x | 6 |
| airbnb-revenue-management-company | 67% | yes | 4,332 | 2,236 | 1.9x | 14 |
| revenue-management-for-short-term-rentals | 67% | yes | 10,375 | 1,065 | **9.7x** | 3 |
| the-revfactor-method | 62% | yes | 3,785 | 369 | **10.3x** | 13 |
| orphan-nights-gap-nights-airbnb | 57% | no | 8,138 | 638 | 12.8x | 2 |
| how-to-build-comp-set-str | 44% | no | 4,362 | 1,730 | 2.5x | 1 |
| str-revenue-benchmarks-2026 | 43% | no | 1,889 | 2,785 | 0.7x | 15 |
| fifa-2026-world-cup-str-pricing | 38% | no | 2,499 | 4,248 | 0.6x | 16 |
| is-a-pricing-tool-enough-airbnb-revenue-management | 33% | no | 4,074 | 1,668 | 2.4x | 12 |
| pricelabs-vs-wheelhouse-vs-done-for-you | n/a | no | — | — | — | new |

**8 of 14 usable.** The 6 failures are all bot-guarded competitor sets (AirDNA, CoStar,
HotelTechReport). Not worth chasing further; flag and skip is the right handling.

The new post errored because it is not live yet. Expected.

## 4. Two conclusions for the Sunday run

**C9 is mandatory, and this run proves it.** Eleven of twelve measured pages run 1.9x to 12.8x the
SERP average word count. A POP-style word-count target applied literally would cut the pillar from
10,375 words to 1,065 and the method page from 3,785 to 369. POP's one real report on us already
said exactly this: trim the property-managers listicle from 8,920 to 2,129. Depth is the AI-citation
strategy, and the 65% conversational bucket at position 6.2 is what that depth is buying. Word-count
and heading-count targets are advisory floors, never ceilings, and never apply to a listicle.

**`page_vs_serp` must not drive the rotation.** Its ordering does not reproduce the weekly sweep's,
because they measure different things, and its coverage is unreliable on 6 of 14 pages. The sweep
covers all pages deterministically and for free, so the sweep picks the pages; `page_vs_serp` then
runs on whatever the sweep picked. Skip its output entirely when coverage is under 60%.

## 5. Cost

DataForSEO live SERP is roughly $0.002 per call. The full 14-page run cost about $0.03 against a
$48.96 balance. POP is per-credit and per-seat.
