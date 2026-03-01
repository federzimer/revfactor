import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
import ScheduleModal from './ScheduleModal';

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-animate',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <>
    <section ref={sectionRef} id="contact" className="bg-[#3F261F] py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
        <p className="cta-animate opacity-0 font-bold uppercase text-[9px] tracking-[3px] text-[#8F6E62] mb-5">
          READY TO START?
        </p>
        <h2
          className="cta-animate opacity-0 text-[clamp(32px,5vw,44px)] leading-[1.15] text-[#E8E6E1] lowercase mb-4"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
        >
          ready to maximize{' '}
          <span style={{ fontStyle: 'italic' }}>your revenue?</span>
        </h2>
        <p className="cta-animate opacity-0 text-[15px] leading-[1.7] text-[#8F6E62] max-w-lg mx-auto mb-10">
          Book a free strategy call. We'll analyze your market, review your current
          pricing, and show you exactly where the revenue opportunity lies.
        </p>
        <div className="cta-animate opacity-0">
          <button
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[11px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02] hover:shadow-[0_8px_24px_rgba(93,109,89,0.35)]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <span className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
            <span className="relative z-10">schedule a strategy call</span>
            <ArrowRight className="relative z-10 w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    {/* Schedule Modal — conditionally mounted */}
    {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
