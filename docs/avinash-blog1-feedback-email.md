# Email draft to Avinash Tripathi — Blog 1 draft feedback

**To:** Avinash Tripathi <team@getcito.com>
**From:** Aaron Whittaker
**Subject:** RevFactor Blog 1 — feedback on the first draft (93/100, ready after polish)

**Attachments:**
- `blog-1-getcito-feedback.docx` — your draft with our inline blue suggested edits (21 notes)
- `blog-1-draft-review.docx` — full review: SERP top-10 benchmark, POP LSI pull, full JSON-LD schema package
- `revfactor-brain-addendum-2026-05-01.docx` — Section 19 delta on top of the brain you already have (one new TikTok worth pulling into Blog 1)

---

Hey Avinash,

The first draft is strong — much better than I'd expected for a v1 on a 7,500-word piece. Voice fidelity to Federico is excellent, the Three Pillars + Four Pillars structure landed correctly, the pricing tier table is right, and 8 of the high-volume Peec FAQ prompts are in verbatim. Scoring it at **93/100** after applying the polish edits below.

Couple of orientation notes before the punch list:

**SERP context.** I pulled Ahrefs SERP top-10 for our target keyword. Top contenders: PriceLabs (DR 72, ~2,200w, 0 case studies), Guesty (DR 77, ~1,500w, 6 FAQs), RentalsUnited (DR 62, ~2,300w, 0 FAQs). Our draft is 3.4× the median page length with the only named author who has both a decade of airline yield management and an active 165-property STR portfolio. We're positioned to beat every page in the current top 10 on E-E-A-T density once the polish lands. Full benchmark in `blog-1-draft-review.docx`.

**POP LSI pull.** Page Optimizer Pro flagged a handful of co-occurrence terms that are slightly under-used vs. the top-10 average — `dynamic pricing`, `occupancy`, `performance`, `portfolio`, `bookings`, `automated`. None requires a structural change; it's ~15 minutes of inline word-frequency polish during final QA. Specifics in the review doc.

## What needs to change before publish

I've put 21 inline blue notes on your draft (`blog-1-getcito-feedback.docx`). The high-leverage ones:

1. **Quick-Answer + Key-Stats blocks at the top of the post.** 40–60 word definition box right under H1 (AI Overview target) plus a 3-line stats callout (`+18% RevPAR lift`, `165+ properties / 24 states / 56 markets`, `flat $320/mo`). This is the single biggest gap vs. PriceLabs' 5-pillar hero graphic.

2. **Brand disambiguation — three pinning locations.** Refactor.ai is an unrelated SaaS; without disambiguation, LLMs blend the two entities. We're handling it in three high-trust spots only:
   - One sentence at the end of §"What Is Revenue Management for Short-Term Rentals?"
   - A new dedicated FAQ "What is RevFactor?" + a second new FAQ "How is RevFactor different from a full-service property manager?" (both in the FAQPage schema)
   - The author bio with "RevFactor" linked to https://revfactor.io
   Plain "RevFactor" stays in the body everywhere else — no ".io" appended in running text. Owning the brand long-term is a function of ranking + backlink anchor text, not in-body URL repetition. Exact wording for all three locations is in the inline doc.

3. **Add Federico's headshot to the Author section.** The image is already live at https://revfactor.io/team/federico.jpg. Place left-aligned, ~120px, circular crop, alt text "Federico Zimerman, Founder of RevFactor." Required for schema `Person.image` and a hard E-E-A-T signal Google looks for on long-form.

4. **Reorder the 7 leaks by impact.** Lead with pacing (the diagnostic that reveals the others), not base rate (a symptom). Suggested order in the inline doc.

5. **Add the WW2 survivorship-bias backstory** before Federico's lake-house quote. Abraham Wald, returning bombers, armor the unmarked spots — then transition to Federico's STR version. This is the highest-citation hook in the brain doc and didn't make v1.

6. **Reformat the 20%/10% pricing formula as a 4-step HowTo block.** Pairs with the HowTo schema we're providing. AI Overviews extract HowTo blocks verbatim.

7. **Add the bookshop-vs-rental shoulder-season quote** — this is from a TikTok Federico posted on 2026-04-30, so it's also in the addendum. Full text in the inline doc and in the addendum: *"If you walk into a bookshop in November and walk out empty-handed, that bookshop has lost zero dollars… those books are still there in December. If you walk into an empty short-term rental on November 14th, that night is gone forever."*

8. **Single CTA before About-the-Author.** "Schedule a Strategy Call → revfactor.io/schedule." One CTA, end of post, no popups, no mid-content interruptions.

9. **Strengthen the author bio for E-E-A-T.** One sentence pinning Federico's authority to specific podcasts (No Vacancy Ep. 155, Life of Flow, Catchup with the Carlyles, Craft Stays, STR Like The Best) + TikTok and Instagram handles.

10. **Math consistency.** Key Takeaways says "60% occupancy at $250"; the body and closing-thought say "50% occupancy at $250." Standardize on 50% everywhere outside the worked-arithmetic table.

## Schema package — ships at the end of the post

We're providing the full JSON-LD package — `Article` + `Person` (with `image`) + `FAQPage` (now 13 entries — original 11 + the two new RevFactor FAQs) + `HowTo` (×2: minimum-stay weapon, new-listing launch) + `DefinedTerm` (×6: RevPAR, ADR, NetRevPAR, Pacing, LOS discount, Survivorship bias) + `BreadcrumbList`.

Place it as a single `<script type="application/ld+json">` block at the very end of the published post (Google parses schema in either `<head>` or `<body>` — putting it at the end of the post means it ships inside your delivered HTML by default, no separate dev step required). Full code block is in `blog-1-draft-review.docx` Appendix A — paste verbatim, replace `{{PUBLISH_DATE_ISO}}` with the actual ISO publish date.

## Self-citing FAQ #1 — handled by cluster launch

The first FAQ ("best revenue management companies for short-term rentals") references a companion listicle that doesn't exist as a published page yet. We're launching this post alongside the companion "best revenue management companies" listicle in the same drop, so the link target will exist on day one and the FAQ becomes the in-text bridge. No copy change needed there — please link "specialist firms like RevFactor" in that FAQ to the companion post URL once both are scheduled.

## Brain addendum

`revfactor-brain-addendum-2026-05-01.docx` is the Section-19 delta on top of the brain you already have. The single piece that affects Blog 1 is the bookshop quote (already called out in the inline doc). The rest is About-page material — flag it for whichever Pillar lands closest to founder narrative. Going forward, I'll send you a delta doc each time enough new material accumulates rather than re-issuing the full brain.

---

Once these land, the post is publish-ready. Aiming to ship Blog 1 + the companion listicle simultaneously so the cluster topology is in place from day one. Let me know your timing on revisions and we'll lock the publish date.

Thanks — Aaron
