# RevFactor autopilot — house constraints + verification gate

**Read this file before emitting any recommendation.** It encodes decisions already made.
A recommendation that contradicts this file is a bug, not a suggestion.

Created 2026-08-24 after a review of the 2026-08-23 run found **9 of 30 recommendations were wrong** —
not marginal, but factually contradicted by the live page or by house strategy.

---

## 1. Hard constraints — never recommend against these

| # | Constraint | Why | The bad rec it would have blocked |
|---|---|---|---|
| C1 | **Meta descriptions target <320 chars in a two-part structure**: ~140–155 char SEO opener ending on a clean full stop, then a citation-ready AEO definition. | Google displays ~155 but indexes the whole string; LLM crawlers read the full tag as page-summary context. Two-part wins SERP CTR *and* AI citation. | "Trim meta to ~150 chars" on 3 pages. All 3 were already correct implementations. One of them is the reference example for the standard. |
| C2 | **Never recommend adding `Article` schema to a page that already emits `BlogPosting`.** | `BlogPosting` is a schema.org subtype of `Article`. Any parser keying on Article resolves it via subtype. | "Add Article alongside BlogPosting" on 2 pages. Moves no metric. |
| C3 | **The blog layout already emits Person + BlogPosting + FAQPage + BreadcrumbList + Organization sitewide.** Check the rendered page before recommending any of them. | Already built. | "Add Organization + Person schema linkage" — already live with `@id`, `jobTitle`, `sameAs`, and publisher linked by `@id`. |
| C4 | **No client, property, or owner names.** Results are shown by market + property type only. | Client privacy rule. | — |
| C5 | **No fabricated stats or quotes.** Every cited number hyperlinks to a source that loads. Fede quotes come from the content brain or are unattributed editorial pull-quotes. | Get Cito rule + house rule. | — |
| C6 | **Visual density is a hard bar.** Any new section recommendation must say which `rf-*` component carries it (`rf-chart`, `rf-diagram`, `rf-figure`, `rf-bleed`, `rf-band`), and every image needs an overlay quote. | A text-only "add 300 words" rec produces a wall of text, which Get Cito already flagged once. | — |
| C7 | **Tax, legal, and medical advice is out of lane.** | Off-ICP for a revenue-management brand and a liability surface. | "Answer the STR tax-loophole PAA questions." |
| C8 | **Never recommend renumbering or restructuring the `## N. Vendor` H2s in a listicle.** | They are the ItemList entries. | — |

---

## 2. Verification gate — run before emitting, drop what fails

Every recommendation must carry a claim that is **re-checked against the live page at emit time**.
If the check fails, drop the rec silently. Do not emit it with a caveat.

**V1 — Lemma-family counts, not exact tokens.**
Count the stem family, not the surface form. Report the family total and the dominant form.

The 2026-08-23 run produced four false gaps this way:

| Rec said | Live page actually had |
|---|---|
| `guests` = 0, "reintroduce the guest experience angle" | `guest` = **19** |
| `guests` = 3 vs avg 7, "biggest under-index" | `guest` = **30** |
| `minimums` = 4 vs avg 7.3 | `minimum` = **98** (the rec itself noted the singular was over-indexed — and emitted anyway) |
| `dynamic pricing` count = 0, "add 8–12×" | **30 occurrences**, and the phrase is in the `<title>` |

Rule: if `count(lemma_family) >= 0.5 × competitor_avg`, there is no gap. Drop it.

**V2 — Re-read the claimed number off the live DOM before emitting.**
If a rec asserts "X appears N times" / "title is N chars" / "no Y schema", fetch and confirm.
A rec whose own premise is false is worse than no rec: it burns reviewer trust on every other rec in the report.

**V3 — Read structure from the DOM, never assume it.**
The run recommended "demote each vendor's sub-attributes (`Pricing`, `Best for`, `Verdict`) from H2 to H3."
Those are **bold inline labels**, not headings. The suggested edit had no target.
Parse the actual heading tree and quote the real headings you want changed.

**V4 — Every rec names the metric it moves.**
`rank | AI citation | CTR | conversion`. A rec that can't name one is busywork — drop it.

---

## 3. Report format — add a "Since last week" section at the top

The run is currently **open-loop**: it recommends, but never learns whether last week's edits worked.
Three data streams already exist and do not talk to each other.

| Stream | Where it lives now | Cadence |
|---|---|---|
| Rank snapshots | inside the weekly autopilot run | weekly |
| AI visibility / citations | `revfactor-peec-snapshot` Render cron, state in `peec_snapshot.json`, posts to Slack | daily 13:00 UTC |
| GSC clicks/impressions/position | not pulled by the run at all | — |

**The missing fourth piece is a changelog.** Without a record of *what changed and when*, no movement can be attributed.

### Build
1. **`docs/reports/changelog.json`** — the run appends one entry per shipped change:
   `{url, date, rec_type, rec_summary, commit_sha}`.
2. **New section `## 0. Since last week`, at the TOP of the report**, one row per URL touched in the previous run:

| URL | Shipped | Rank Δ | GSC Δ (impr / clicks / pos) | AI visibility Δ | Verdict |
|---|---|---|---|---|---|

- GSC window clamped to the most recent **fully-reported** 7 days vs the prior 7 (the API lags 2–3 days; unclamped windows read as fake drops).
- AI visibility Δ from the Peec state file: share of voice, prompts won/lost, citation count.
- Verdict: `worked` / `no move` / `regressed` / `too early` (<14 days).

3. **Score recommendation *types* over time.** Keep a rolling table of `rec_type → times applied → times followed by a positive verdict`.
   Rec types that never move anything get deprioritized in future runs. Rec types that consistently move something get promoted.
   That is the feedback loop: the run's own history becomes its prior.

4. **Baseline honesty.** With fewer than two in-window snapshots, say "baseline, no comparison possible" — never "no drops detected." Those are different statements.

---

## 4. Cadence reality check

The SOP targets 5 optimizations/week. The 2026-08-23 run shipped 4 and explicitly dropped 3 pages
rather than pad with date bumps. **That was correct** — do it again. A page with nothing real to change
must not be shipped as an `updatedDate` bump. Make the change first, then bump the date. Never the reverse.

## 5. Flow (unchanged)

`toolkit → constraints + verification gate → human judgment → staging branch → Faulen QA → live → IndexNow`

Nothing goes live without Faulen's sign-off.
