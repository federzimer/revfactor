import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X, ShieldCheck } from 'lucide-react';
import ScheduleModal from './ScheduleModal';

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
    subhead: 'Most consultants run an audit, hand you a deck, and disappear. We don’t. A seasoned pricing strategist stays on every account — monthly calls, weekly comp tracking, calendar optimization, plus 24/7 dashboard messaging. Documented +18% lift. Flat $320/mo.',
    ctaText: 'Talk to a strategist',
  },
  // Tool Intent campaign — searcher is shopping a pricing tool, reframe the category
  tool: {
    eyebrow: 'BEYOND PRICING TOOLS',
    headlinePart1: 'Pricing tools set numbers.',
    headlinePart2Italic: 'We set strategy.',
    subhead: 'Your pricing tool prices tonight. We build the strategy that makes it work — and pull back the 18% your algorithm leaves on the table. Works alongside any tool. Direct access to a seasoned strategist + 24/7 dashboard messaging. Flat $320/mo.',
    ctaText: 'Talk to a strategist',
  },
  // Conquest campaign — searcher is on PriceLabs / Wheelhouse / Beyond
  conquest: {
    eyebrow: 'STRATEGY YOUR TOOL CAN’T SHIP',
    headlinePart1: 'Already on PriceLabs?',
    headlinePart2Italic: 'You’re probably 18% short.',
    subhead: 'Algorithms set the numbers. They can’t set the strategy that makes the numbers actually work — comp positioning, length-of-stay rules, channel mix, listing audit. A seasoned pricing strategist does. Documented +18% lift across our portfolio. Plus 24/7 dashboard messaging.',
    ctaText: 'Talk to a strategist',
  },
};

function readMessageVariant() {
  if (typeof window === 'undefined') return null;
  const m = new URLSearchParams(window.location.search).get('msg');
  return m && MESSAGE_VARIANTS[m] ? MESSAGE_VARIANTS[m] : null;
}

/* ─── PPC Landing Page Component ───
   Single-purpose conversion-optimized page for paid search traffic.
   Brand-matched (bone/moss/cedar/walnut/tobacco design tokens).
   Single CTA: opens ScheduleModal everywhere.
   Sections: Hero → +18% claim → Tools-vs-Strategy table → Testimonials →
             How it works → FAQ → Final CTA. */

const TESTIMONIALS = [
  {
    name: "Kate Henry",
    initials: "KH",
    role: "STR Host · Year-over-year",
    metric: "+75%",
    quote: "Federico's strategic approach unlocked revenue I didn't know my property had. Up 75% year-over-year.",
  },
  {
    name: "Kassidy & Erin Warren",
    initials: "KW",
    role: "STR Hosts · Sustained growth",
    metric: "+20%",
    quote: "Steady, sustainable growth. They don't just set prices — they build a strategy that adapts to the market.",
  },
  {
    name: "Sarah",
    initials: "S",
    role: "Multi-property STR Host",
    metric: "5★",
    quote: "In my humble opinion, there is no better revenue manager out there. Every property has seen significant growth.",
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
    body: "We connect to your PMS, audit your listings, and benchmark your performance against the comp set. You see the revenue gap on day one — and get RevFactor dashboard access with 24/7 messaging into your strategist.",
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
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const open = () => setScheduleOpen(true);
  const calRef = useRef(null);
  const [calHeight, setCalHeight] = useState(640);

  // DTR — read ?msg= URL param after mount and override hero copy if it
  // matches a known variant. Server-rendered HTML uses the .astro page's
  // default props; the swap happens on client hydration. Page is noindex,
  // so SEO impact of the brief content swap is irrelevant.
  const [variant, setVariant] = useState(null);
  useEffect(() => { setVariant(readMessageVariant()); }, []);
  const eyebrow = variant?.eyebrow ?? defaultEyebrow;
  const headlinePart1 = variant?.headlinePart1 ?? defaultHeadlinePart1;
  const headlinePart2Italic = variant?.headlinePart2Italic ?? defaultHeadlinePart2Italic;
  const subhead = variant?.subhead ?? defaultSubhead;
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
      {/* ─── HERO with image background (single-column copy + CTA) ─── */}
      <section className="relative min-h-[78vh] md:min-h-[88vh] flex items-end overflow-hidden">
        <picture>
          <source
            type="image/webp"
            srcSet="/images/cabin-hero-1200.webp 1200w, /images/cabin-hero-1920.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/images/cabin-hero-fallback.webp"
            alt="Alpine cabin at golden hour — short-term rental property managed by RevFactor"
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
                <span style={{ fontStyle: 'italic', color: '#7A8B76' }}>
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
              <p className="text-[15px] leading-[1.55] text-[#C8C4BC]">
                <span className="font-bold text-[#E8E6E1]">Our promise:</span>{' '}
                You walk away with 3 specific revenue recommendations for your property — even if we never work together.
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
                className="w-[68px] h-[68px] rounded-full object-cover border-2 border-[#7A8B76] flex-shrink-0 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
              />
              <div className="leading-tight">
                <p className="text-[16px] text-[#E8E6E1] font-medium mb-0.5">Federico Zimerman</p>
                <p className="text-[11px] uppercase tracking-[1.5px] text-[#7A8B76] font-bold">Founder · STR Revenue Strategist</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── +18% PROOF STRIP ─── */}
      <section className="bg-[#13342D] py-10">
        <div className="max-w-5xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div
              className="text-[clamp(36px,5vw,52px)] text-[#E8E6E1] leading-none mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
            >
              +18%
            </div>
            <div className="font-bold uppercase text-[9px] tracking-[2px] text-[#7A8B76]">
              Avg revenue lift vs. comp set
            </div>
          </div>
          <div>
            <div
              className="text-[clamp(36px,5vw,52px)] text-[#E8E6E1] leading-none mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
            >
              +75%
            </div>
            <div className="font-bold uppercase text-[9px] tracking-[2px] text-[#7A8B76]">
              Top performer (Kate Henry)
            </div>
          </div>
          <div>
            <div
              className="text-[clamp(36px,5vw,52px)] text-[#E8E6E1] leading-none mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
            >
              $320
            </div>
            <div className="font-bold uppercase text-[9px] tracking-[2px] text-[#7A8B76]">
              /mo flat per property
            </div>
          </div>
          <div>
            <div
              className="text-[clamp(36px,5vw,52px)] text-[#E8E6E1] leading-none mb-2"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
            >
              30 min
            </div>
            <div className="font-bold uppercase text-[9px] tracking-[2px] text-[#7A8B76]">
              Free strategy call
            </div>
          </div>
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
              <div
                key={i}
                className="bg-[#E8E6E1] rounded-[20px] p-7 border border-[#C8C4BC] flex flex-col"
              >
                <div className="flex items-center justify-between mb-5">
                  {/* Initial avatar — branded circle stand-in until real client photos are sourced */}
                  <div
                    className="w-12 h-12 rounded-full bg-[#5D6D59] text-[#E8E6E1] flex items-center justify-center text-[14px] font-bold tracking-wider flex-shrink-0"
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
                  className="text-[15px] leading-[1.6] text-[#3F261F] mb-5 italic flex-grow"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
                >
                  "{t.quote}"
                </p>
                <div className="border-t border-[#C8C4BC] pt-4">
                  <p className="text-[14px] font-bold text-[#3F261F] mb-1">
                    {t.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-[1.5px] text-[#76574C] font-bold">
                    {t.role}
                  </p>
                </div>
              </div>
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
          <p className="text-[15px] leading-[1.55] text-[#76574C] max-w-lg mx-auto mb-6 text-center">
            30-minute call with a seasoned RevFactor pricing strategist. We'll review your portfolio, comp set, and where the revenue opportunity is.
          </p>
          <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_16px_64px_rgba(22,25,16,0.12)] border border-[#C8C4BC]">
            <iframe
              ref={calRef}
              src="https://schedule.revfactor.io/embed"
              title="Schedule a strategy call with RevFactor"
              className="w-full border-0 block"
              style={{ height: `${calHeight}px`, minHeight: '560px', overflow: 'hidden' }}
              scrolling="no"
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
                className={`grid grid-cols-3 px-6 py-4 text-[15px] ${i % 2 === 0 ? 'bg-[#DDDAD3]' : 'bg-[#E8E6E1]'}`}
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
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#7A8B76] mb-4 text-center">
            HOW IT WORKS
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#E8E6E1] mb-14 text-center max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            From{' '}
            <span style={{ fontStyle: 'italic', color: '#7A8B76' }}>strategy call</span>{' '}
            to monthly partner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROCESS_STEPS.map((step) => (
              <div key={step.n}>
                <div
                  className="text-[14px] text-[#7A8B76] mb-3"
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
                <p className="text-[15px] leading-[1.6] text-[#8F6E62]">
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
                <p className="mt-4 text-[15px] leading-[1.7] text-[#76574C]">
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
          <p className="text-[15px] leading-[1.7] text-[#8F6E62] max-w-lg mx-auto mb-10">
            We'll review your market, current pricing, and where the revenue opportunity is —
            even if you don't end up working with us.
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
          <span>© {new Date().getFullYear()} RevFactor — Revenue strategy for STR hosts.</span>
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
          <span>Talk to a strategist — Free 30 min</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {/* Spacer so the sticky bar never covers the final CTA on mobile */}
      <div className="md:hidden h-20" aria-hidden="true" />

      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
