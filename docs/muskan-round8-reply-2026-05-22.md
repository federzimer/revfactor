# Reply to Muskan — Round 8 (final pre-launch status)

**Date:** 2026-05-22
**Branch:** `cluster-builds-2026-05-15` · **Latest commit:** `2b6d661`
**Staging:** https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/

---

## Draft reply

Hi Muskan,

Pulled together everything that's landed since your audit went out. Net: 14 of your 17 numbered items are closed, all 5 mobile observations are closed, and the two open items are either deferred by design or waiting on Federico. Detail below — please walk the staging URL when you have a window and flag anything that didn't land cleanly.

### Closed since your last pass

**#1** Surname-pending brackets removed (first-name only — Sarah / Maryssa / Erin).
**#2** Dead `/case-studies/` links pulled from all 5 cluster posts. Case-study pages will rebuild on their own track with owner sign-off.
**#3** Per-post `og:image` wired — each post serves its own hero in social previews.
**#4** `/privacy/`, `/terms/`, `/cookies/` shipped with the real analytics stack listed. **Governing-law jurisdiction is Austin, TX** (Travis County). Footer placeholder hrefs are now live links.
**#5** COI disclosure promoted to a red-bordered callout box sitting directly above the §6 vendor table.
**#6** Comp set aligned to "8–15" across every post.
**#7** Blackbird Hospitality mentions audited — body copy reframed to "across the 198 listings RevFactor manages." The corporate-distinction explainer stays in the Method post FAQ + founder bio only.
**#8** Federico's bio now hyperlinks four verified podcast appearances (No Vacancy Ep 155, Life of Flow Ep 93, Crafted Stays, STR Like The Best Ep 54) and they're in the Person schema's `sameAs` array. One bio reference ("Catchup with the Carlyles") didn't verify as a real show — we've dropped it pending Fede's confirmation.
**#9** Duplicate author bio block removed from 5 MDX files — single source now lives in the page template.
**#10** "New this week" badge is dynamic — auto-hides past 7 days.
**#11** Strategy-call CTA section sits between the archive grid and newsletter on `/blog/`. CTA reads **Schedule Discovery Call** since the round-6 rename. Now opens a 2-question qualifier (property y/n → PM-company y/n) before the Cal.com booking.
**#12** ADR + Comp Set posts reclassified from Markets → Strategy.
**#13** BreadcrumbList JSON-LD verified emitting on every article page.
**#14** "Strategize" parenthetical added to the Method post Phase 2 intro.
**#15** "RevFactor Journal" newsletter kicker → "The Rev Journal" — canonical name unified across title tag, schema, nav, and newsletter block.

**Stats refresh (post-audit):** +18% → **+24%** revenue lift · 165+ properties → **198 listings** · 56 markets → **67 markets**. Applied across cluster posts, listicles, Person schema, About page, all 3 PPC landing pages, and Google Ads RSA copy.

### Mobile observations — closed

**M3** Calculator widget mobile render fixed (root cause: Astro `<astro-island>` defaulting to `display: inline` inside the prose-rf grid). Verified 358×879 on iPhone 14.
**M4** RevParty image returns HTTP 200 on the current deploy — the "Access Denied" you hit was transient Vercel bot mitigation.
**M5** Added rf-vendor-figure blocks for §6.1 RevFactor (logo + revfactor.io screenshot) and §6.7 Rented (TravelNet placeholder + tnsinc.com screenshot).
**M1** Thumbnail proportions on iPhone 14 — all cards render at their declared aspect ratios (3/4, 4/5, 2/3, 16/9, 4/3), no distortion.
**M2** "More dispatches on the way" filler card now sits at source-order position 3 of 8 in the mobile flow (between content cards), not at the end after the clusters as you saw before.

### Vendor-fact corrections (Muskan #16 — partial)

We ran a research sweep on the two listicles. Two material corrections applied:
- **Awning (PM listicle §6.4)** — prepended a note that Awning was acquired by RedAwning in April 2024. Brand still operates under RedAwning.
- **Rented / TravelNet (STR RM listicle §6.7)** — TravelNet rebranded to **Track Hospitality**. Rented.com is deprecated. Andrew McConnell stayed on through the acquisition.

Other findings (Pricing by Mira's founder being Emile Sakhel, maverickstr's `.co` URL) were already correctly cited. Granular employee counts and pricing-$ figures across the listicles we couldn't verify against a public source are flagged as "unverified — strip" in our internal research doc; we'll patch those on the next pass.

### Deferred

- **#17** Peec.ai SoV gap — agreed, structural and multi-month. Not a fix item.
- Two pre-existing horizontal-overflow Playwright failures (formula table on ADR mobile, vendor-comparison table on PM-listicle desktop) — not regressions from the audit work, so deferred to the next cleanup pass unless you flag as launch-blockers.

### Two ways you can help us close out

1. If you spot any post / page / schema block still showing the old `+18%` / `165+` / `56` numbers after a walk-through, share the URL and we'll patch.
2. If you have time to spot-check the new Discovery Call qualifier modal on mobile (any cluster post → tap **Schedule Discovery Call**) and confirm both branches feel right — that's the surface that changed most since your audit.

Staging URL again: https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app/blog/

Thanks for the audit — it was a clean, prioritized list, which makes the close-out work fast.

Best,
Aaron
