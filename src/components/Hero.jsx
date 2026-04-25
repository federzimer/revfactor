import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import ScheduleModal from './ScheduleModal';

export default function Hero() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const sectionRef = useRef(null);
  const overlineRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const statsRef = useRef(null);
  const ctaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(overlineRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
        .fromTo(line1Ref.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.6')
        .fromTo(line2Ref.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.6')
        .fromTo(subtitleRef.current, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(statsRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3');
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { label: 'PROPERTIES MANAGED', value: '100+' },
    // { label: 'AVG REVENUE LIFT', value: '+22%' },
    { label: 'MARKETS', value: 'US-WIDE' },
  ];

  return (
    <>
      <section
        ref={sectionRef}
        className="relative h-[100dvh] min-h-[700px] flex items-end overflow-hidden"
      >
        {/* Background Image — <img> instead of CSS backgroundImage so it has alt text + descriptive filename for image SEO */}
        <img
          src="/images/str-revenue-management-hero.jpg"
          alt="Mountain cabin short-term rental at dusk — RevFactor delivers expert dynamic pricing strategy for STR hosts"
          fetchpriority="high"
          decoding="async"
          width="2400"
          height="1600"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#161910] via-[#161910]/80 to-[#13342D]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161910] via-transparent to-transparent opacity-60" />

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-16 md:pb-24">
          <div className="max-w-2xl">
            {/* Overline */}
            <p
              ref={overlineRef}
              className="font-bold uppercase text-[9px] tracking-[3px] text-[#7A8B76] mb-6 opacity-0"
            >
              REVENUE MANAGEMENT FOR SHORT-TERM RENTALS
            </p>

            {/* Heading */}
            <h1 className="mb-6">
              <span
                ref={line1Ref}
                className="block text-[clamp(40px,7vw,64px)] leading-[1.05] text-[#E8E6E1] opacity-0"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: '0.5px' }}
              >
                Every night has
              </span>
              <span
                ref={line2Ref}
                className="block text-[clamp(48px,9vw,80px)] leading-[1.0] text-[#7A8B76] opacity-0"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic', letterSpacing: '0.5px' }}
              >
                its price.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              ref={subtitleRef}
              className="text-[15px] leading-[1.7] text-[#C8C4BC] max-w-[520px] mb-8 opacity-0"
            >
              We combine dynamic pricing tools with expert strategy to maximize
              your rental income — while you stay in control.
            </p>

            {/* Stats Bar */}
            <div
              ref={statsRef}
              className="flex flex-wrap gap-6 md:gap-10 mb-8 opacity-0"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span
                    className="text-[11px] tracking-[2px] text-[#7A8B76] font-bold uppercase"
                  >
                    {stat.label}
                  </span>
                  <span
                    className="text-[18px] text-[#E8E6E1] font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div ref={ctaRef} className="opacity-0">
              <button
                onClick={() => setScheduleOpen(true)}
                data-umami-event="CTA-2"
                className="inline-flex items-center gap-3 px-8 py-4 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[11px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(93,109,89,0.35)]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              >
                <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
                <span className="relative z-10">schedule a strategy call</span>
                <ArrowRight className="relative z-10 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Schedule Modal — conditionally mounted */}
      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
