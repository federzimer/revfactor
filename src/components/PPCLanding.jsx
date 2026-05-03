import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X, ShieldCheck } from 'lucide-react';
import { GrowthBook } from '@growthbook/growthbook-react';
import ScheduleModal from './ScheduleModal';

/* ─── GrowthBook A/B testing ───
   PUBLIC_GROWTHBOOK_KEY is set in Vercel env (encrypted) and exposed to
   client at build time. When set, the SDK fetches the ppc_hero_layout
   feature flag and assigns visitors to stacked or split via cookie-backed
   id (stable per visitor on repeat visits). When unset, the SDK no-ops
   and the layout prop / ?v= URL param wins. */
const GROWTHBOOK_KEY = import.meta.env.PUBLIC_GROWTHBOOK_KEY;
const gb = new GrowthBook({
  apiHost: 'https://cdn.growthbook.io',
  clientKey: GROWTHBOOK_KEY || '',
  enableDevMode: import.meta.env.DEV,
  // Per-visitor sticky bucketing. Cookie 'gb_visitor' is set on first visit
  // and re-used for variant assignment. Falls back to a random id if cookie
  // can't be read (server-side / first paint).
  trackingCallback: (experiment, result) => {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    // Forward GrowthBook variant assignment to GA4 so we can attribute
    // book_strategy_call conversions back to stacked vs split.
    window.gtag('event', 'experiment_viewed', {
      experiment_id: experiment.key,
      variation_id: result.variationId,
      variation_value: String(result.value),
    });
  },
});

function getOrSetVisitorId() {
  if (typeof document === 'undefined') return 'ssr';
  const m = document.cookie.match(/(?:^|;\s*)gb_visitor=([^;]+)/);
  if (m) return m[1];
  const id = (crypto.randomUUID && crypto.randomUUID()) ||
             (Math.random().toString(36).slice(2) + Date.now().toString(36));
  document.cookie = `gb_visitor=${id}; max-age=${60 * 60 * 24 * 365}; path=/; SameSite=Lax`;
  return id;
}

if (GROWTHBOOK_KEY && typeof window !== 'undefined') {
  gb.setAttributes({ id: getOrSetVisitorId(), url: window.location.pathname });
  gb.loadFeatures({ autoRefresh: false }).catch(() => { /* fail open: defaults apply */ });
}

/* ─── Dynamic Text Replacement (DTR) variants ───
   The 3 paid Google Ads campaigns each pass a ?msg=<key> query param so the
   landing page headline + subhead matches the search intent that produced
   the click. Configured in deploy_campaigns.py as Final URL Suffix.

   When ?msg is absent (organic, direct, or unrecognized), the .astro page's
   own headline/subhead props serve as the default (no DTR override). */
const MESSAGE_VARIANTS = {
  // Consultant Intent campaign — searcher already knows they want a consultant
  consultant: {
    eyebrow: 'STR REVENUE STRATEGY',
    headlinePart1: 'Most STRs lose 18% in revenue.',
    headlinePart2Italic: 'We get it back.',
    subhead: 'Most consultants run an audit, hand you a deck, and disappear. We don’t. A seasoned pricing strategist stays on every account. Monthly calls, weekly comp tracking, calendar optimization, plus 24/7 dashboard messaging. Documented +18% lift. Flat $320/mo.',
    ctaText: 'Book Free Strategy Call',
  },
  // Tool Intent campaign — searcher is shopping a pricing tool, reframe the category
  tool: {
    eyebrow: 'BEYOND PRICING TOOLS',
    headlinePart1: 'Pricing tools set numbers.',
    headlinePart2Italic: 'We set strategy.',
    subhead: 'Your pricing tool prices tonight. We build the strategy that makes it work and pull back the 18% your algorithm leaves on the table. Works alongside any tool. Direct access to a seasoned strategist plus 24/7 dashboard messaging. Flat $320/mo.',
    ctaText: 'Book Free Strategy Call',
  },
  // Conquest campaign — searcher is on PriceLabs / Wheelhouse / Beyond
  conquest: {
    eyebrow: 'STRATEGY YOUR TOOL CAN’T SHIP',
    headlinePart1: 'Already on PriceLabs?',
    headlinePart2Italic: 'You’re probably 18% short.',
    subhead: 'Algorithms set the numbers. They can’t set the strategy that makes the numbers actually work. Comp positioning, length-of-stay rules, channel mix, listing audit. A seasoned pricing strategist does. Documented +18% lift across our portfolio. Plus 24/7 dashboard messaging.',
    ctaText: 'Book Free Strategy Call',
  },
};

function readMessageVariant() {
  if (typeof window === 'undefined') return null;
  const m = new URLSearchParams(window.location.search).get('msg');
  return m && MESSAGE_VARIANTS[m] ? MESSAGE_VARIANTS[m] : null;
}

/* ─── Subhead A/B/C test ───
   Three rewrites of the default hero subhead, tested against the page's
   built-in copy. Drops the "24/7 dashboard messaging" claim (visitors can
   message anytime but humans answer business hours — overpromise) and
   bakes in volume-discount language so single-property and portfolio
   prospects both see the relevant pricing signal.

   Priority: DTR (?msg=) > test variant (?sh= or GB flag) > page default.
   That keeps Google Ads campaigns on their tuned messaging while the
   experiment runs on baseline (organic / direct / SEO) traffic. */
const SUBHEAD_VARIANTS = {
  b: 'Your tool sets the number. We set the strategy. Comp tracking, calendar moves, length-of-stay rules, channel mix. The work that recovers the 18% an algorithm can’t see. Direct access to a senior strategist. $320/month per property, less per door at scale.',
  c: 'Most STRs run a pricing tool and stop there. They leave 18% on the table. We pull it back with the work a tool can’t do: comp positioning, calendar timing, length-of-stay strategy. Every move a human catches that an algorithm misses. $320/month per property, volume pricing past 5.',
  d: 'A pricing tool sets your nightly number. That’s about all it can do. The 18% lift comes from the work around it: comp tracking, calendar moves, length-of-stay rules. Judgment calls a strategist makes that an algorithm can’t. You get one. $320/month per property, less per door at scale.',
};

function readSubheadOverride() {
  if (typeof window === 'undefined') return null;
  const sh = new URLSearchParams(window.location.search).get('sh');
  return sh && SUBHEAD_VARIANTS[sh] ? sh : null;
}

/* ─── Animation primitives ───
   Lightweight IntersectionObserver-based reveal + count-up. No GSAP dep here
   (the brand site uses GSAP elsewhere; this keeps the PPC bundle small). */
function useInView(ref, threshold = 0.25) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect(); } },
      { threshold, rootMargin: '0px 0px -10% 0px' }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold, seen]);
  return seen;
}

// Animated number that ticks from 0 → target when first scrolled into view.
// Pass `prefix` (e.g. "+", "$") and `suffix` (e.g. "%").
//
// Default value = target so SSR / crawlers / social-preview screenshots /
// fast-scrolling users see the correct number, not 0%. Animation only runs
// when the user has actually scrolled past initial viewport — fixes the
// visible-bug where above-fold users saw the strip flash 0% before catching
// up, AND prevents the proof strip from rendering as zeros to bots.
function CountUp({ to, prefix = '', suffix = '', duration = 1400, decimals = 0 }) {
  const [val, setVal] = useState(to);
  const animatedRef = useRef(false);
  const initialScrollY = useRef(0);
  const ref = useRef(null);
  const inView = useInView(ref);

  useEffect(() => {
    if (typeof window !== 'undefined') initialScrollY.current = window.scrollY;
  }, []);

  useEffect(() => {
    if (!inView || animatedRef.current) return;
    animatedRef.current = true;
    // Only animate if the user actually scrolled to reveal this element.
    // Above-fold elements that were visible from page load already display
    // the target value — no need to flash to 0 then back up.
    const scrolled = typeof window !== 'undefined' && window.scrollY > initialScrollY.current + 50;
    if (!scrolled) return;
    setVal(0);
    let raf, start;
    const tick = (ts) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setVal(to * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// Scroll-reveal wrapper: fades + slides up its children when scrolled into
// view. Accepts an optional `delay` (ms) for stagger.
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 700ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms, transform 700ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── PPC Landing Page Component ───
   Single-purpose conversion-optimized page for paid search traffic.
   Brand-matched (bone/moss/cedar/walnut/tobacco design tokens).
   Single CTA: opens ScheduleModal everywhere.
   Sections: Hero → +18% claim → Tools-vs-Strategy table → Testimonials →
             How it works → FAQ → Final CTA. */

// Testimonials sourced from RevFactor_Digital_PR_Onboarding_COMPLETED.docx
// (Federico's verified client case studies) and the live revfactor.io
// homepage. Names + metrics are real; quote fields use the case-study
// language verbatim (no fabricated first-person speech).
// Set `photo: "/team/<name>.jpg"` only after the image file is actually
// committed to public/team/. Until then, leave undefined so the initials
// circle renders cleanly. Drop new photos at /Users/aaronwhittaker/Claude/
// RevFactor/public/team/<filename>.jpg and add the path here.
const TESTIMONIALS = [
  {
    name: "Zoey Berghoff",
    initials: "ZB",
    photo: "/team/zoey-berghoff.jpg",
    role: "STR Host · Property launch",
    metric: "$30K+",
    quote: "$30,000+ single booking on launch property. RevFactor priced the listing into a high-demand window before reviews stacked up.",
  },
  {
    name: "Kassidy",
    initials: "K",
    photo: "/team/kassidy.jpg",
    role: "STR Host · Sustained portfolio growth",
    metric: "+20%",
    quote: "+20% monthly revenue increase, sustained across multiple properties.",
  },
  {
    name: "Kate Henry",
    initials: "KH",
    photo: "/team/kate-henry.jpg",
    role: "STR Host · Documented case study",
    metric: "+75%",
    quote: "$4,000 → $7,000 in one month. +75% revenue lift after RevFactor took over pricing strategy.",
  },
];

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Strategy Call",
    body: "30 minutes with a seasoned pricing strategist. We review your portfolio, market, and current pricing. You leave with concrete revenue recommendations whether you work with us or not.",
  },
  {
    n: "02",
    title: "Onboarding & Audit",
    body: "We connect to your PMS, audit your listings, and benchmark your performance against the comp set. You see the revenue gap on day one. Plus RevFactor dashboard access with 24/7 messaging into your strategist.",
  },
  {
    n: "03",
    title: "Ongoing Strategy",
    body: "Monthly strategy calls with your dedicated strategist, dynamic pricing calibration, calendar optimization, and comp tracking. Always-on dashboard messaging between calls. Flat $320/mo per property.",
  },
];

export default function PPCLanding({
  eyebrow: defaultEyebrow,
  headlinePart1: defaultHeadlinePart1,
  headlinePart2Italic: defaultHeadlinePart2Italic,
  subhead: defaultSubhead,
  ctaText: defaultCtaText = "Schedule a free strategy call",
  comparisonRows,
  faqs,
  finalCtaPretext = "Ready to talk strategy?",
  // Hero image base name from public/heroes/ — each PPC page passes its own.
  // Files: <heroBase>-1200.webp, -1920.webp, -2400.webp must all exist.
  // Available: clifftop (V3 dusk), aframe (V4 golden hour), snowcap (V2 peaks),
  // meadow (V1 hazy mountains).
  heroBase = "clifftop",
  // Optional override for the split-hero variant only — lets a brighter
  // image surface behind the calendar without changing the stacked hero.
  // Falls back to heroBase when not provided.
  splitHeroBase,
  heroAlt = "Modern luxury short-term rental property managed by RevFactor",
  // "stacked" (default, image bg + CTA above the comparison/testimonials/calendar
  // sections) or "split" (calendar embedded RIGHT-of-hero, headline on the LEFT).
  // Split layout = ClickFunnels-style book-without-scrolling treatment for paid
  // traffic. A/B test variant.
  layout = "stacked",
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // All page CTAs scroll to the inline #schedule section instead of opening
  // a duplicate-calendar modal. ExitIntent popup is the only place that
  // still uses an embedded calendar (since the user is mid-exit and we
  // want to keep them in-context).
  const open = () => {
    const el = typeof document !== 'undefined' && document.getElementById('schedule');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const calRef = useRef(null);
  // Default tall enough that the calendar's date grid + bottom legend always
  // show without scrolling on mobile + desktop. The scheduler app posts a
  // height update via postMessage when the user changes step (date → time →
  // form → confirmed) — until then this minimum keeps the embed unclipped.
  const [calHeight, setCalHeight] = useState(820);

  // DTR — read ?msg= URL param after mount and override hero copy if it
  // matches a known variant. Server-rendered HTML uses the .astro page's
  // default props; the swap happens on client hydration. Page is noindex,
  // so SEO impact of the brief content swap is irrelevant.
  const [variant, setVariant] = useState(null);
  // Layout A/B: precedence is URL override (?v=split for QA) > GrowthBook
  // feature flag (production traffic split) > page-level layout prop default.
  // Read GrowthBook directly via gb.evalFeature() instead of the React hook
  // (the hook needs a Provider in the parent tree; we'd rather keep this
  // component standalone since it's mounted via Astro's client:load).
  const [layoutOverride, setLayoutOverride] = useState(null);
  const [gbLayout, setGbLayout] = useState(null);
  const [subheadOverride, setSubheadOverride] = useState(null);
  const [gbSubhead, setGbSubhead] = useState(null);
  useEffect(() => {
    setVariant(readMessageVariant());
    setSubheadOverride(readSubheadOverride());
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('v');
      if (v === 'split' || v === 'stacked') setLayoutOverride(v);
    }
    if (GROWTHBOOK_KEY) {
      // GA4 forwarding for rollout-type rules. The SDK's trackingCallback
      // fires only for proper experiment rules; rollout rules deliver a
      // bucketed value but stay silent. We fire experiment_viewed manually
      // once per page-load per feature so GA4 can attribute conversions.
      const fired = new Set();
      const fireOnce = (feature, value) => {
        if (fired.has(feature) || !value) return;
        fired.add(feature);
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          window.gtag('event', 'experiment_viewed', {
            experiment_id: feature,
            variation_value: String(value),
          });
        }
      };
      const tick = () => {
        try {
          const v = gb.getFeatureValue('ppc_hero_layout', '');
          if (v === 'split' || v === 'stacked') {
            setGbLayout(v);
            fireOnce('ppc_hero_layout', v);
          }
          const s = gb.getFeatureValue('ppc_subhead_variant', '');
          if (s in SUBHEAD_VARIANTS) {
            setGbSubhead(s);
            fireOnce('ppc_subhead_variant', s);
          }
        } catch { /* fail open */ }
      };
      tick();
      // Re-check after features load (~50-200ms post-mount).
      const t1 = setTimeout(tick, 250);
      const t2 = setTimeout(tick, 1000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, []);
  const effectiveLayout = layoutOverride || gbLayout || layout;
  const eyebrow = variant?.eyebrow ?? defaultEyebrow;
  const headlinePart1 = variant?.headlinePart1 ?? defaultHeadlinePart1;
  const headlinePart2Italic = variant?.headlinePart2Italic ?? defaultHeadlinePart2Italic;
  // Subhead resolution: DTR campaign (?msg=) wins; otherwise test variant
  // (?sh= URL > GB flag) wins; otherwise page default.
  const subheadKey = subheadOverride || gbSubhead;
  const subhead = variant?.subhead
    ?? (subheadKey ? SUBHEAD_VARIANTS[subheadKey] : defaultSubhead);
  const ctaText = variant?.ctaText ?? defaultCtaText;

  // Schedule iframe at schedule.revfactor.io is a custom Next.js app —
  // it posts iframe dimensions via postMessage so the parent can resize.
  useEffect(() => {
    const onMessage = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      const h =
        e.data?.data?.iframeHeight ??
        e.data?.iframeHeight ??
        e.data?.data?.height ??
        e.data?.height;
      const n = Number(h);
      if (Number.isFinite(n) && n > 200 && n < 2000) setCalHeight(n);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <>
      {/* Mobile-only tobacco text-shadow on the hero italic so it stays
          legible against the brighter parts of the cliffside/cabin image
          when the page is single-column (sub-md). Desktop already has a
          dark gradient under the headline area. */}
      <style>{`
        @media (max-width: 767px) {
          .ppc-hero-italic {
            text-shadow:
              0 0 10px rgba(63, 38, 31, 0.95),
              0 0 6px rgba(63, 38, 31, 0.95),
              0 1px 2px rgba(63, 38, 31, 1);
          }
        }
      `}</style>

      {/* ─── HERO ─── Two layouts: "stacked" (image bg + CTA, calendar lives
           in #schedule below) or "split" (calendar embedded right-of-hero so
           visitors book without scrolling). Toggled via layout prop or
           ?v=split URL param for A/B testing. */}
      {effectiveLayout === 'split' ? (
        <section className="relative min-h-[88vh] md:min-h-[92vh] flex items-center overflow-hidden bg-[#161910]">
          {/* Background image — full opacity, lighter directional gradient so
              the image actually reads behind the calendar. Gradient tint
              keeps headline legible on the left half. Same treatment as
              stacked hero. splitHeroBase lets the page swap in a brighter
              image for this variant only. */}
          {(() => {
            const splitBase = splitHeroBase || heroBase;
            return (
              <picture>
                <source
                  type="image/webp"
                  srcSet={`/heroes/${splitBase}-1200.webp 1200w, /heroes/${splitBase}-1920.webp 1920w, /heroes/${splitBase}-2400.webp 2400w`}
                  sizes="100vw"
                />
                <img
                  src={`/heroes/${splitBase}-1920.webp`}
                  alt={heroAlt}
                  fetchpriority="high"
                  decoding="async"
                  width="1920"
                  height="1048"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </picture>
            );
          })()}
          {/* Sub-lg (single-column, copy stacked above calendar): darker
              top-down gradient so the headline reads against the brighter
              parts of the image. lg+ (two-column, copy on left): horizontal
              gradient — darker on left where text sits, image visible right
              behind the calendar. */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#161910]/85 via-[#161910]/55 to-[#161910]/20 lg:hidden" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#161910] via-[#161910]/70 to-[#161910]/15 hidden lg:block" />

          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-12 md:pt-32 md:pb-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* LEFT — copy + risk-reversal + founder signature */}
            <div className="lg:pr-6">
              <p className="font-bold uppercase text-[11px] tracking-[3px] text-[#A8BBA3] mb-5">
                {eyebrow}
              </p>
              <h1
                className="text-[clamp(34px,5.4vw,60px)] leading-[1.05] text-[#E8E6E1] mb-5"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: '0.5px' }}
              >
                {headlinePart1}{' '}
                {headlinePart2Italic && (
                  <span className="ppc-hero-italic" style={{ fontStyle: 'italic', color: '#A8BBA3' }}>
                    {headlinePart2Italic}
                  </span>
                )}
              </h1>
              <p className="text-[16px] md:text-[18px] leading-[1.55] text-[#DDDAD3] mb-6">
                {subhead}
              </p>
              <div className="flex items-start gap-2.5 mb-6">
                <ShieldCheck className="w-5 h-5 text-[#A8BBA3] mt-[2px] flex-shrink-0" />
                <p className="text-[15px] leading-[1.55] text-[#C8C4BC]">
                  <span className="font-bold text-[#E8E6E1]">Our promise:</span>{' '}
                  3 specific revenue recommendations even if we never work together.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-5 border-t border-[#3F261F]/40">
                <img
                  src="/team/federico.jpg"
                  alt="Federico Zimerman, founder of RevFactor"
                  width="56"
                  height="56"
                  loading="eager"
                  decoding="async"
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                />
                <div className="leading-tight">
                  <p className="text-[15px] text-[#E8E6E1] font-medium mb-0.5">Federico Zimerman</p>
                  <p className="text-[10px] uppercase tracking-[1.5px] text-[#A8BBA3] font-bold">Founder · STR Revenue Strategist</p>
                </div>
              </div>
            </div>

            {/* RIGHT — viewport-capped iframe wrapper; iframe handles its own
                internal scroll on tall steps (form). marginTop:-38 clips 38px
                of the embed page's 48px py-12 top padding, leaving 10px of
                bone-light padding visible above the dark green header. */}
            <div
              className="rounded-[16px] overflow-hidden"
              style={{ height: 'min(720px, calc(100vh - 200px))' }}
            >
              <iframe
                src="https://schedule.revfactor.io/embed"
                title="Schedule a strategy call with RevFactor"
                className="w-full border-0 block"
                style={{ marginTop: '-38px', height: 'calc(100% + 38px)' }}
                allow="payment"
              />
            </div>
          </div>
        </section>
      ) : (
      /* ─── STACKED HERO (default) — image background + CTA, calendar in #schedule below ─── */
      <section className="relative min-h-[78vh] md:min-h-[88vh] flex items-end overflow-hidden">
        <picture>
          <source
            type="image/webp"
            srcSet={`/heroes/${heroBase}-1200.webp 1200w, /heroes/${heroBase}-1920.webp 1920w, /heroes/${heroBase}-2400.webp 2400w`}
            sizes="100vw"
          />
          <img
            src={`/heroes/${heroBase}-1920.webp`}
            alt={heroAlt}
            fetchpriority="high"
            decoding="async"
            width="1920"
            height="1048"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>
        {/* Lightened gradient — was dual-overlay charcoal that washed out the cabin.
            Now: directional left-side darkening so headline stays legible, but the
            cabin actually shows on the right 50% of the hero. */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#161910] via-[#161910]/75 to-[#161910]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161910]/70 via-transparent to-transparent" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-32 pb-16 md:pt-40 md:pb-24">
          <div className="max-w-2xl">
            <p className="font-bold uppercase text-[11px] tracking-[3px] text-[#7A8B76] mb-6">
              {eyebrow}
            </p>
            <h1
              className="text-[clamp(36px,6vw,68px)] leading-[1.05] text-[#E8E6E1] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: '0.5px' }}
            >
              {headlinePart1}{' '}
              {headlinePart2Italic && (
                <span className="ppc-hero-italic" style={{ fontStyle: 'italic', color: '#7A8B76' }}>
                  {headlinePart2Italic}
                </span>
              )}
            </h1>
            <p className="text-[17px] md:text-[19px] leading-[1.55] text-[#E8E6E1] max-w-xl mb-8">
              {subhead}
            </p>
            <button
              onClick={open}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[12px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(93,109,89,0.35)]"
            >
              <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" />
              <span className="relative z-10">{ctaText}</span>
              <ArrowRight className="relative z-10 w-4 h-4" />
            </button>
            {/* Risk-reversal — explicit guarantee badge under the CTA. Reframes
                the call as "free advice, not a sales pitch" → lifts CVR for
                cold paid traffic. */}
            <div className="mt-5 flex items-start gap-2.5 max-w-lg">
              <ShieldCheck className="w-5 h-5 text-[#7A8B76] mt-[2px] flex-shrink-0" />
              <p className="text-[16px] leading-[1.55] text-[#C8C4BC]">
                <span className="font-bold text-[#E8E6E1]">Our promise:</span>{' '}
                You walk away with 3 specific revenue recommendations for your property, even if we never work together.
              </p>
            </div>
            {/* Founder signature — Federico's actual photo + name above fold for trust */}
            <div className="mt-7 flex items-center gap-4 pt-5 border-t border-[#3F261F]/40 max-w-md">
              <img
                src="/team/federico.jpg"
                alt="Federico Zimerman, founder of RevFactor"
                width="68"
                height="68"
                loading="eager"
                decoding="async"
                className="w-[68px] h-[68px] rounded-full object-cover flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              />
              <div className="leading-tight">
                <p className="text-[16px] text-[#E8E6E1] font-medium mb-0.5">Federico Zimerman</p>
                <p className="text-[11px] uppercase tracking-[1.5px] text-[#7A8B76] font-bold">Founder · STR Revenue Strategist</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ─── PROOF STRIP — animated count-up on scroll ─── */}
      <section className="bg-[#13342D] py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { to: 18,  prefix: '+', suffix: '%',     label: 'Avg revenue lift' },
            { to: 165, prefix: '',  suffix: '+',     label: 'Properties managed' },
            { to: 320, prefix: '$', suffix: '',      label: '/mo flat per property' },
            { to: 30,  prefix: '',  suffix: ' min',  label: 'Free strategy call' },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 100}>
              <div
                className="text-[clamp(36px,5vw,52px)] text-[#E8E6E1] leading-none mb-2"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
              >
                <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="font-bold uppercase text-[11px] tracking-[2px] text-[#A8BBA3]">
                {s.label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── (Moved up: social proof before objections.
           Hero → +18% strip → testimonials → schedule lets PPC visitors hit a
           booking surface within 2 scrolls instead of 5.) */}
      <section id="results" className="bg-[#DDDAD3] py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-4 text-center">
            DOCUMENTED RESULTS
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#3F261F] mb-8 text-center max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Hosts seeing{' '}
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>real revenue lift</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 120} className="h-full">
              <div
                className="h-full bg-[#E8E6E1] rounded-[20px] p-6 md:p-7 border border-[#C8C4BC] flex flex-col transition-transform duration-[350ms] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(22,25,16,0.10)]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  {t.photo ? (
                    <img
                      src={t.photo}
                      alt={t.name}
                      width="56"
                      height="56"
                      loading="lazy"
                      decoding="async"
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <div
                    className={`w-14 h-14 rounded-full bg-[#5D6D59] text-[#E8E6E1] items-center justify-center text-[14px] font-bold tracking-wider flex-shrink-0 ${t.photo ? 'hidden' : 'flex'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {t.initials}
                  </div>
                  <div
                    className="text-[32px] text-[#5D6D59] leading-none"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
                  >
                    {t.metric}
                  </div>
                </div>
                <p
                  className="text-[18px] md:text-[19px] leading-[1.5] text-[#3F261F] mb-5 italic flex-grow"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
                >
                  "{t.quote}"
                </p>
                <div className="border-t border-[#C8C4BC] pt-4">
                  <p className="text-[16px] font-bold text-[#3F261F] mb-0.5">
                    {t.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-[1.5px] text-[#76574C] font-bold">
                    {t.role}
                  </p>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INLINE CALENDAR EMBED ─── (Moved up: directly after testimonials,
           so a converted visitor can book within 2 scrolls of the hero. The
           comparison table and process now act as objection handlers for
           visitors who scrolled past the calendar without booking.
           Asymmetric vertical padding: tight to the testimonial section above
           — visitors who saw +75% / +20% / 5★ should hit the calendar
           immediately, not scroll past 200px of dead space first.) */}
      <section id="schedule" className="bg-[#DDDAD3] pt-4 pb-12 md:pt-6 md:pb-16">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-3 text-center">
            BOOK A CALL
          </p>
          <h2
            className="text-[clamp(26px,4vw,38px)] leading-[1.15] text-[#3F261F] mb-3 text-center"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Pick a time to{' '}
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>talk strategy</span>
          </h2>
          <p className="text-[16px] leading-[1.55] text-[#76574C] max-w-lg mx-auto mb-6 text-center">
            30-minute call with a seasoned RevFactor pricing strategist. We'll review your portfolio, comp set, and where the revenue opportunity is.
          </p>
          {/* Inline calendar — fixed-cap height so the page never grows
              taller than ~720px for the embed; the iframe handles its own
              internal scroll on tall steps (form, etc.). marginTop:-38
              clips 38px of the embed page's 48px py-12 padding, leaving
              10px of bone-light padding above the dark green header. */}
          <div
            className="rounded-[20px] overflow-hidden shadow-[0_16px_64px_rgba(22,25,16,0.12)] border border-[#C8C4BC]"
            style={{ height: 'min(720px, calc(100vh - 160px))' }}
          >
            <iframe
              ref={calRef}
              src="https://schedule.revfactor.io/embed"
              title="Schedule a strategy call with RevFactor"
              className="w-full border-0 block"
              style={{ marginTop: '-38px', height: 'calc(100% + 38px)' }}
              allow="payment"
            />
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      <section id="difference" className="bg-[#E8E6E1] py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-4 text-center">
            THE DIFFERENCE
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#3F261F] mb-8 text-center max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Tools alone vs.{' '}
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>tools + strategy</span>
          </h2>

          <div className="bg-[#DDDAD3] rounded-[20px] overflow-hidden border border-[#C8C4BC]">
            <div className="grid grid-cols-3 bg-[#161910] text-[#E8E6E1] py-4 px-6 font-bold uppercase text-[10px] tracking-[2px]">
              <div>Capability</div>
              <div className="text-center">Pricing tool alone</div>
              <div className="text-center text-[#7A8B76]">+ RevFactor</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-6 py-4 text-[16px] ${i % 2 === 0 ? 'bg-[#DDDAD3]' : 'bg-[#E8E6E1]'}`}
              >
                <div className="text-[#3F261F] font-medium">{row.label}</div>
                <div className="text-center">
                  {row.tool ? (
                    <Check className="inline w-4 h-4 text-[#76574C]" />
                  ) : (
                    <X className="inline w-4 h-4 text-[#8B3A3A]" />
                  )}
                </div>
                <div className="text-center">
                  <Check className="inline w-4 h-4 text-[#5D6D59]" strokeWidth={3} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="process" className="bg-[#161910] py-12 md:py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[11px] tracking-[3px] text-[#7A8B76] mb-4 text-center">
            HOW IT WORKS
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#E8E6E1] mb-10 text-center max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            From{' '}
            <span style={{ fontStyle: 'italic', color: '#A8BBA3' }}>strategy call</span>{' '}
            to monthly partner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROCESS_STEPS.map((step) => (
              <div key={step.n}>
                <div
                  className="text-[16px] text-[#A8BBA3] mb-3"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
                >
                  {step.n}
                </div>
                <h3
                  className="text-[24px] text-[#E8E6E1] mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
                >
                  {step.title}
                </h3>
                <p className="text-[16px] leading-[1.65] text-[#DDDAD3]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="bg-[#E8E6E1] py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-4 text-center">
            QUESTIONS
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#3F261F] mb-8 text-center"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Things hosts{' '}
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>commonly ask</span>
          </h2>
          <div className="space-y-3">
            {faqs.map((q, i) => (
              <details
                key={i}
                className="bg-[#DDDAD3] rounded-[14px] px-6 py-4 border border-[#C8C4BC] group"
              >
                <summary className="cursor-pointer text-[16px] font-bold text-[#3F261F] flex justify-between items-center list-none">
                  <span>{q.q}</span>
                  <span className="text-[#5D6D59] group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <p className="mt-4 text-[16px] leading-[1.7] text-[#76574C]">
                  {q.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="bg-[#3F261F] py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-6 md:px-12 text-center">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#8F6E62] mb-5">
            {finalCtaPretext}
          </p>
          <h2
            className="text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#E8E6E1] mb-6"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Book a free 30-minute{' '}
            <span style={{ fontStyle: 'italic' }}>strategy call</span>
          </h2>
          <p className="text-[16px] leading-[1.7] text-[#8F6E62] max-w-lg mx-auto mb-10">
            We'll review your market, current pricing, and where the revenue opportunity is.
            Even if you don't end up working with us.
          </p>
          <button
            onClick={open}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[11px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" />
            <span className="relative z-10">{ctaText}</span>
            <ArrowRight className="relative z-10 w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ─── Minimal footer (no off-page links — ClickFunnels style) ─── */}
      <footer className="bg-[#161910] py-8">
        <div className="max-w-5xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-[#8F6E62]">
          <span
            className="text-[18px] tracking-[0.5px] text-[#C8C4BC]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            revfactor
          </span>
          <span>© {new Date().getFullYear()} RevFactor. Revenue strategy for STR hosts.</span>
        </div>
      </footer>

      {/* ─── Sticky mobile CTA ─── (Always-visible book-call bar at the bottom
           of the viewport on phones. ClickFunnels-standard for PPC pages so a
           visitor 8 sections deep is always one tap from the calendar.) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 bg-gradient-to-t from-[#161910] via-[#161910]/95 to-[#161910]/80 backdrop-blur-sm">
        <button
          onClick={open}
          className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[11px] tracking-[2px] rounded-full active:scale-[0.98] transition-transform"
        >
          <span>Book Free Strategy Call</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {/* Spacer so the sticky bar never covers the final CTA on mobile.
          bg-onyx so when fully scrolled there's no bone-light gap between
          the footer and the sticky bar's translucent top edge. */}
      <div className="md:hidden h-20 bg-[#161910]" aria-hidden="true" />

      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
