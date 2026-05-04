# Case Studies — what's built, what's needed to build out further

**Built:** 2026-05-04. Section staged at `/case-studies/` — **NOINDEX'd + draft banner up; not for public consumption until Aaron + Fede verify.** Source data: Aaron's Summer 2026 (OTB pacing) sheet + Q1 2026 candidates tab + RevFactor PPC landing testimonials + Gaston's Airbnb host profile (10 co-hosted listings).

---

## What's live now

### Section structure
- **`/case-studies/`** — index page listing all 7 Summer 2026 pacing studies with metric tiles, plus a Q1 2026 highlights table (top 10 lifts), plus a methodology block defining OTB / STLY / LY / MPI / ADR.
- **`/case-studies/{slug}/`** — detail template, data-led hero (no image — the metrics ARE the hero), MDX body, "more case studies" rail, CTA.
- **Nav link:** swapped homepage `RESULTS` for `CASE STUDIES` in `Navbar.jsx` (homepage `#results` SocialProof section is still there, just no longer in the top nav). Flag if you want both.

### Nine detail pages — all NOINDEX'd, draft banner up

**Summer 2026 pacing (7):**
| Slug | Property | Owner | Headline | Testimonial? | Photo? |
|---|---|---|---|---|---|
| `waterfront-albion-mi` | Waterfront + Game Room + Dog Friendly | Maryssa Payne | +292.8% / 3.60× MPI / on track to beat full LY | — | — |
| `rabbit-run-gatlinburg` | Rabbit Run | Grant Currant | +220.7% / fast-time-to-value (2.8mo tenure) | — | — |
| `norton-nook-michigan` | Norton Nook | Thea Cabanilla / Topaz Stays | +189.1% / multi-property operator | — | — |
| `pointe-marsh-myrtle-beach` | Pointe Marsh | Elizabeth Carlson | +106.4% / dense-market positioning | — | — |
| `tonka-house-minneapolis` | Tonka House | Cecilia Sirovina | +101.3% / two-cycle ADR climb | — | — |
| `boho-bungalow-san-diego` | Boho Bungalow | Sarah Pace | +98.6% / largest ADR jump (+39.7%) | — | — |
| `yellow-door-inn-norfolk` | The Yellow Door Inn | Alisha Provot | +57.1% / honest baseline | — | — |

**Q1 2026 actuals — added with testimonials + photos (2):**
| Slug | Property | Owner | Headline | Testimonial | Photo |
|---|---|---|---|---|---|
| `hues-casita-tucson` | Hues Casita — Studio Near U of A | **Erin Warren** ✅ public | +512.7% / largest single-property Q1 lift | ✅ Kassidy & Erin Warren +20% (verbatim from PPC page) | ✅ Kassidy headshot + **Hues Casita Airbnb og:image** |
| `cabin-in-the-canyon-glenwood` | Cabin in the Canyon | **Zoey Berghoff** ✅ public | $30K single booking on launch property + Q1 +27.6% | ✅ Zoey $30K quote (verbatim from PPC page) | ✅ Zoey headshot |

Each Summer detail page has the full pacing block, monthly breakdown table (Jun/Jul/Aug 2026), Fede-voice "What changed" narrative (drafted in his voice, marked **"voice draft — Federico to verify"** so he can edit/approve), comp-window table, and value-of-management framing. The two Q1 pages additionally render the Airbnb listing hero image (when found) and the testimonial card with owner photo at the bottom.

### Q1 2026 highlights table on index
Top 10 Q1 lifts surfaced as a table only — no detail pages yet (see "Wave 2" below).

---

## What I had vs. what I drafted

### Hard data — pulled directly from the sheet
- Pacing numbers (OTB, STLY, LY, $ lift, % lift, occupancy, ADR, MPI, market occ)
- Monthly breakdown for the Summer set
- Onboarding date, tenure, BR count, city/state, owner name

### Verified Fede language pulled from existing content (no fabrication)
For three of the case studies, the body uses **Fede's own previously-published language** lifted verbatim from the Blog 1 pillar (`/blog/revenue-management-for-short-term-rentals`), with the rest of the page wrapping that verified content:

| Property | Source | What's verbatim Fede |
|---|---|---|
| Rabbit Run / Gatlinburg | Blog 1 — Pillar 3 Forecasting | $47K pacing read in <90 days, MPI 1.33×, "different forecasting cadence" |
| Waterfront / Albion MI | Blog 1 — band table | MPI 3.60×, "tool vs. discipline," 18% ahead of final LY |
| Hues Casita / Tucson | Blog 1 — case-study integration | Erin Warren three-property portfolio, Q1 numbers, "one strategist watching three calendars" |

The Kassidy & Erin Warren testimonial and the Zoey Berghoff $30K quote are pulled **verbatim from the live PPC landing page** (`/airbnb-pricing-strategy`).

### Fede-voice drafts (clearly marked, awaiting verification)
For all properties — including the four where Fede hasn't published anything specific (Norton Nook, Pointe Marsh, Tonka, Boho Bungalow, Yellow Door, Cabin in the Canyon) — the "What changed" section is drafted **in Fede's voice as a blockquote**, ending with the line:

> *— Voice draft. Federico to verify.*

Aaron's instruction: *"do your best to write it in his words and I'll have him verify."* Per-property Fede sign-off needed before removing the verification flag and the `noindex={true}` prop.

### What I deliberately did NOT do
- **No fabricated owner quotes.** The two used (Kassidy + Zoey) are verbatim from the live PPC page; the other 7 case studies have empty testimonial blocks awaiting your supplied content.
- **Owner names privacy-guarded by default.** Seven Summer studies have `clientNamePublic: false` → page renders **first name + period only**. Erin Warren and Zoey Berghoff are flipped to `true` because they are already named publicly on the PPC page.
- **No deploy to live.** Pages render at `localhost:4321/case-studies` with `noindex={true}` + a red `DRAFT — pending owner sign-off + Fede verification` banner up. Section is committed to feature branch `feature/case-studies` — **not pushed to main**, will not auto-deploy. Awaiting Aaron's go.

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

### 4. Property photos — partially solved via Gaston's Airbnb profile

Pulled from `https://www.airbnb.com/users/profile/1487988501968024571` (Gaston's host profile) — **10 listings, 2 of which are direct matches to our case studies:**

| Listing | Room ID | City | Matches |
|---|---|---|---|
| Hues Casita - Airy Studio Near U of A | 45419863 | Tucson, AZ | ✅ Hues Casita case study (image in use) |
| Desert Hues — Heated Pool & Hot Tub | 44188375 | Tucson, AZ | Erin Warren second property (could add as case study) |
| Pool, Hot-tub, Fire Pit / Desert Vibrations | 40485421 | Tucson, AZ | Possible Erin Warren third property — confirm |
| Hot Tub/Fire Pit/Game Room/VIEWS of Mt.Leconte | 45540552 | Gatlinburg, TN | — (Smoky Mts portfolio, not Rabbit Run) |
| VIEWS/Hot Tub/Game Room/Fire Pit | 45666655 | Gatlinburg, TN | — (Smoky Mts portfolio) |
| YARD/Hot Tub/Game Room/Theater/VIEWS/Fire Pit | 45541196 | Gatlinburg, TN | — (Smoky Mts portfolio) |
| District Den - Walk Score 99 | 42199762 | Washington, DC | — |
| Spacious Getaway w/Hot Tub, Pool, Game Room | 40262877 | Atascadero, CA | — |
| Stylish w firepit, close to UF | 33044968 | Gainesville, FL | — |
| Peaceful, modern, renovated | 18171041 | Gainesville, FL | — |

**For the other 7 case-study properties (Maryssa Payne, Grant Currant, Cecilia Sirovina, Sarah Pace, Alisha Provot, Elizabeth Carlson, Thea Cabanilla):** these are owner-listed properties not on Gaston's co-host profile. To add hero images we need either:
1. Owner consent + their public Airbnb / Vrbo listing URL → I can pull the og:image
2. Aaron supplies images directly

The schema accepts `heroImage:` and `heroImageAlt:` per case study, plus `listingUrl:` for the public link. Drop URLs in this doc and I'll wire them up.

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
