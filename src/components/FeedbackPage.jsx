import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeedbackPage() {
  const pageRef = useRef(null);

  // Load Trustpilot widget script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.async = true;
    script.onload = () => {
      if (window.Trustpilot) {
        const widgetEl = document.querySelector('.trustpilot-widget');
        if (widgetEl) {
          window.Trustpilot.loadFromElement(widgetEl, true);
        }
      }
    };
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  // GSAP entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.feedback-animate',
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
          className="text-[22px] font-normal lowercase tracking-[0.5px] px-3 text-[#3F261F] transition-colors duration-[350ms]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          revfactor
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
      <main className="flex-1 max-w-3xl mx-auto px-6 md:px-12 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="feedback-animate opacity-0 font-bold uppercase text-[9px] tracking-[3px] text-[#8F6E62] mb-5">
            YOUR VOICE MATTERS
          </p>
          <h1
            className="feedback-animate opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#3F261F] lowercase mb-5"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            we'd love your{' '}
            <span style={{ fontStyle: 'italic', color: '#7A8B76' }}>feedback</span>
          </h1>
          <p className="feedback-animate opacity-0 text-[15px] leading-[1.7] text-[#76574C] max-w-xl mx-auto">
            Thank you for choosing RevFactor.io to manage your short-term rental revenue.
            Your feedback helps us improve and helps other property owners find us.
          </p>
        </div>

        {/* Trustpilot Widget Card */}
        <div
          className="feedback-animate opacity-0 bg-[#E8E6E1] rounded-[20px] p-8 md:p-10 mb-8"
          style={{ boxShadow: '0 4px 24px rgba(22,25,16,0.06)' }}
        >
          {/* Stars decoration */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-[#5D6D59] fill-[#5D6D59]" />
            ))}
          </div>

          {/* Trustpilot Widget */}
          <div
            className="trustpilot-widget"
            data-locale="en-US"
            data-template-id="56278e9abfbbba0bdcd568bc"
            data-businessunit-id="692572bbcb3f942cc2d53083"
            data-style-height="52px"
            data-style-width="100%"
            data-token="ade1817e-58fb-4b35-aaaa-fa1e20f44fb3"
          >
            <a
              href="https://www.trustpilot.com/review/revfactor.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            >
              <span
                className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              />
              <span className="relative z-10">review us on trustpilot</span>
            </a>
          </div>
        </div>

        {/* Bottom note */}
        <p className="feedback-animate opacity-0 text-center text-[13px] text-[#8F6E62]">
          Your honest review helps us grow and continue providing excellent service.
        </p>
      </main>

      {/* Footer */}
      <footer className="bg-[#161910] py-8">
        <div className="max-w-3xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-3">
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
