import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import ScheduleModal from './ScheduleModal';

/* ─── PPC Landing Page Component ───
   Single-purpose conversion-optimized page for paid search traffic.
   Brand-matched (bone/moss/cedar/walnut/tobacco design tokens).
   Single CTA: opens ScheduleModal everywhere.
   Sections: Hero → +18% claim → Tools-vs-Strategy table → Testimonials →
             How it works → FAQ → Final CTA. */

const TESTIMONIALS = [
  {
    name: "Kate Henry",
    metric: "+75%",
    quote: "Federico's strategic approach unlocked revenue I didn't know my property had. Up 75% year-over-year.",
  },
  {
    name: "Kassidy & Erin Warren",
    metric: "+20%",
    quote: "Steady, sustainable growth. They don't just set prices — they build a strategy that adapts to the market.",
  },
  {
    name: "Sarah",
    metric: "5★",
    quote: "In my humble opinion, there is no better revenue manager out there. Every property has seen significant growth.",
  },
];

const PROCESS_STEPS = [
  {
    n: "01",
    title: "Strategy Call",
    body: "30 minutes with Federico or Emily. We review your portfolio, market, and current pricing. You leave with concrete revenue recommendations whether you work with us or not.",
  },
  {
    n: "02",
    title: "Onboarding & Audit",
    body: "We connect to your PMS, audit your listings, and benchmark your performance against the comp set. You see the revenue gap on day one.",
  },
  {
    n: "03",
    title: "Ongoing Strategy",
    body: "Monthly strategy calls with Federico or Emily, dynamic pricing calibration, calendar optimization, and comp tracking. Flat $320/mo per property.",
  },
];

export default function PPCLanding({
  eyebrow,
  headlinePart1,
  headlinePart2Italic,
  subhead,
  ctaText = "Schedule a free strategy call",
  comparisonRows,
  faqs,
  finalCtaPretext = "Ready to talk strategy?",
}) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const open = () => setScheduleOpen(true);
  const calRef = useRef(null);
  const [calHeight, setCalHeight] = useState(640);

  // Cal.com posts iframe dimensions via postMessage. Match permissively — any
  // event whose data carries a sane `iframeHeight`/`height` number wins.
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
      {/* ─── HERO with image background + inline calendar (right column on desktop) ─── */}
      <section id="schedule" className="relative overflow-hidden">
        <picture>
          <source
            type="image/webp"
            srcSet="/images/dynamic-pricing-strategy-mountain-cabin-1200.webp 1200w, /images/dynamic-pricing-strategy-mountain-cabin-1920.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/images/dynamic-pricing-strategy-mountain-cabin-fallback.jpg"
            alt="Short-term rental at dusk — RevFactor revenue strategy for STR hosts"
            fetchpriority="high"
            decoding="async"
            width="1920"
            height="1280"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#161910] via-[#161910]/85 to-[#13342D]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161910] via-transparent to-transparent opacity-60" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pt-28 pb-12 md:pt-36 md:pb-20">
          <div className="grid md:grid-cols-[1fr_minmax(380px,440px)] gap-10 md:gap-12 items-start">
            {/* LEFT — copy */}
            <div className="md:pt-6">
              <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#7A8B76] mb-6">
                {eyebrow}
              </p>
              <h1
                className="text-[clamp(34px,5vw,56px)] leading-[1.05] text-[#E8E6E1] mb-5"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: '0.5px' }}
              >
                {headlinePart1}{' '}
                {headlinePart2Italic && (
                  <span style={{ fontStyle: 'italic', color: '#7A8B76' }}>
                    {headlinePart2Italic}
                  </span>
                )}
              </h1>
              <p className="text-[15px] leading-[1.65] text-[#C8C4BC] max-w-xl mb-6">
                {subhead}
              </p>
              <ul className="space-y-2 mb-2">
                {[
                  '+18% revenue lift vs. comp set',
                  'Direct access to Federico or Emily',
                  '$320/mo flat — no revenue-share gotchas',
                  '30 min · no obligation · free',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[14px] text-[#C8C4BC]">
                    <Check className="w-4 h-4 text-[#7A8B76] flex-shrink-0 mt-[3px]" strokeWidth={3} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* RIGHT — inline Cal.com embed */}
            <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_16px_64px_rgba(0,0,0,0.35)] border border-white/10">
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
        </div>
      </section>

      {/* ─── +18% PROOF STRIP ─── */}
      <section className="bg-[#13342D] py-14">
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

      {/* ─── COMPARISON TABLE ─── */}
      <section id="difference" className="bg-[#E8E6E1] py-20 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-4 text-center">
            THE DIFFERENCE
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#3F261F] mb-12 text-center max-w-2xl mx-auto"
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
                className={`grid grid-cols-3 px-6 py-5 text-[14px] ${i % 2 === 0 ? 'bg-[#DDDAD3]' : 'bg-[#E8E6E1]'}`}
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

      {/* ─── TESTIMONIALS ─── */}
      <section id="results" className="bg-[#DDDAD3] py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-4 text-center">
            DOCUMENTED RESULTS
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#3F261F] mb-12 text-center max-w-2xl mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Hosts seeing{' '}
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>real revenue lift</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-[#E8E6E1] rounded-[20px] p-7 border border-[#C8C4BC]"
              >
                <div
                  className="text-[28px] text-[#5D6D59] mb-4"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}
                >
                  {t.metric}
                </div>
                <p
                  className="text-[15px] leading-[1.6] text-[#3F261F] mb-5 italic"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
                >
                  "{t.quote}"
                </p>
                <p className="font-bold uppercase text-[10px] tracking-[2px] text-[#76574C]">
                  — {t.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="process" className="bg-[#161910] py-20 md:py-24">
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
                <p className="text-[14px] leading-[1.6] text-[#8F6E62]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="bg-[#E8E6E1] py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#76574C] mb-4 text-center">
            QUESTIONS
          </p>
          <h2
            className="text-[clamp(28px,4.5vw,42px)] leading-[1.15] text-[#3F261F] mb-12 text-center"
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
                <p className="mt-4 text-[14px] leading-[1.7] text-[#76574C]">
                  {q.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="bg-[#3F261F] py-20 md:py-24">
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

      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
