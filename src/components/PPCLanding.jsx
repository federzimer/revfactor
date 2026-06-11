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
    headlinePart1: 'Most STRs lose 24% in revenue.',
    headlinePart2Italic: 'We get it back.',
    subhead: 'Most consultants run an audit, hand you a deck, and disappear. We don’t. A seasoned pricing strategist stays on every account. Monthly calls, weekly comp tracking, calendar optimization, plus 24/7 dashboard messaging. Documented +24% lift. Flat $350/mo.',
    ctaText: 'Book a Discovery Call',
  },
  // Tool Intent campaign — searcher is shopping a pricing tool, reframe the category
  tool: {
    eyebrow: 'BEYOND PRICING TOOLS',
    headlinePart1: 'Pricing tools set numbers.',
    headlinePart2Italic: 'We set strategy.',
    subhead: 'Your pricing tool prices tonight. We build the strategy that makes it work and pull back the 24% your algorithm leaves on the table. Works alongside any tool. Direct access to a seasoned strategist plus 24/7 dashboard messaging. Flat $350/mo.',
    ctaText: 'Book a Discovery Call',
  },
  // Conquest campaign — searcher is on PriceLabs / Wheelhouse / Beyond
  conquest: {
    eyebrow: 'STRATEGY YOUR TOOL CAN’T SHIP',
    headlinePart1: 'Already on PriceLabs?',
    headlinePart2Italic: 'You’re probably 24% short.',
    subhead: 'Algorithms set the numbers. They can’t set the strategy that makes the numbers actually work. Comp positioning, length-of-stay rules, channel mix, listing audit. A seasoned pricing strategist does. Documented +24% lift across our portfolio. Plus 24/7 dashboard messaging.',
    ctaText: 'Book a Discovery Call',
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
  b: 'Your tool sets the number. We set the strategy. Comp tracking, calendar moves, length-of-stay rules, channel mix. The work that recovers the 24% an algorithm can’t see. Direct access to a senior strategist. Flat $350/month per property.',
  c: 'Most STRs run a pricing tool and stop there. They leave 24% on the table. We pull it back with the work a tool can’t do: comp positioning, calendar timing, length-of-stay strategy. Every move a human catches that an algorithm misses. Flat $350/month per property, enterprise pricing past 5.',
  d: 'A pricing tool sets your nightly number. That’s about all it can do. The 24% lift comes from the work around it: comp tracking, calendar moves, length-of-stay rules. Judgment calls a strategist makes that an algorithm can’t. You get one. Flat $350/month per property.',
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
// Default value = target so SSR / crawlers / social-preview screenshots /
// fast-scrolling users see the correct number, not 0%. Animation runs only
// when the user has actually scrolled past initial viewport — prevents the
// proof strip from flashing 0% on first paint or rendering zeros to bots.
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

// Sticky mobile CTA — visible by default, hidden once the calendar section
// scrolls into view. Avoids the bar overlapping the booking form on short
// iPhone viewports (the email field gets covered on iPhone SE / 14 Pro).
function StickyMobileCTA({ onOpen }) {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const target = document.getElementById('schedule');
    if (!target) return;
    const obs = new IntersectionObserver(
      ([e]) => setHidden(e.isIntersecting),
      { threshold: 0.2 }
    );
    obs.observe(target);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 bg-gradient-to-t from-[#161910] via-[#161910]/95 to-[#161910]/80 backdrop-blur-sm transition-transform duration-[300ms]"
      style={{ transform: hidden ? 'translateY(100%)' : 'translateY(0)' }}
      aria-hidden={hidden}
    >
      <button
        onClick={onOpen}
        className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[13px] tracking-[2px] rounded-full active:scale-[0.98] transition-transform shadow-[0_8px_24px_rgba(93,109,89,0.5),0_0_0_1px_rgba(232,230,225,0.2)]"
      >
        <span>Book a Discovery Call</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
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
   Sections: Hero → +24% claim → Tools-vs-Strategy table → Testimonials →
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
    title: "Discovery Call",
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
    body: "Monthly Discovery Calls with your dedicated strategist, dynamic pricing calibration, calendar optimization, and comp tracking. Always-on dashboard messaging between calls. Flat $350/mo per property.",
  },
];

export default function PPCLanding({
  eyebrow: defaultEyebrow,
  headlinePart1: defaultHeadlinePart1,
  headlinePart2Italic: defaultHeadlinePart2Italic,
  subhead: defaultSubhead,
  ctaText: defaultCtaText = "Schedule a discovery call",
  comparisonRows,
  faqs,
  finalCtaPretext = "Ready to talk strategy?",
  // Hero image base name from public/heroes/ — each PPC page passes its own.
  // Files: <heroBase>-1200.webp, -1920.webp, -2400.webp must all exist.
  // Available: clifftop (V3 dusk), aframe (V4 golden hour), snowcap (V2 peaks),
  // meadow (V1 hazy mountains).
  heroBase = "clifftop",
  heroAlt = "Modern luxury short-term rental property managed by RevFactor",
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  // All page CTAs open the Discovery Call modal (QualifierGate → optional
  // scheduler iframe) instead of scrolling to an inline embed. Removes the
  // unqualified-PM-company calendar bookings that were clogging Fede's
  // calendar; adds the no-property + PM-company lead-capture paths.
  const open = () => {
    if (typeof window !== 'undefined') {
      window.posthog?.capture('schedule_modal_opened', { source: 'ppc' });
    }
    setScheduleOpen(true);
  };

  // DTR — read ?msg= URL param after mount and override hero copy if it
  // matches a known variant. Server-rendered HTML uses the .astro page's
  // default props; the swap happens on client hydration. Page is noindex,
  // so SEO impact of the brief content swap is irrelevant.
  const [variant, setVariant] = useState(null);
  const [subheadOverride, setSubheadOverride] = useState(null);
  const [gbSubhead, setGbSubhead] = useState(null);
  useEffect(() => {
    setVariant(readMessageVariant());
    setSubheadOverride(readSubheadOverride());
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
  const eyebrow = variant?.eyebrow ?? defaultEyebrow;
  const headlinePart1 = variant?.headlinePart1 ?? defaultHeadlinePart1;
  const headlinePart2Italic = variant?.headlinePart2Italic ?? defaultHeadlinePart2Italic;
  // Subhead resolution: DTR campaign (?msg=) wins; otherwise test variant
  // (?sh= URL > GB flag) wins; otherwise page default.
  const subheadKey = subheadOverride || gbSubhead;
  const subhead = variant?.subhead
    ?? (subheadKey ? SUBHEAD_VARIANTS[subheadKey] : defaultSubhead);
  const ctaText = variant?.ctaText ?? defaultCtaText;

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

      {/* ─── HERO ─── Image background + CTA. CTA opens the Discovery Call
           modal (QualifierGate → optional scheduler iframe). No inline
           scheduler embed — the modal handles the booking surface. */}
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
              className="text-[clamp(36px,6vw,68px)] leading-[1.05] text-[#E8E6E1] mb-7"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: '0.5px' }}
            >
              {headlinePart1}{' '}
              {headlinePart2Italic && (
                <span className="ppc-hero-italic" style={{ fontStyle: 'italic', color: '#7A8B76' }}>
                  {headlinePart2Italic}
                </span>
              )}
            </h1>
            {/* CTA promoted to position #2 (right after H1) so paid traffic sees
                "click here" before they scan the supporting paragraph. Bumped
                to px-12 py-6 / text-[15px] for maximum visual weight. */}
            <button
              onClick={open}
              className="inline-flex items-center gap-3 px-12 py-6 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[15px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02] shadow-[0_14px_40px_rgba(93,109,89,0.6),0_0_0_2px_rgba(232,230,225,0.22)] hover:shadow-[0_18px_50px_rgba(93,109,89,0.75)] mb-8 ppc-hero-cta"
            >
              <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" />
              <span className="relative z-10">{ctaText}</span>
              <ArrowRight className="relative z-10 w-6 h-6" />
            </button>
            <p className="text-[15px] md:text-[17px] leading-[1.55] text-[#C8C4BC] max-w-xl mb-2">
              {subhead}
            </p>
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

      {/* ─── PROOF STRIP — animated count-up on scroll ─── */}
      <section className="bg-[#13342D] py-12">
        <div className="max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { to: 24,  prefix: '+', suffix: '%',     label: 'Avg revenue lift' },
            { to: 198, prefix: '',  suffix: '',      label: 'Listings managed' },
            { to: 320, prefix: '$', suffix: '',      label: '/mo flat per property' },
            { to: 30,  prefix: '',  suffix: ' min',  label: 'Free Discovery Call' },
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
           Hero → +24% strip → testimonials → schedule lets PPC visitors hit a
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

      {/* ─── MID-PAGE CTA ─── Replaces the prior inline calendar embed.
           Same conversion surface (CTA → Discovery Call modal) without the
           weight of a second iframe. */}
      <section className="bg-[#DDDAD3] py-12 md:py-16 text-center">
        <div className="max-w-2xl mx-auto px-6 md:px-12">
          <h2
            className="text-[clamp(26px,4vw,38px)] leading-[1.15] text-[#3F261F] mb-5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Ready to talk{' '}
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>strategy?</span>
          </h2>
          <p className="text-[16px] leading-[1.65] text-[#76574C] mb-8">
            30-minute Discovery Call. We pull your comp set, walk through where pacing is leaving money, and tell you whether RevFactor is the right fit. No pitch deck.
          </p>
          <button
            onClick={open}
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[13px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02] shadow-[0_10px_32px_rgba(93,109,89,0.45)] hover:shadow-[0_14px_40px_rgba(93,109,89,0.55)]"
          >
            <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" />
            <span className="relative z-10">{ctaText}</span>
            <ArrowRight className="relative z-10 w-5 h-5" />
          </button>
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
            <span style={{ fontStyle: 'italic', color: '#A8BBA3' }}>Discovery Call</span>{' '}
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
            <span style={{ fontStyle: 'italic' }}>Discovery Call</span>
          </h2>
          <p className="text-[16px] leading-[1.7] text-[#8F6E62] max-w-lg mx-auto mb-10">
            We'll review your market, current pricing, and where the revenue opportunity is.
            Even if you don't end up working with us.
          </p>
          <button
            onClick={open}
            className="inline-flex items-center gap-3 px-10 py-5 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[13px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02] shadow-[0_10px_32px_rgba(93,109,89,0.45)] hover:shadow-[0_14px_40px_rgba(93,109,89,0.55)]"
          >
            <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" />
            <span className="relative z-10">{ctaText}</span>
            <ArrowRight className="relative z-10 w-5 h-5" />
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

      {/* ─── Sticky mobile CTA ─── ClickFunnels-standard always-visible CTA
           so a visitor 8 sections deep is one tap from the calendar. Hidden
           when #schedule is in viewport — when the user is already at the
           calendar, the sticky bar would just overlap the booking form
           (especially on short iPhones where it covers the email field). */}
      <StickyMobileCTA onOpen={open} />
      {/* Spacer so the sticky bar never covers the final CTA on mobile.
          bg-onyx so when fully scrolled there's no bone-light gap between
          the footer and the sticky bar's translucent top edge. */}
      <div className="md:hidden h-20 bg-[#161910]" aria-hidden="true" />

      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
