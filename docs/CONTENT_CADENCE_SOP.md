# RevFactor — Site Content & Optimization Cadence (SOP)
**Owner of the rhythm:** Jlo (implements) · **QA gate:** Faulen (signs off before live) · **Escalation:** Aaron
**Source of truth:** the Thrive-branded RevFactor strategy (`RevFactor-Strategy.pdf`, Drive `1Bk6EqEeR3IIoanCuNvtoXCwhjT1e33U2`) · Last updated 2026-07-28

The strategy sets the target cadence: **1 new post/week · 5 optimizations/week · update the "last updated" date on every change.** This SOP is how that happens on the site each week.

---

## The weekly rhythm (repeat every week)

| When | Who | Do |
|---|---|---|
| Mon | Jlo | Run the SEO toolkit on the site (see §3). It lists this week's changes. Pick the top **5 posts** to optimize + confirm this week's **1 new post**. |
| Mon–Wed | Jlo | Write/implement on **staging**: draft the new post + apply the 5 optimizations. **Set the `updatedDate` on every page you touch.** |
| Wed–Thu | Faulen | **QA** on staging: content accuracy, best-practice + client alignment, house-style, schema, visuals. Flag anything off to Aaron. |
| Thu–Fri | Jlo | Apply Faulen's fixes → **push live** → fire **IndexNow** on every changed/new URL → confirm live (200, indexable, `updatedDate` correct). |
| Fri | Jlo | Post a one-line "shipped this week" summary to **#revfactor** (Slack). |

**Golden rule:** nothing goes live without Faulen's QA sign-off. Flow is always **toolkit → staging → Faulen QA → live**.

---

## 1. The content pipeline — what to write, in order

From the strategy's content plan (first-party data + service-intent is the wedge). Write in this order, one per week:

| # | Post | Angle / target | Notes |
|---|---|---|---|
| ~~1~~ | ~~**Best Airbnb Revenue Management Companies (2026)**~~ | ~~Honest methodology, software tools included~~ | 🔴 **ABSORBED 2026-08-24 — do not write.** Cannibalization check found this title is now three-way HIGH-RISK against existing pages: `/blog/airbnb-revenue-management-company/` (95), `/blog/best-str-revenue-management-companies-2026/` (88), `/blog/is-a-pricing-tool-enough-airbnb-revenue-management/` (64). The merged listicle already covers it, software tier included. |
| ~~2~~ | ~~**PriceLabs vs Wheelhouse vs a Done-for-You Service**~~ | ~~Comparison + tool prompts~~ | ✅ **SHIPPED 2026-08-24** → `/blog/pricelabs-vs-wheelhouse-vs-done-for-you/`. Brief: `docs/BRIEF-pricelabs-vs-wheelhouse-vs-dfy.md`. |
| **NEXT** | **Airbnb Revenue Management: What It Costs in 2026** | Cost queries (fees, % models, ROI math) — the AI-answer magnet format | First-party pricing math; ties to the $350/mo model. ⚠️ Run a cannibalization check first against the cost sections now live in `is-a-pricing-tool-enough` and `pricelabs-vs-wheelhouse-vs-done-for-you`. |
| 4 | **7 Ways to Increase Airbnb Revenue Without Lowering Rates** | 16 how-to prompts, **case-study numbers** | Use the documented case-study lifts (+$139,580 across 7 properties, incl. +$47,459 single). Anonymize: market + property type only, no client/property names. Doubles as the YouTube flagship video. |

---

## 2. Writing + adding the next post (step by step)

1. **Draft in the Fede brain voice** (the custom GPT). Then a human pass — always humanize, no AI tells, no em-dashes in body copy.
2. **Use the DEFINITIVE listicle template** (team doc / house style) — same structure as our best posts. Every listicle = the definitive template.
3. **First-party data is the wedge** — lead with our own numbers (orphan-rate benchmark, +24% RevPAR vs comp set, case-study lifts). AI cites first-party data.
4. **Match our best posts' visual density** — this is now a hard bar (Get Cito flagged a text-heavy post): include **charts/graphs/graphics + section images + tables**, using the existing `rf-*` components (`rf-chart`, `rf-diagram`, `rf-leaks` cards, `rf-figure`/`rf-bleed`, `rf-band`). No AI-generated hero photos — reuse the photographic assets in `/public/photos/blog/` (not the `generated/` set).
5. **Link every cited stat to its source** (Get Cito rule) — hyperlink external data claims; verify each URL loads before publishing.
6. **Schema** — the blog layout already emits Person + BlogPosting + FAQ + Breadcrumb. Add 8–12 FAQs in frontmatter (they power the FAQPage schema + AI answers).
7. **Meta** — title + a meta description that serves SEO **and** AEO, under ~320 chars; include the brand name verbatim (GEO).
8. **Frontmatter** — set `pubDate` **and** `updatedDate` to today; add a real `image` + `imageAlt`; category + tags.
9. **File** — `src/content/blog/<slug>.mdx`. Build locally (`npm run build`) — must pass 0 errors.
10. **Publish** — push (auto-deploys on Vercel) → **fire IndexNow** on the new URL → confirm live: 200, `<meta name="robots" content="index, follow…">` (NOT noindex), `updatedDate` rendered, all links + images 200.

---

## 3. The weekly optimization pass — running the toolkit

Run the toolkit on the site, apply what it finds to **5 posts/week**, and **bump `updatedDate` on each** (freshness signal — pings Bing + GSC).

Prerequisite: toolkit access/env (Doppler `seo-toolkit`). If Jlo isn't set up yet, Aaron runs it and passes the change list until access is handed over.

Core commands (run per target post):
```bash
# Full POP-style audit — compares the page vs the top-3 ranking pages, returns the change list
seo-toolkit audit --target https://www.revfactor.io/blog/<slug>/ --keyword "target phrase"

# Does the page answer the questions AI users actually ask (Google AI Mode intent buckets)?
seo-toolkit cqf --url https://www.revfactor.io/blog/<slug>/

# Passage-level grounding: completeness / freshness / authority per passage (how Bing grounds Copilot/ChatGPT)
seo-toolkit passages --url https://www.revfactor.io/blog/<slug>/

# AI-citation eligibility score (target: 42 -> 80 per the strategy)
seo-toolkit ai-eligibility --url https://www.revfactor.io/blog/<slug>/

# Core Web Vitals across monitored URLs
seo-toolkit pagespeed-plus --failing
```
Also useful as needed: `faq-schema`, `author-signals`, `review-snippets`, `decay` (find pages losing ground), `sitemap-hygiene`.

For each post: apply the toolkit's recommendations on staging, **set `updatedDate` to today**, Faulen QA, push live, fire IndexNow. Five posts a week means the whole library gets refreshed roughly monthly.

---

## 4. Non-negotiable standards (the QA checklist Faulen runs)

- [ ] **`updatedDate` bumped** on every touched page (freshness).
- [ ] **First-party data** present + accurate; every cited stat **hyperlinked to a source that loads**.
- [ ] **Visual density** matches our best posts (charts/diagrams/images/tables) — not a wall of text.
- [ ] **Humanized**, no AI tells, no em-dashes; no hallucinated quotes.
- [ ] **Schema** intact (Person/BlogPosting/FAQ); 8–12 FAQs in frontmatter.
- [ ] **Meta description** SEO+AEO, <320 chars, brand name verbatim.
- [ ] **Indexable** live (`index, follow`, never noindex a live post); **IndexNow** fired.
- [ ] **No client/property/owner names** in any post — results shown by market + property type only ("a Gatlinburg cabin").
- [ ] Internal cross-links to the pillar + related posts; no duplicate/cannibalizing angle.
- [ ] Builds clean; all links + images return 200.

**We publish to revfactor.io** — never a vendor. Ship fast, then improve.
