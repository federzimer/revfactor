# Reply to Muskan — Round 5 QA Response

**Date:** 2026-05-21
**Branch:** `cluster-builds-2026-05-15`
**Latest commit:** `3ea4e2b`
**Staging:** https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/

---

## Open items needing Aaron's call before this goes out

1. Federico's Florida/jurisdiction confirmation for the Terms page (placeholder is Miami-Dade County, FL).
2. The `hello@revfactor.io` contact email confirmation across all three legal pages.
3. Is "Aaron" the right sender name or should this come from Federico's box?

---

## Draft reply

Hi Muskan,

Thank you for the thorough audit — really clean work. Here's where we landed on each item, and a few I'd like you to spot-check on the latest deploy:

### PRE-LAUNCH BLOCKERS — FIXED

**#1** Surname-pending brackets removed (Sarah / Maryssa / Erin first name only per our owner-name standard). Please recheck §6.1 of the STR RM listicle.

**#2** Dead `/case-studies/` links removed from all 5 cluster posts. We'll rebuild the case-study pages in a separate sprint with proper owner sign-off rather than ship 404 links to proof points.

**#3** Per-post `og:image` wired — each post's social preview now uses its own hero. Please re-share one URL on LinkedIn or X to confirm the per-post thumbnail renders.

**#4** Privacy / Terms / Cookies pages built and live:

- `/privacy/`
- `/terms/`
- `/cookies/`

All three list the real analytics stack (PostHog, GA4, Umami, Cal.com, Fraud Blocker) and our actual data flow. Footer "#" placeholders are now real links. (One open: jurisdiction language — Federico to confirm operating entity / state before production launch.)

**#5** COI disclosure promoted out of the §5 body into a high-contrast red-bordered callout box sitting directly above the §6 vendor table.

**#6** Comp set definition aligned to "eight to fifteen" everywhere — the 5–8 drift in the Method post is gone.

**#7** Blackbird Hospitality mentions audited. The relationship is: RevFactor runs the revenue management for ALL Blackbird-managed properties plus outside clients. Reframed body copy from "developed at Blackbird" to "across the 165+ properties RevFactor manages" since RevFactor is the layer that produced those results. Kept the corporate-distinction callout in the Method post FAQ + founder bio so the relationship is explicit where it matters.

**#9** Duplicate author bio fixed — removed the inline `.jpg` block from 5 MDX files. The `.webp` author card in the page template is now the single source.

**#10** "New this week" badge on the featured-post card now shows only when the `pubDate` is within 7 days. Will auto-hide as posts age.

**#11** Strategy-call CTA section added to `/blog/` between the archive grid and newsletter block. Please confirm it converts when you tap it on mobile — it should open the site-wide ScheduleModal.

**#12** Reclassified ADR vs RevPAR + Comp Set posts from "Markets" → "Strategy."

**#13** BreadcrumbList schema confirmed emitting on every article page (verified in the JSON-LD inspector).

**#14** "Strategize" parenthetical added to the Method post Phase 2 intro so the US spelling appears in body copy at least once.

**#15** Newsletter kicker "RevFactor Journal" → "The Rev Journal" — the title tag, schema, and newsletter block now match. Nav still reads "JOURNAL" as a category label, which we think reads cleaner alongside ABOUT / OWNERS / SUBSCRIBE; happy to revisit.

### MOBILE OBSERVATIONS — FIXED

**Mobile 3** "Try it on your own numbers" calculator was rendering at 58px on mobile — root cause was Astro's React-island wrapper defaulting to `display: inline` inside our grid. CSS rule added; verified 358×879 on iPhone 14. Please re-check on Cluster 3.

**Mobile 4** RevParty Consulting image — verified HTTP 200 + valid PNG on the current deploy. The "Access Denied" you saw was a transient Vercel mitigation when our QA traffic was high. Please re-check; if it's still failing for you, share the exact device / network so we can repro.

**Mobile 5** §6.1 RevFactor and §6.7 Rented were missing their vendor figures entirely (no logo, no screenshot). Added both — RevFactor uses its own brand emblem + a fresh homepage screenshot; Rented uses a placeholder mark + a TravelNet Solutions homepage screenshot (tnsinc.com, the current corporate home for the Rented service post-acquisition).

### HIGH-PRIORITY DEFERRED — NEEDS FEDERICO

**#8** Third-party social proof — we searched our brain files for verifiable podcast URLs / press URLs for the Natalie Palmer Ep 155 / Life of Flow / etc. mentions and didn't find canonical episode links. Federico to send through the actual episode URLs so we can hyperlink the name-drops and feed them into the Person schema's `sameAs` array. We are keeping the existing podcast-name mentions in the body copy unhyperlinked until then.

**#16** Vendor-atomic-facts research for the two listicles — we're treating any unverified company stats as remove-on-sight. Will run a targeted research sprint when we revisit the listicles for round 6.

**#17** Peec.ai 0% SoV — agreed, structural and multi-month. Nothing on the short-term checklist.

### ONE THING I'D PUSH BACK ON

The two horizontal-overflow Playwright failures (formula table on ADR mobile, vendor-comparison table on PM-listicle desktop) — these are pre-existing table layouts, not regressions. Resolution path is either (a) wrap them in a horizontal-scroll container or (b) pivot them to a card layout on mobile. We'll handle in round 6 unless you flag them as launch-blockers.

---

Updated staging:

https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/

Please walk through the 5 cluster posts at the URL above on both desktop and mobile when you have a window, and call out anything that didn't land as expected. We're ready for one more pass before production.

Thanks again,
Aaron
