import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Play, Calendar, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.review-animate',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.2,
        }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[#DDDAD3] flex flex-col">
      {/* Minimal Nav */}
      <nav
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2.5 rounded-full flex items-center gap-1 bg-[#DDDAD3]/60 backdrop-blur-[12px] border border-[#C8C4BC]/40 shadow-[0_4px_24px_rgba(22,25,16,0.08)]"
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <Link
          to="/"
          className="text-[22px] font-normal tracking-[0.5px] px-3 text-[#3F261F] transition-colors duration-[350ms]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          RevFactor
        </Link>
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-2 ml-2 px-5 py-2 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        >
          <span
            className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          />
          <ArrowLeft className="relative z-10 w-3 h-3" />
          <span className="relative z-10">back to home</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 md:px-12 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="review-animate opacity-0 font-bold uppercase text-[9px] tracking-[3px] text-[#8F6E62] mb-5">
            DISCOVER REVFACTOR
          </p>
          <h1
            className="review-animate opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#3F261F] mb-5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            See how we can transform{' '}
            <span style={{ fontStyle: 'italic', color: '#7A8B76' }}>your revenue</span>
          </h1>
          <p className="review-animate opacity-0 text-[15px] leading-[1.7] text-[#76574C] max-w-2xl mx-auto">
            Watch our detailed service overview and schedule a discovery call to learn
            how we can help maximize your short-term rental profits.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Video Card */}
          <div
            className="review-animate opacity-0 bg-[#E8E6E1] rounded-[20px] p-6 md:p-8"
            style={{ boxShadow: '0 4px 24px rgba(22,25,16,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#13342D] flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-[#E8E6E1]" />
              </div>
              <h2
                className="text-[clamp(22px,3vw,28px)] text-[#3F261F]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
              >
                Service overview
              </h2>
            </div>
            <div className="aspect-video w-full rounded-[12px] overflow-hidden bg-[#C8C4BC]">
              <iframe
                src="https://www.loom.com/embed/565f5074ff2a4631a496792bd96df24b"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
                title="RevFactor.io Service Overview"
              />
            </div>
            <p className="text-[14px] leading-[1.7] text-[#76574C] mt-5">
              Watch this comprehensive overview to understand our revenue management
              approach, data-driven strategies, and how we've helped other STR owners
              increase their profits.
            </p>
          </div>

          {/* Scheduling Card */}
          <div
            className="review-animate opacity-0 bg-[#E8E6E1] rounded-[20px] p-6 md:p-8"
            style={{ boxShadow: '0 4px 24px rgba(22,25,16,0.06)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-[#5D6D59] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-[#E8E6E1]" />
              </div>
              <h2
                className="text-[clamp(22px,3vw,28px)] text-[#3F261F]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
              >
                Schedule your discovery call
              </h2>
            </div>

            <div className="text-center mb-6">
              <a
                href="https://schedule.revfactor.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-7 py-3.5 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              >
                <span
                  className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
                />
                <Calendar className="relative z-10 w-3.5 h-3.5" />
                <span className="relative z-10">schedule discovery call</span>
              </a>
              <p className="text-[12px] text-[#8F6E62] mt-3 tracking-wide">
                30-minute call &middot; No obligation &middot; Free consultation
              </p>
            </div>

            {/* Embedded Calendly */}
            <div className="w-full rounded-[12px] overflow-hidden border border-[#C8C4BC]/50">
              <iframe
                src="https://schedule.revfactor.io/embed"
                width="100%"
                height="700"
                title="Schedule Discovery Call"
                frameBorder="0"
                className="min-h-[700px]"
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="review-animate opacity-0 text-center mt-20">
          <div
            className="bg-[#E8E6E1] rounded-[20px] p-10 md:p-14 max-w-2xl mx-auto"
            style={{ boxShadow: '0 4px 24px rgba(22,25,16,0.06)' }}
          >
            <p className="font-bold uppercase text-[9px] tracking-[3px] text-[#8F6E62] mb-4">
              TAKE THE NEXT STEP
            </p>
            <h2
              className="text-[clamp(26px,4vw,36px)] leading-[1.15] text-[#3F261F] mb-4"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              Ready to maximize your{' '}
              <span style={{ fontStyle: 'italic', color: '#7A8B76' }}>STR revenue?</span>
            </h2>
            <p className="text-[15px] leading-[1.7] text-[#76574C] max-w-lg mx-auto mb-8">
              Join the growing number of successful STR owners who trust RevFactor
              to optimize their properties and increase their profits.
            </p>
            <a
              href="https://schedule.revfactor.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[11px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            >
              <span
                className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              />
              <span className="relative z-10">get started today</span>
              <ArrowRight className="relative z-10 w-4 h-4" />
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#161910] py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#8F6E62]/50">
            &copy; 2025 RevFactor. Past performance is not indicative of future results.
          </p>
          <p className="text-[11px] text-[#8F6E62]/30">
            Precision revenue craft.
          </p>
        </div>
      </footer>
    </div>
  );
}
