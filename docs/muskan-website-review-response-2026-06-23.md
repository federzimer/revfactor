# RevFactor — Response to Website Review (2026-06-23)

Thanks for the thorough review of the homepage, /about, and llms.txt. Below is what we shipped today, what we're pushing back on (and why), what we'd love you to write, plus the cluster work you may not have seen on your last pass.

---

## ✅ Shipped today (commit `bbefa93` on `main`, live on www.revfactor.io)

| # | Your finding | What we shipped |
|---|---|---|
| 1 | `og:image:alt` missing on homepage + /about | Added universally via `BaseLayout`. New `ogImageAlt` prop with a site-level default; every page picks it up automatically. Also set `twitter:image:alt`. |
| 2 | Footer "Careers" link is `href="#"` (dead) | Removed the menu item. No Careers content exists; cleaner to drop than to placeholder. |
| 3 | `BreadcrumbList` schema missing on /about | Added (Home → About) in the head Fragment. |
| 4 | /about title `"Where We Operate — RevFactor"` undersold the page | Rewrote to **"About RevFactor: STR Revenue Management Across 24 States"** + a description that names Federico as founder and the +24% RevPAR-vs-comp-set lift. |
| 5 | /about uses `client:only="react"` so Google can't crawl the body | Switched to `client:load` — same React interactivity, but SSR's the initial HTML so crawlers see the content. |

---

## 🟡 Items we're keeping off the table for now (and why)

| Your finding | Decision | Reason |
|---|---|---|
| H1 should swap from *"Every night has its price."* to a keyword-led H1 like *"Short-Term Rental Revenue Management Services"* | **Skip for now.** | Ahrefs has RevFactor.io at DR **2.7** with **0 ranking keywords**. A keyword-H1 lift compounds at DR 15+ once we have backlink authority to push it. Right now the brand-tagline H1 is doing brand work that the SEO doesn't yet need. Worth re-visiting once DR clears the threshold. |
| Title at ~70 chars (above the SERP truncation point) | **Skip.** | At 0 current rankings, the visible-title difference isn't measurable. Will revisit alongside the H1 in the DR-15 sweep. |
| `twitter:site` / `twitter:creator` meta tags missing | **Skip.** | Verified 2026-06-23: no active X account exists for `@revfactor`, `@revfactor_io`, `@revfactorio`, `@revfactor_rm`, `@federicozimerman`, `@federzimer`, or `@fede_zimerman`. Federico's daily presence is TikTok + Instagram; adding handles that point to nonexistent profiles is worse than omitting (X's card validator flags it). Will add when an account launches. |
| Meta description lacks an explicit CTA | **Skip.** | Not a ranking factor; opinion-level recommendation. Description was rewritten on /about anyway and is now positioning-led. |

---

## ✍️ What we'd love you to write next

**/about page content depth** — you flagged it's thin (basically a coverage map + stats with no real "who is RevFactor / mission / team / method" story). We agree. Rather than us draft it, would you put together **400-600 words** along the lines of:

1. **Who Federico is** (American Airlines yield management background + Blackbird Hospitality founder, 198-listing portfolio, podcast appearances on *No Vacancy*, *Life of Flow*, *Crafted Stays*, *STR Like The Best*)
2. **What RevFactor is** (managed STR revenue management service, flat-fee per property, +24% RevPAR vs. comp set on 24-month rolling average)
3. **The RevFactor Method TL;DR** (link to [/blog/the-revfactor-method/](https://www.revfactor.io/blog/the-revfactor-method/) for the full breakdown)
4. **A clear CTA into the consultant LP** (link to [/short-term-rental-consultant/](https://www.revfactor.io/short-term-rental-consultant/) — recently un-noindexed and now indexable)

Voice should match the blog cluster (calm, analytical, expert). We can ship it the moment it lands.

---

## 🔵 What you may not have seen on this pass — cluster work shipped 2026-06-22 → 2026-06-23

Your review focused on homepage + /about + llms.txt. Significant work shipped on the blog cluster and the consultant LP yesterday and today that wasn't in scope of your review — listing it here so the next pass starts from a fresh baseline:

### `/short-term-rental-consultant/` — fully unblocked (commit `50b47e6`, 2026-06-22)
- **`noindex={true}` removed** → now `index, follow`. This was the single biggest SEO miss on the site; the page is now eligible for organic ranking on the highest-intent commercial keyword.
- **FAQPage schema** added on the 6 inline FAQs.
- **Service + Offer + AggregateRating schema** added (3 testimonials, 5★ avg).

### Pillar — `/blog/revenue-management-for-short-term-rentals/` (commit `50b47e6`)
3 new H2 sections added to close the gap with the top-3 SERP competitors:
- **How Much Does a Revenue Manager Cost? Fee Structures Compared** (flat fee / % of revenue / full-service comparison + break-even math)
- **How to Hire a Revenue Manager: 7 Questions to Ask** (diagnostic interview)
- **Signs You Need a Revenue Manager** (5 numbered triggers)

Each has a Quick Answer snippet + in-cluster internal links. ~1,650 new words.

### Blog 7 — `/blog/airbnb-revenue-management-company/` (commit `50b47e6` + `3684b78`)
- **TOC navigation block** added under Key Takeaways
- **Market-size stat band**: $344B by 2034 / 10.7% CAGR / 5-8% PM fee benchmark
- **Profit Formula callout box**: `Profit = ADR × Occupancy × Available Nights − OpEx`
- **Fee-structure side-by-side table** (flat $350 vs 5% of revenue vs 25% full-service across 1/3/5/10 properties + 3-year cost)
- **"What to Ask Before You Hire" → "The 10-Question RM Interview"** (rebrand + 4 new questions: retention, RevPAR guarantee, PriceLabs config ownership on exit, sample monthly report)
- **`description` field** added to the Service schema (Google-recommended)
- **Casago/Vacasa framing corrected**: was "Casago (formerly Vacasa)" which is backward — Casago *acquired* Vacasa April 2025, Vacasa still operates under its own brand.

### `/blog/how-to-build-comp-set-str/` — HowTo schema (commit `50b47e6`)
7-filter comp-set methodology now ships as structured HowTo data (AI Overview eligible).

### `/blog/adr-vs-revpar-airbnb-hosts/` — DefinedTerm schemas (commit `50b47e6`)
4 DefinedTerm entities added: Perishable inventory, Yield management, GOPPAR, Comp set. AI-engine glossary signal.

### `/blog/f1-race-weekend-str-pricing-playbook/` — new post (commit `291d18f` + `3684b78`, 2026-06-23)
Blog 9 ("The F1 Race Weekend Revenue Playbook") shipped. Full-bleed F1 circuit hero, two inline `rf-figure-quote` panels (Miami luxury villa + Vegas Strip), `rf-key-stats` opener (+84% Austin / −20.3% Vegas / 87% Vegas occupancy), `rf-quick-answer` callouts, and the Three-Archetype Framework (Miami premium / Austin reliable / Vegas volatile). Live now.

### Blog 4 + Blog 5 — Review schema cleanup (commits `82a3d59`, `c23c677`, `f59986f`, 2026-06-22)
- Pricing in Blog 5's Review JSON-LD updated to the current canonical ($350 flat + $150 onboarding); was citing stale `$320 → $256 / $125`.
- Removed self-review Review schemas where Federico had reviewed RevFactor with a 5★ rating — Google's manual-action policy treats founder-reviews-own-company as manipulation. Replaced with neutral commentary.
- FIFA post: orphaned duplicate NewsArticle node removed from the entity graph (your dup-schema flag from the prior pass — confirmed fixed).

---

## 🤝 Asks back to you

1. **/about content draft** — 400-600 words per the spec above. Match the calm-analytical Federico voice from the pillar + Blog 7.
2. **Fresh review pass** — once the /about draft lands, would you re-review the cluster work shipped 2026-06-22 → 2026-06-23? Specifically: consultant LP, pillar 3 new H2s, Blog 7 5 adds, comp-set HowTo, ADR/RevPAR DefinedTerms, and the new F1 post. Different scope from your homepage review and should turn up genuinely new items.

Let us know if anything in the skip column above needs a stronger justification — happy to walk through it.

— Aaron
