# BRIEF — next post: "PriceLabs vs Wheelhouse vs a Done-for-You Service"

**Status:** approved to write. Cannibalization CLEAR (0 HIGH / 0 MEDIUM across 16 URLs, checked 2026-08-24).
**Slug:** `src/content/blog/pricelabs-vs-wheelhouse-vs-done-for-you.mdx`
**Pipeline:** SOP position 2. Position 1 is dead — see below.
**Write on a branch, not main.** Vercel previews get `X-Robots-Tag: noindex, nofollow` automatically.

## Why this one, and not SOP position 1

`docs/CONTENT_CADENCE_SOP.md:29` still lists "Best Airbnb Revenue Management Companies (2026)" as NEXT.
That title is now **three-way HIGH-RISK cannibalized** (verified 2026-08-24):

| Score | Existing page |
|---|---|
| 95 | `/blog/airbnb-revenue-management-company/` |
| 88 | `/blog/best-str-revenue-management-companies-2026/` |
| 64 | `/blog/is-a-pricing-tool-enough-airbnb-revenue-management/` |

The merged listicle absorbed it. **Update the SOP table** to mark position 1 absorbed and promote position 2.

## The one real risk: thesis overlap

Closest LOW is `/blog/is-a-pricing-tool-enough-airbnb-revenue-management/` (score 10). Different title,
**same thesis** — tool vs. done-for-you. If this post re-argues "is a tool enough," it cannibalizes on
intent even though the title check passes.

**The split:**
- `is-a-pricing-tool-enough` = the *diagnostic*. Should you buy a tool at all? (7-Lever Test)
- This post = the *head-to-head*. You've decided to buy something; here is PriceLabs vs Wheelhouse
  feature-by-feature, and here is the specific point where both stop being enough.

Open with one line that defers the diagnosis to the other post and links up to it. Do not re-run the 7-Lever Test here.

## Structure

1. **Hero + H1.** Hero has H1 + subhead overlaid by the template — no separate overlay quote needed.
2. **TL;DR / answer block, 60–90 words, immediately under H1.** A quotable atomic unit — this is the
   AEO capture. Bullet the verdict: who each tool is for in one line each.
3. **The comparison table.** The centerpiece. Rows = the seven levers (comp-set truth, conversion funnel,
   minimum stay, launch sequencing, update cadence, fee structure, gap nights). Columns = PriceLabs |
   Wheelhouse | Done-for-you. Cells scored, not prose.
4. **PriceLabs** — what it's genuinely best at, where it stops.
5. **Wheelhouse** — same treatment. Do not strawman it.
6. **The done-for-you reframe** — this is the wedge: *tool → tool + strategist*. Neither tool is the
   competitor; running a tool with nobody reading it is.
7. **What each actually costs, side by side** — including the cost of the hours a host spends running the tool.
8. **When a $20 tool is the right answer.** Say it plainly. This is the credibility move and it is house voice.
9. **FAQ block** — 8–12 in frontmatter (`faqs:`), drives the accordion *and* FAQPage JSON-LD.

## Visual density — HARD BAR (Get Cito already flagged a text-heavy post once)

Match the best posts. Verified component inventory in `src/content/blog/*.mdx`:

| Component | Used | Use here for |
|---|---|---|
| `rf-chart` (+ `rf-chart-row`/`-bar`/`-fill`/`-label`/`-value`/`-legend`/`-header`) | 91 rows across 17 charts | Cost-per-month comparison; lever-coverage score by option |
| `rf-score-row` | 54 | The seven-lever scorecard |
| `rf-leak-card` | 34 | "Where each option leaks revenue" |
| `rf-bleed` + `rf-bleed-inner` | 25 | Full-bleed image + `<blockquote>` |
| `rf-figure` / `rf-figure-frame` / `rf-figure-quote` / `rf-figure-overlay` | 15–16 | Inline figures with overlay quote |
| `rf-philosophy-card` | 15 | The tool→tool+strategist reframe |

**Every image carries an overlay quote. No bare images, ever** — a bare `<img>` with only a figcaption
gets flagged for removal. Quote sourcing order: (1) verified Federico quote from
`docs/revfactor-content-brain.md` §7, (2) verified client testimonial with name + role,
(3) unattributed editorial pull-quote. **Never fabricate a Fede quote** — paraphrased Fede-voice lines
are fine as unattributed editorial pull-quotes only.

**Photos:** reuse `/public/photos/blog/` (see `LIBRARY.md`). Directories: `cabin`, `coastal`, `guest`,
`interior`, `lake`, `cluster-heroes-v2`, `journal-heroes`. **Do NOT use `generated/`** and do not make
new AI hero photos. Vendor screenshots/logos follow the existing
`rf-vendor-figure` / `rf-vendor-logo-strip` pattern — see the companies listicle for the exact markup,
including the `captured <date>` figcaption.

## Data + sourcing rules

- **First-party data is the wedge** — lead with our own numbers: 198 listings, 67 markets, 24 states,
  +24% RevPAR vs comp set, flat $350/mo + $150 onboarding + $50/mo per child listing.
- **Every external stat hyperlinks to a source that loads.** Verify each URL returns 200 before publishing.
- **Pull live vendor pricing before writing.** Do not copy the figures out of the existing listicle without
  re-checking them — they were captured 2026-05-21 and pricing moves. Screenshot with the capture date.
- No client / property / owner names. Market + property type only ("a Gatlinburg cabin").
- No fabricated statistics, ever.

## Frontmatter checklist

- `title` — keep under ~60 chars, head term first
- `description` — **two-part, under 320**: ~140–155 char SEO opener ending on a clean full stop, then a
  citation-ready AEO continuation. Include "RevFactor" verbatim (GEO). See `docs/AUTOPILOT_CONSTRAINTS.md` C1.
- `subhead` — the visible hero hook (frees `description` for its meta/AEO job)
- `pubDate` + `updatedDate` = ship date
- `image` + `imageAlt` (real, descriptive alt — match the depth of existing posts)
- `category: "Tools"`, tags, `readingTime`
- `faqs:` 8–12 entries

## Voice

Fede brain voice, then a human pass. **No em-dashes in body copy** — the site went 768 → 0 and must stay
there. En dashes in numeric ranges (15–35%) are correct and fine. Run
`python3 ~/.claude/tools/ai_phrase_scan.py <file>` before shipping.

## Ship sequence

1. `npm run build` — must pass 0 errors.
2. Push branch → check the Vercel preview (allow 5–10 min; Vercel lags, don't call it broken early).
3. Verify on the preview: every image has an overlay quote, all links + images 200, `updatedDate`
   rendered, FAQ accordion renders, schema intact.
4. **Faulen QA sign-off — non-negotiable, nothing goes live without it.**
5. Merge → confirm live: 200, `index, follow` (NOT noindex), then **fire IndexNow** on the new URL.
6. Add internal links: up to the pillar, across to `is-a-pricing-tool-enough` and the companies listicle.
7. Append the change to `docs/reports/changelog.json` so next week's run can attribute movement to it.
