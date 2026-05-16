# SEO Audit — `ADR vs RevPAR`

**Target:** https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/adr-vs-revpar-airbnb-hosts/  
**Page score:** **73.5/100** (C)  
**Competitors compared:** 7

## Score breakdown

| Category | Points | Note |
|---|--:|---|
| Schema | 12 | 10 types, 1 gaps |
| Lsa | 13.5 | avg coverage 54% |
| Word Count | 15 | 3,227 vs avg 1,580 (2.0×) |
| Headings | 7 | 12 h2 / 24 h3 vs avg 6.1 |
| Keyword Density | 1.0 | 0.03% density |
| Meta | 10 | title ✓; desc ✓; canonical ✓ |
| Social | 5 | og ✓; twitter ✓ |
| Image Alts | 5.0 | 12/12 alts (100%) |
| Paa Coverage | 5 | no PAA gaps |
| **Total** | **73.5** | grade **C** |

## Page metrics — target vs SERP avg

| Metric | Target | SERP avg |
|---|--:|--:|
| Word count | 3,227 | 1,580 |
| H2 count | 12 | 6.1 |
| H3 count | 24 | 12.4 |
| Title chars | 50 | 49 |
| Meta description chars | 295 | 144 |
| Primary keyword count | 1 | 3.9 |
| Keyword density % | 0.03% | — |
| Images (with alt / total) | 12 / 12 | — |

## Schema audit

**Target schemas (10):** answer, article, breadcrumblist, faqpage, imageobject, listitem, organization, person, question, webpage

### Schema types competitors use that we don't
| Type | % of competitors |
|---|--:|
| blogposting | 57% |

## LSA term coverage — target vs SERP avg

Top terms used by ≥50% of SERP top-N. Ratio = target ÷ avg.

| # | Term | Avg/comp | Target | Ratio | Read |
|--:|---|--:|--:|--:|---|
| 1 | revenue | 37.0 | 57 | 1.54 | in line |
| 2 | room | 22.5 | 5 | 0.22 | **under-using** |
| 3 | hotel | 21.7 | 3 | 0.14 | **under-using** |
| 4 | rooms | 19.2 | 0 | 0.0 | **under-using** |
| 5 | occupancy | 17.6 | 34 | 1.93 | in line |
| 6 | rate | 14.1 | 20 | 1.41 | in line |
| 7 | total | 11.3 | 13 | 1.15 | in line |
| 8 | available | 10.4 | 18 | 1.73 | in line |
| 9 | per | 10.0 | 13 | 1.3 | in line |
| 10 | metrics | 8.1 | 5 | 0.61 | below avg |
| 11 | performance | 7.9 | 9 | 1.15 | in line |
| 12 | average | 7.7 | 8 | 1.04 | in line |
| 13 | costs | 9.5 | 0 | 0.0 | **under-using** |
| 14 | pricing | 7.7 | 34 | 4.43 | deep coverage (4.43×) |
| 15 | important | 8.2 | 0 | 0.0 | **under-using** |
| 16 | formula | 9.7 | 3 | 0.31 | **under-using** |
| 17 | rates | 6.4 | 13 | 2.02 | deep coverage (2.02×) |
| 18 | sold | 7.4 | 1 | 0.14 | **under-using** |
| 19 | example | 7.2 | 4 | 0.56 | below avg |
| 20 | understand | 7.0 | 0 | 0.0 | **under-using** |
| 21 | management | 6.3 | 18 | 2.84 | deep coverage (2.84×) |
| 22 | guest | 6.6 | 1 | 0.15 | **under-using** |
| 23 | metric | 6.0 | 15 | 2.5 | deep coverage (2.5×) |
| 24 | goppar | 8.3 | 0 | 0.0 | **under-using** |
| 25 | high | 5.4 | 4 | 0.74 | below avg |

## PAA — what Google ranks for this keyword

- Is RevPAR the same as ADR?
- How do you calculate RevPAR and ADR?
- Which is better, RevPAR or ADR?
- What is a good ADR for hotels?

## Related searches Google surfaces

- RevPAR formula
- ADR and RevPAR formula
- ADR vs ARR
- RevPAR hotel
- RevPAR Calculator
- ADR hotel
- RevPAR ADR
- RevPAR vs RevPOR

## Recommendations

### [INFO] LLM returned non-JSON
- **Action:** {"recommendations": [
  {
    "priority": "critical",
    "title": "Fix near-zero primary keyword density",
    "data_anchor": "Target keyword density 0.03% (1 mention in 3,227 words) vs competitor avg 3.9%; keyword_density score 1/15.",
    "where": "Intro (first 100 words), H1, at least 3 H2s, and conclusion.",
    "action": "Use the exact phrase 'ADR vs RevPAR' naturally 15-25 times across the article. Ensure it appears in the opening sentence, in section headings like 'ADR vs RevPAR Formula 
