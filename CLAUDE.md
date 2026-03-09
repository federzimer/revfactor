# CLAUDE.md — RevFactor Landing Page

> Persistent context file for Claude Code sessions.

---

## 1. Project Overview

RevFactor is a **cinematic, high-fidelity landing page** for a strategic revenue management consultancy serving short-term rental (STR) hosts. The aesthetic identity is "Precision Revenue Craft" — a blend of Wall Street data intelligence with luxury hospitality warmth.

**Who it's for:** STR property owners and portfolio managers looking for expert dynamic pricing strategy (not just tools).

**Primary CTA:** "Schedule a Strategy Call" — leads to a consultation, NOT an audit or sign-up flow. RevFactor does not offer a free audit or direct subscription from the landing page.

---

## 2. Tech Stack & Dependencies

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | ^19.2.0 |
| Build Tool | Vite | ^7.3.1 |
| CSS | Tailwind CSS (v4) | ^4.2.1 |
| Animations | GSAP + ScrollTrigger | ^3.14.2 |
| Icons | Lucide React | ^0.575.0 |
| Linting | ESLint + React plugins | ^9.39.1 |

**Fonts (Google Fonts, loaded via CSS @import):**
- Cormorant Garamond (300, 400, 500 — regular & italic)
- JetBrains Mono (400, 500, 600)

---

## 3. Project Structure

```
landingTestClaude/
├── index.html                  # Entry HTML
├── vite.config.js              # Vite config (port 4321, React + Tailwind plugins)
├── package.json                # Scripts: dev, build, lint, preview
├── eslint.config.js            # ESLint config (JS/JSX, React hooks)
├── public/
│   └── vite.svg
├── src/
│   ├── main.jsx                # React root mount
│   ├── App.jsx                 # Assembles all sections in order
│   ├── index.css               # Design tokens (@theme), global styles, noise overlay
│   ├── assets/
│   │   └── react.svg
│   └── components/
│       ├── Navbar.jsx           # Floating pill nav, transparent→glassmorphic on scroll
│       ├── Hero.jsx             # 100dvh hero, GSAP staggered entrance, Unsplash bg
│       ├── Pain.jsx             # Problem section + ChaosCalendar sub-component
│       ├── Features.jsx         # 3 interactive micro-UIs (MetricShuffler, StrategyTypewriter, CalendarOptimizer)
│       ├── Philosophy.jsx       # "what should I charge?" vs "what is every night worth?"
│       ├── Process.jsx          # 3 sticky stacking cards + animated SVGs
│       ├── SocialProof.jsx      # Testimonial grid with metric badges
│       ├── Qualification.jsx    # "For you" vs "Not for you" split
│       ├── FAQ.jsx              # Accordion with smooth height animation (6 items)
│       ├── CTA.jsx              # Pre-footer CTA band
│       └── Footer.jsx           # Onyx footer, pulsing status indicator
└── dist/                        # Production build output
```

---

## 4. Environment Variables

**None required.** The project is a static landing page with no API calls, no backend, and no secrets. All images are loaded from public Unsplash URLs.

---

## 5. Running Locally

```bash
# Install dependencies
npm install

# Start dev server (port 4321)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

Dev server runs on **http://localhost:4321** (configured in `vite.config.js`).

---

## 6. Deploy Process

**Vercel (recommended):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

Or connect the GitHub repo (`https://github.com/ImGaston/landingTesting.git`) to Vercel with:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- No env vars needed

**Manual / other hosts:**
```bash
npm run build
# Serve the `dist/` folder as static files
```

---

## 7. Design System

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

---

## 8. Patterns & Conventions

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

---

## 9. Known Issues & Cautions

1. **Unsplash images:** Hero and Philosophy backgrounds load from Unsplash URLs. These could change or become unavailable — consider self-hosting for production.

2. **Font loading:** Google Fonts are loaded via CSS `@import` which can cause FOIT/FOUT. Consider switching to `<link rel="preload">` in `index.html` for better performance.

3. **GSAP license:** GSAP is free for most use cases but has a commercial license for some features (ScrollSmoother, SplitText, etc.). The current code only uses free plugins (ScrollTrigger).

4. **No real links:** All anchor hrefs are `#` or `#section-id`. The "Schedule a Strategy Call" CTA needs a real booking link (e.g., Calendly).

5. **No analytics:** No tracking scripts are installed. Add Google Analytics, Plausible, or similar before launch.

6. **Testimonials are placeholder:** The client quotes, names, and metrics are representative but should be replaced with real testimonials.

7. **Accessibility:** Basic semantic HTML is in place but a full audit (color contrast, keyboard navigation, screen reader testing) should be done before launch.

8. **Process cards stacking:** The sticky stacking cards in `Process.jsx` can behave unexpectedly on very short viewports or older Safari. Test thoroughly on target devices.

9. **Port 4321:** Dev server runs on port 4321 (not the default 5173). This is intentional — configured in `vite.config.js`.

10. **Leftover Vite assets:** `public/vite.svg` and `src/assets/react.svg` are default Vite scaffold files and can be removed.
