# Blog 1 Image Audit + Redesign

**Date:** 2026-05-01
**Brand:** RevFactor — "Precision Revenue Craft" (cinematic, Wall Street precision + luxury hospitality warmth)
**Source of truth:** `reference_revfactor_brand_tokens.md` + `reference_revfactor_style_guide.md`
**Output folder:** `docs/blog-1-images/` — both `.svg` source + `.png` 1920×1080 render for each redesign

## Brand rules (non-negotiable)

| Rule | Why it matters |
|---|---|
| Lowercase headings, Cormorant Garamond | Brand voice — never title case |
| ALL CAPS labels, Helvetica Bold, letter-spacing 2-3px | Strong visual hierarchy |
| JetBrains Mono for all numbers | Data identity — prices, percentages, counts |
| Cedar (#13342D) primary, Moss (#5D6D59) accent only | No competing greens, no rainbow palettes |
| Bone (#DDDAD3) backgrounds | No pure white |
| Tobacco (#3F261F) for headings + high-emphasis only | Walnut (#76574C) for body |
| Noise overlay 0.04 opacity | No flat surfaces |
| Border-radius: 12px cards, 20px panels | No sharp corners |

---

## Image-by-image audit

### 1. Strategic Philosophy infographic (image1.png)
**Original score: 70/100 — close, needs polish**
- ✅ Cormorant italic title
- ✅ Bone background, cedar/moss/tobacco color blocks
- ❌ Title uses "Strategic Philosophy" (title case) — should be lowercase
- ❌ Labels "Reliability:" / "Interest:" / "Positioning:" use sans-bold not Helvetica ALL CAPS
- ❌ Numbered circles `02`, `03`, `04` (no `01`) — no clear hierarchy
- ❌ Numbers not in JetBrains Mono

**Redesign — `01-strategic-philosophy.svg/.png`:**
- lowercase "strategic philosophy" in Cormorant italic, cedar
- ALL CAPS section kicker "THE STRATEGIC FRAME" in Helvetica Bold + Walnut, 3px tracking
- Three columns: 01 INTEREST (cedar), 02 RELIABILITY (moss), 03 POSITIONING (tobacco)
- Disc + iconography blocks, ALL CAPS labels under each, body in Helvetica Walnut
- JetBrains Mono numbers, dashed walnut connector line
- Footer attribution in JetBrains Mono ALL CAPS

### 2. 7 Step Types Of Waste Diagram (image2.png)
**Original score: 20/100 — full redesign needed**
- ❌ Title case "7 Step Types Of Waste Diagram"
- ❌ Multi-color rainbow circles (purple, pink, green, orange, blue, yellow, navy, red) — completely off-brand
- ❌ Generic stock infographic look with low-res `revfactor` wordmark stuck in middle
- ❌ Numbers are random colors, not JetBrains Mono
- ❌ Body labels use sans-serif, no hierarchy
- ❌ Order doesn't reflect impact (per blog feedback we recommend reordering by frequency)

**Redesign — `02-seven-leaks.svg/.png`:**
- Title "the seven leaks" in Cormorant lowercase, cedar, 84px
- Kicker "WHERE PRICING TOOLS LEAVE MONEY ON THE TABLE" in Helvetica ALL CAPS
- Italic Cormorant subtitle: "ordered by frequency. all seven are invisible to the tool itself."
- Center emblem disc (cedar) with italic "revfactor" wordmark + ALL CAPS "7 LEAKS" subtag
- 7 nodes around dashed circle: pacing (01, top, cedar — most impact), base rate (02, moss), no-LOS-ladder (03, tobacco), minimum stays static (04, walnut), stale comp set (05, walnut), local events generic (06, moss), no PMS sync (07, tobacco)
- Each node: JetBrains Mono number on cedar/moss/tobacco/walnut disc, Helvetica bold label, Helvetica body description
- All monochrome — only the four brand colors

### 3. 6 Tactical Plays infographic (image3.png)
**Original score: 60/100 — light polish**
- ✅ Cedar background — on-brand
- ✅ Bone-light cards on cedar — clean
- ❌ Title "6 Tactical Plays to Boost Revenue" — title case
- ❌ Card headings use sans-bold, not Cormorant
- ❌ No JetBrains Mono play numbers
- ❌ No moss accent rule on cards
- ❌ Body copy in Arial-fallback sans

**Redesign — `03-six-tactical-plays.svg/.png`:**
- Cedar background with noise overlay
- Title "six plays that move revenue" in Cormorant lowercase, bone
- Italic subtitle "tools in a toolkit, not a script — when and how is the strategy."
- 6 cards in 3×2 grid, each:
  - "PLAY 01-06" in JetBrains Mono ALL CAPS, moss
  - Play name in Cormorant lowercase, cedar — long weekend strategy / gap filling / length-of-stay ladder / minimum stay edge / new listing launch / pms-aligned strategy
  - Body copy in Helvetica, walnut
  - Moss horizontal accent rule
- 12px border radius, subtle bone-dark border

### 4. Hero image — "Rental Revenue Management: The Definitive Guide" (image4.png)
**Original score: 0/100 — full replacement needed**
- ❌ Generic stock skyscrapers cityscape — completely off-brand
- ❌ RevFactor's aesthetic is luxury hospitality + cabins/mountains, NOT corporate office buildings
- ❌ Sans-bold "Rental Revenue Management" header — should be Cormorant lowercase
- ❌ Fluorescent green chart arrow — clashes with brand cedar/moss

**Redesign — `04-hero-overlay.svg/.png`:**
- Background: existing brand hero `public/heroes/cliffside-forest-v5.png` (clifftop modern STR home, mountains, sunrise) — same family as revfactor.io homepage
- Dark cedar gradient overlay for text legibility (matches homepage treatment)
- JetBrains Mono kicker: "REVENUE MANAGEMENT FOR SHORT-TERM RENTALS"
- Cormorant lowercase headline: "every night has its price." — same headline as the homepage hero, intentional brand consistency between site + blog
- Subhead: "the definitive guide — built on a decade of airline yield management applied across 165+ short-term rentals in 24 u.s. states."
- Stats strip at bottom in JetBrains Mono: 165+ properties / +18% RevPAR lift / 24 states & 56 markets

### 5. Money/cash bag image (image5.png) — "Why Pricing Tools Leave Money on the Table"
**Original score: 30/100 — replace with on-topic infographic**
- ✅ Cedar/moss color palette is close to brand
- ❌ Stock paper bag + dollar bills + thumbs-up icon = generic, cheesy
- ❌ Background patterns are generic infographic decoration
- ❌ Doesn't teach anything — pure decoration

**Redesign — `05-revpar-scoreboard.svg/.png`:**
- Repurposes the slot for the section's actual lesson — the ADR vs RevPAR Property A/B comparison from later in the post
- Title "revpar wins by ten dollars a night."
- Two side-by-side cards: Property A (bone-light, "looks busier on the calendar") vs Property B (cedar, "made $3,650 more.")
- Each card: occupancy / ADR / RevPAR / annualized revenue rows with JetBrains Mono figures
- RevPAR row emphasized — larger figure, cedar/moss accent
- Bottom callout strip: "+$10 per available night, every night, all year — +$3,650/yr"
- Visualizes the lesson rather than decorating it. Earns its scroll-position.

**Note:** If you'd rather keep image5 as a decorative break (not a teaching visual), I can swap to a moody brand architectural shot (cabin or clifftop) with a Federico pull-quote overlay. The scoreboard is more useful — but it's your call.

### 6. RevFactor.io homepage screenshot (image6.png)
**Original score: 100/100 — keep as-is**
- It is the brand by definition
- No redesign needed
- Recommend: regenerate as a fresh capture at publish time so it reflects whatever ships on revfactor.io

---

## What's delivered

```
docs/blog-1-images/
├── AUDIT.md                          ← this doc
├── 01-strategic-philosophy.svg       ← editable source
├── 01-strategic-philosophy.png       ← 1920×1080 render
├── 02-seven-leaks.svg
├── 02-seven-leaks.png
├── 03-six-tactical-plays.svg
├── 03-six-tactical-plays.png
├── 04-hero-overlay.svg
├── 04-hero-overlay.png
├── 05-revpar-scoreboard.svg
├── 05-revpar-scoreboard.png
└── _bg-cliffside-forest.png          ← brand background used by hero (copy from /public/heroes/)
```

All SVGs are pixel-perfect at any size — pre-render to PNG/WebP at the size needed for the post (recommend 1920×1080 master + a 1200×675 web-optimized version per image).

## Production notes for GetCito / publishing pipeline

1. **Send GetCito the PNGs** as the replacement for image1-5. Image 6 keeps a fresh screenshot of revfactor.io homepage taken at publish time.
2. **Compress to WebP** before publish (target < 200KB each). The PNGs ship at 600KB–2.6MB which is fine for source but too heavy for body content.
3. **Alt text** for each:
   - 01: "Strategic Philosophy: the three pillars of short-term rental revenue management — interest, reliability, positioning"
   - 02: "The seven leaks every short-term rental pricing tool misses, ranked by impact"
   - 03: "Six tactical plays that move short-term rental revenue — long weekend strategy, gap filling, LOS ladder, minimum stay edge, new listing launch, PMS sync"
   - 04: "Revenue management for short-term rentals — the definitive guide. RevFactor."
   - 05: "Property A vs Property B: RevPAR wins by ten dollars a night"
   - 06: "RevFactor.io homepage — every night has its price"
4. **OG image**: use `04-hero-overlay.png` as the social share / OpenGraph image for the post.
5. **In-body sizing**: render at full container width (1200px on desktop, fluid on mobile). Don't shrink to half-width — the infographics need the breathing room.

## What's next (if you approve direction)

- I can swap any of the redesigns if a different angle works better. Easiest changes: which background hero, which lesson the section-5 visual teaches, whether to add a 7th "leaks" diagram variant.
- I can render all 5 at 1200×675 + 800×450 sizes for responsive use.
- I can convert all to WebP at 80% quality with the brand naming convention used in `/public/images/` (e.g., `revenue-management-for-str-philosophy.webp`).
- Image 6 (homepage screenshot) regen is a 30-second Playwright script — happy to wire it up so you re-capture on demand at publish time.
