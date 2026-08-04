# RevFactor — marketing site

Part of Fede's private multi-business stack; internal context lives in a private vault — ask Fede.

## 🔴 Verification gate (before any deliverable, recommendation, or content ships)
Full protocol: `~/Claude/VERIFICATION_GATE.md`.
- **DONE WHEN**: state the checkable done-condition before starting. Does-NOT-count: status reports, suggestions that don't name the metric they move, live-state claims not checked this session.
- **No claim about the live site / current data without a this-session check cited inline** — curl `www.revfactor.io`, Playwright render, GSC/GA4/Bing, or a build/lint run. Note: `revfactor.io` 307s to `www`; PPC LPs are intentionally `noindex` — verify against the live URL, don't assume. If unverifiable this session, write it as a question, not a finding.
- **Every recommendation names the goal-metric it moves.** No generic SEO-checklist busywork.
- **Independent refute pass before delivery** (the `judge` skill / clean-context subagent) — ship only claims that survive a disprove attempt. Do not self-certify.

## What this is
The RevFactor marketing/landing site (production: **www.revfactor.io**; `revfactor.io` 307s to `www`). A cinematic, high-fidelity site for a strategic revenue-management consultancy serving short-term-rental (STR) hosts — aesthetic identity "Precision Revenue Craft" (Wall-Street data intelligence + luxury hospitality warmth). Primary CTA: "Schedule a Strategy Call" (a consultation, not an audit or sign-up). Includes a blog/Journal, case studies, an About page, and several paid-traffic landing pages (kept `noindex,nofollow` and out of the sitemap).

## Stack
- **Framework**: Astro 5 (`.astro` pages + MDX content), with React 19 islands (`@astrojs/react`, `@astrojs/mdx`)
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite`)
- **Animation**: GSAP + ScrollTrigger
- **Icons**: Lucide React
- **Feature flags / experiments**: GrowthBook (`@growthbook/growthbook-react`)
- **Maps/data**: d3-geo, topojson-client, us-atlas
- **SEO**: `@astrojs/sitemap` (filters out the noindex PPC landing pages)
- **Testing**: Playwright (`tests/`)
- **Hosting**: Vercel — `*.vercel.app` preview hosts get an `X-Robots-Tag: noindex, nofollow` header (see `vercel.json`)

## How to run
- Install: `npm install`
- Dev: `npm run dev` (Astro dev server)
- Build: `npm run build` (`astro build`)
- Preview: `npm run preview`
- Lint: `npm run lint` (ESLint)

## Site structure
- `src/pages/*.astro` — top-level pages (`index`, `about`, `review`, legal pages, PPC LPs like `airbnb-pricing-strategy`, `short-term-rental-consultant`, `vs/`)
- `src/pages/blog/` — Journal index + posts
- `src/content/blog/`, `src/content/case-studies/` — MDX content collections (`src/content/config.ts`)
- `src/components/` — Astro + React components (incl. `blog/`)
- `src/layouts/`, `src/data/`, `src/assets/`
- `scripts/` — maintenance scripts (portfolio-stats sync, Google Ads tooling)

---

The content below is preserved from the repo's prior `CLAUDE.md`. Some of it (project-structure and "no API/backend" notes) describes an earlier Vite-only React layout and predates the current Astro + MDX setup described above — treat the sections above as authoritative for stack/run/structure, and the Design System, Patterns, Known Issues, QA, and Portfolio-stats sections below as still accurate.

## Project Overview

RevFactor is a **cinematic, high-fidelity landing page** for a strategic revenue management consultancy serving short-term rental (STR) hosts. The aesthetic identity is "Precision Revenue Craft" — a blend of Wall Street data intelligence with luxury hospitality warmth.

**Who it's for:** STR property owners and portfolio managers looking for expert dynamic pricing strategy (not just tools).

**Primary CTA:** "Schedule a Strategy Call" — leads to a consultation, NOT an audit or sign-up flow. RevFactor does not offer a free audit or direct subscription from the landing page.

## Design System

### Color Palette (defined as Tailwind v4 `@theme` tokens in `src/index.css`)

| Token | Hex | Usage |
|-------|-----|-------|
| `bone` | `#DDDAD3` | Primary background |
| `bone-light` | `#E8E6E1` | Light sections, nav text on dark |
| `bone-dark` | `#C8C4BC` | Borders, muted text |
| `moss` | `#5D6D59` | Accent color, checkmarks, status dots |
| `moss-light` | `#7A8B76` | Hero italic text, secondary accents |
| `cedar` | `#13342D` | Primary buttons, hero CTA |
| `cedar-light` | `#1E4A40` | Button hover states, qualification bg |
| `walnut` | `#76574C` | Body text |
| `walnut-light` | `#8F6E62` | Secondary text, labels |
| `tobacco` | `#3F261F` | Headings, CTA section bg |
| `onyx` | `#161910` | Dark sections, footer bg |
| `error` | `#8B3A3A` | Error states, "Revenue Lost" counter |

### Typography Rules

| Element | Font | Weight | Case | Size | Spacing |
|---------|------|--------|------|------|---------|
| Headings | Cormorant Garamond | 400 | sentence case | clamp(32-80px) | 0.5px |
| Emphasis/Subheadings | Cormorant Garamond Italic | 300-400 | sentence case | same | 0.5px |
| Labels/Badges | Helvetica | 700 (Bold) | ALL CAPS | 9-10px | 2-3px |
| Body | Helvetica | 400 | normal | 14-15px | standard |
| Data/Metrics | JetBrains Mono | 400-500 | varies | 11-22px | standard |
| Buttons | Helvetica | 700 (Bold) | ALL CAPS | 11px | 2px |

### Component Conventions

- **Rounded corners:** `rounded-[16px]` to `rounded-[24px]` for cards, `rounded-full` for buttons/badges
- **Shadows:** Warm, subtle — `rgba(22,25,16,0.06)` base
- **Noise overlay:** SVG feTurbulence on `body::after` at `0.04` opacity (global)
- **Button hover:** `scale(1.02)` + sliding background layer (`translateY`) with `overflow-hidden`
- **Brand easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` for transitions
- **Bounce easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)` for playful elements (MetricShuffler)
- **Duration tokens:** fast `120ms`, normal `200ms`, slow `350ms`

## Patterns & Conventions

### Animation Pattern (GSAP)
All GSAP animations use `gsap.context()` inside `useEffect` for proper cleanup:
```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // animations here
  }, sectionRef);
  return () => ctx.revert();
}, []);
```

ScrollTrigger is used for scroll-based reveals. Most elements use a class-based pattern (e.g., `.pain-animate`, `.faq-animate`) and `gsap.fromTo()` with `stagger`.

### Styling Pattern
- Tailwind utility classes inline — no separate CSS modules per component
- All design tokens live in `src/index.css` under `@theme`
- Font families are applied via inline `style={{ fontFamily: ... }}` since Tailwind v4 custom font tokens require explicit usage
- Colors are used as Tailwind classes (`text-[#3F261F]`) or via hex values directly

### Component Pattern
- Each section is a standalone component with its own `useRef` for GSAP context
- Sub-components (ChaosCalendar, MetricShuffler, StrategyTypewriter, CalendarOptimizer) are co-located in the parent component file
- No prop drilling — each component is self-contained with hardcoded content
- State is local (`useState`, `useRef`) — no global state management

### Responsive Pattern
- Mobile-first with `md:` breakpoint for two-column layouts
- Fluid typography via `clamp()` for all headings
- Grid switches from single column to multi-column at `md` breakpoint
- Navbar has dedicated mobile menu with hamburger toggle

## Known Issues & Cautions

1. **Unsplash images:** Hero and Philosophy backgrounds load from Unsplash URLs. These could change or become unavailable — consider self-hosting for production.

2. **Font loading:** Google Fonts are loaded via CSS `@import` which can cause FOIT/FOUT. Consider switching to `<link rel="preload">` in `index.html` for better performance.

3. **GSAP license:** GSAP is free for most use cases but has a commercial license for some features (ScrollSmoother, SplitText, etc.). The current code only uses free plugins (ScrollTrigger).

4. **No real links:** Some anchor hrefs are `#` or `#section-id`. The "Schedule a Strategy Call" CTA needs a real booking link.

5. **Testimonials are placeholder:** Some client quotes, names, and metrics are representative and should be replaced with real testimonials.

6. **Accessibility:** Basic semantic HTML is in place but a full audit (color contrast, keyboard navigation, screen reader testing) should be done before launch.

7. **Process cards stacking:** The sticky stacking cards in `Process.jsx` can behave unexpectedly on very short viewports or older Safari. Test thoroughly on target devices.

## QA / functional testing

User-facing flows are tested with Playwright. Tests live at `tests/`.

## Portfolio stats — single source of truth

Numbers like properties managed, markets, states, and RevPAR lift refresh often. They live in **one place**: `src/data/portfolio-stats.ts` (the `PORTFOLIO_STATS` + `STAT_LABELS` exports).

**React / Astro components** import `STAT_LABELS` directly and rerender on rebuild (hero stat ribbon, `/about/` STATS cards + map aria-desc, Journal hero stats + newsletter blurb).

**MDX/Astro prose** can't import a TS file (it's rendered as static markdown), so the canonical numbers are carried as literal text and kept in sync by a script:

```bash
# Update everything in one command (only writes the flags you pass):
python3 scripts/update_portfolio_stats.py \
  --properties 220 --markets 72 --states 26 --lift 26

# Dry-run first:
python3 scripts/update_portfolio_stats.py --properties 220 --dry-run
```

The script:
1. Writes new values into `src/data/portfolio-stats.ts`
2. Regex-sweeps known patterns across `src/content/blog/`, `src/pages/`, `src/components/`
3. Prints a count of rewrites per pattern
4. Leaves Google Ads RSAs untouched (those live in the Google Ads API, separate concern — see below)

**Google Ads ad copy uses the same numbers but lives out-of-band** in the Google Ads account. When portfolio stats refresh, also audit/refresh live RSAs via the scripts under `scripts/google-ads/` (`check_stale_stats.py`, `add_rsa_variants.py`, `campaigns_config.py`).
