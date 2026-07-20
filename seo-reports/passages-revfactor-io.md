# Passage grounding audit (GDSAT) — https://www.revfactor.io/

**Citation-readiness score:** 43/100
**Passages:** 0/8 citable (composite ≥60)
**Freshness:** no dateModified/datePublished in schema · **Stable anchors:** False

## Findings

- 8 passages extracted; 0 score ≥60 (citable as standalone evidence).
- Page freshness signal: no dateModified/datePublished in schema.
- Stable heading anchors (id=): 0/7 headed sections.

## Passages (completeness / freshness / authority → composite)

- ❌ **28** (30/35/20) — Pricing without strategy is just guessing.
  - no named entity; no quantifiable fact; thin (21 words; target 40-120); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **28** (30/35/20) — "What is every night worth?"
  - no named entity; no quantifiable fact; thin (16 words; target 40-120); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **28** (30/35/20) — Ready to maximize your revenue?
  - no named entity; no quantifiable fact; thin (21 words; target 40-120); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **41** (60/35/20) — REVENUE MANAGEMENT FOR SHORT-TERM RENTALS We combine dynamic…
  - no quantifiable fact; thin (24 words; target 40-120); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **41** (60/35/20) — DYNAMIC CALENDAR
  - no quantifiable fact; thin (16 words; target 40-120); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **41** (60/35/20) — Real hosts, real revenue.
  - no quantifiable fact; long (173 words; consider splitting); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **41** (60/35/20) — Everything you need to know.
  - no quantifiable fact; long (143 words; consider splitting); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)
- ❌ **54** (90/35/20) — REVENUE INTELLIGENCE
  - thin (27 words; target 40-120); no date reference in passage or fresh dateModified on page; no outbound source link in passage; no attribution phrase ('according to', 'study by', …)

## Recommendations

- 8 passages can't stand alone as grounding evidence. Most common gaps: long (143 words; consider splitting); long (173 words; consider splitting); no attribution phrase ('according to', 'study by', …); no date reference in passage or fresh dateModified on page.
- Add id= attributes to H2/H3s so agents can deep-link/cite individual passages.
- Add dateModified to the page schema — freshness is one of the three GDSAT axes.
- Add per-section source links or 'according to X' attributions — authority is scored per passage, not per page.
- No passage currently self-contains entity + fact + closure; rewrite key sections to open with a complete, quotable claim.
