# Case Studies — what's built, what's needed to build out further

**Built:** 2026-05-04. Section live at `/case-studies/`. Source data: Aaron's Summer 2026 (OTB pacing) sheet + Q1 2026 candidates tab.

---

## What's live now

### Section structure
- **`/case-studies/`** — index page listing all 7 Summer 2026 pacing studies with metric tiles, plus a Q1 2026 highlights table (top 10 lifts), plus a methodology block defining OTB / STLY / LY / MPI / ADR.
- **`/case-studies/{slug}/`** — detail template, data-led hero (no image — the metrics ARE the hero), MDX body, "more case studies" rail, CTA.
- **Nav link:** swapped homepage `RESULTS` for `CASE STUDIES` in `Navbar.jsx` (homepage `#results` SocialProof section is still there, just no longer in the top nav). Flag if you want both.

### Seven detail pages (Summer 2026 pacing)
| Slug | Property | Owner | Headline |
|---|---|---|---|
| `waterfront-albion-mi` | Waterfront + Game Room + Dog Friendly | Maryssa Payne | +292.8% / 3.60× MPI / on track to beat full LY |
| `rabbit-run-gatlinburg` | Rabbit Run | Grant Currant | +220.7% / fast-time-to-value (2.8mo tenure) |
| `norton-nook-michigan` | Norton Nook | Thea Cabanilla / Topaz Stays | +189.1% / multi-property operator |
| `pointe-marsh-myrtle-beach` | Pointe Marsh | Elizabeth Carlson | +106.4% / dense-market positioning |
| `tonka-house-minneapolis` | Tonka House | Cecilia Sirovina | +101.3% / two-cycle ADR climb |
| `boho-bungalow-san-diego` | Boho Bungalow | Sarah Pace | +98.6% / largest ADR jump (+39.7%) |
| `yellow-door-inn-norfolk` | The Yellow Door Inn | Alisha Provot | +57.1% / honest baseline (the "modest lift" example) |

Each detail page has the full pacing block, monthly breakdown table (Jun/Jul/Aug 2026), an inferred-but-honest "what changed" section, comp-window table, and a value-of-management framing.

### Q1 2026 highlights table on index
Top 10 Q1 lifts surfaced as a table only — no detail pages yet (see "Wave 2" below).

---

## What I had to infer vs. what I had

### Hard data — pulled directly from the sheet
- Pacing numbers (OTB, STLY, LY, $ lift, % lift, occupancy, ADR, MPI, market occ)
- Monthly breakdown for the Summer set
- Onboarding date, tenure, BR count, city/state, owner name

### What I inferred (and flagged as inferred in copy)
- Tactical "what changed" sections — written from the visible data pattern (ADR climb, MPI direction, occupancy curve), explicitly framed as **"the visible pattern in the calendar is consistent with..."** rather than putting words in Fede's mouth. Each page references publicly-documented Fede plays (minimum-stay flexibility, length-of-stay tuning, channel mix) without claiming Fede made specific config changes on these specific properties.
- "What it costs" framing — uses the documented $320/mo flat rate and divides into the pacing lift to show payback.

### What I deliberately did NOT do
- **No fabricated owner quotes.** Following [feedback_no_hallucinated_quotes.md](../../.claude/projects/-Users-aaronwhittaker-Claude/memory/feedback_no_hallucinated_quotes.md). The schema supports a `testimonial:` block on each page; it's empty until you supply real quotes.
- **No Erin Warren testimonial reuse.** [case-study-allocation.md](case-study-allocation.md) flags Kassidy & Erin Warren testimonial as already saturated in Blog 1 closing. Did not pull it into a case study.
- **No verbatim Fede Michigan-lake-house story** for the Maryssa Payne / Albion page. Allocation matrix flags the verbatim quote as off-limits because it lives in Blog 1 §Play 4. The Albion case study uses the data + a paraphrased reference to publicly-documented plays only.
- **Owner names privacy-guarded.** All seven studies have `clientNamePublic: false` in frontmatter — the page renders **first name + period only** ("Maryssa.", "Grant.") until you flip the flag per owner. When you have written sign-off, set `clientNamePublic: true` and the full name renders.

---

## Wave 1 → what we need from you to ship publicly

Ranked by ROI per minute of your time:

### 1. Owner sign-off (10 min total)
Confirm which of these seven owners have given written or recorded permission to be named on the public site:

- [ ] Maryssa Payne (Albion, MI)
- [ ] Grant Currant (Gatlinburg, TN)
- [ ] Thea Cabanilla / Topaz Stays (Norton Shores, MI)
- [ ] Elizabeth Carlson (North Myrtle Beach, SC)
- [ ] Cecilia Sirovina (Hopkins, MN)
- [ ] Sarah Pace (San Diego, CA)
- [ ] Alisha Provot (Norfolk, VA)

Reply with a list — I'll flip `clientNamePublic: true` per page. For owners who **decline** being named, the current first-name-only treatment is the public fallback.

### 2. Real owner quotes (one per study — 5 min each if pulled from email/Slack)
The schema accepts a `testimonial:` block per study (quote + author + optional source). One sentence is enough. If you have any of these from FireFlies transcripts, owner emails, or onboarding feedback, drop them in and I'll wire them to the right pages.

### 3. Fede commentary per property (15 min on a call, or send me FireFlies meeting IDs)
The strongest version of each case study has Fede saying *what specifically changed on this property.* Right now I'm referencing publicly-documented plays generically. If you have transcripts where Fede mentions any of these properties by name — or want to do a 15-min call walking through each one — I can rewrite the "What changed" section per page with verified specifics.

### 4. Property photos
The pages currently use no images (data-led hero) which works for the brand, but exterior shots + interior hero shots from each Airbnb listing would let us add a property image module to the detail page header. Listing URLs work — I can pull the public photos from the Airbnb listing pages.

---

## Wave 2 — Q1 2026 detail pages

Top 5 Q1 candidates with strongest stories (from the sheet's "Tag 1" column flagging them as Q1 strong / year-round star):

| Listing | Owner | Q1 lift | Why it's interesting |
|---|---|---|---|
| Hues Casita — Tucson | Erin Warren | +512.7% | Largest Q1 lift in the portfolio. Owner has the public testimonial (already used Blog 1) — could anchor a different angle. |
| Skiing, Hot Tub & VIEWS — Durham, NY | Alicia Amarant | +445.0% | Year-round star tag. Ski-market positioning angle. |
| Desert Hues B&B — Tucson | Erin Warren | +285.3% | Same client as Hues Casita — multi-property operator angle (cross-link). |
| Cabin in the Canyon — Glenwood Springs | Zoey Berghoff | +27.6% | Modest Q1 lift but **Zoey has the documented "$30K single booking" quote** in the brain. Strong narrative anchor. |
| Hutton House — Minneapolis | Cecilia Sirovina | +152.9% | Cross-link to Tonka House (same owner) — single-strategist-multiple-properties angle. |

For each: I need the same things as Wave 1 (sign-off, optional quote, optional Fede commentary). Once you greenlight any of these I can write them out the same way as the Summer 7 — should take ~30 min per page.

---

## Wave 3 — case-study generation cadence

If we treat case studies as a **monthly recurring content block** (one new study per month), we can generate them at a rate that feeds:

- **Backlink targets** — listicles in STR investing publications love fresh case studies with named markets and concrete numbers
- **GEO/AEO content** — case studies are the format AI engines cite most often when answering "does revenue management actually work for STRs"
- **Sales enablement** — Fede can pull a market-specific case study into a discovery call and it lands harder than an abstract pitch

Recommended cadence: **one new case study every 2 weeks**, sourced from the next sheet refresh. I can wire a pipeline that ingests the sheet, ranks new candidates by lift × owner-permission status, and generates the MDX file as a draft for your review.

Flag this if you want it built — it's a few hours of pipeline work that would compound forever.

---

## Allocation matrix updates (already applied)

Updated [case-study-allocation.md](case-study-allocation.md) entries — the ones that were "Available" anchors are now "Anchored: /case-studies/{slug}." That keeps the allocation matrix as the single source of truth for which property/quote anchors which content.

This means: when Avinash writes the next blog post, the matrix tells him these properties already have canonical homes. Future blog posts can reference back to the case study, not re-litigate the metrics. (Canonical-home conflict prevention — see [feedback_quote_inventory_before_drafting.md](../../.claude/projects/-Users-aaronwhittaker-Claude/memory/feedback_quote_inventory_before_drafting.md).)

---

## Files added/changed

- `src/content/config.ts` — added `caseStudies` collection schema
- `src/content/case-studies/*.mdx` — 7 new files
- `src/pages/case-studies/index.astro` — new
- `src/pages/case-studies/[...slug].astro` — new
- `src/components/Navbar.jsx` — `RESULTS` → `CASE STUDIES`
- `docs/case-studies-gap-doc.md` — this file

URL: https://revfactor.io/case-studies (after deploy)
