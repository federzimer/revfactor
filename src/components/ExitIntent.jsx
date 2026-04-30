import { useEffect, useRef, useState } from 'react';
import { X, Calendar, ShieldCheck, ArrowRight } from 'lucide-react';

/* ─── Exit-Intent Strategy-Call Capture ───
   When the visitor's cursor leaves the top edge of the viewport (about
   to switch tabs / close window / hit URL bar), surface a "don't leave
   money on the table, book your free strategy call" prompt with the
   calendar embedded directly in the popup. One-shot per session.

   Triggers ONLY:
     - desktop (mouse leave from top)
     - mobile (alternate trigger: scrolled past 60% then idle 12s)
   Skips:
     - first 8s of pageview (avoid fires on bounce)
     - if the regular schedule modal is already open
     - if user already booked (window.localStorage 'revfactor.booked' set)
     - if user already saw + dismissed (sessionStorage flag) */

const STORAGE_KEY = 'revfactor.exit_intent_seen';

export default function ExitIntent() {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (localStorage.getItem('revfactor.booked')) return;

    const armedAt = Date.now();
    const ARM_DELAY = 8000;

    const trigger = (reason) => {
      if (Date.now() - armedAt < ARM_DELAY) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      // Skip if any modal is already open
      if (document.querySelector('[role="dialog"]')) return;
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      setOpen(true);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'exit_intent_shown', { reason });
      }
    };

    const onMouseLeave = (e) => {
      if (e.clientY <= 0) trigger('mouseleave');
    };

    let idleTimer;
    let scrollHit = false;
    const onScroll = () => {
      if (scrollHit) return;
      const pct = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (pct < 0.6) return;
      scrollHit = true;
      idleTimer = setTimeout(() => trigger('mobile_idle'), 12000);
    };

    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'exit_intent_dismissed');
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) close();
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6"
      style={{ animation: 'eiFadeIn 250ms cubic-bezier(0.25,0.1,0.25,1)' }}
      onClick={handleOverlayClick}
    >
      <style>{`
        @keyframes eiFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes eiSlideUp { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }
      `}</style>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        className="relative bg-[#DDDAD3] rounded-[20px] w-full max-w-[760px] h-[92dvh] max-h-[920px] shadow-[0_24px_80px_rgba(0,0,0,0.4)] outline-none flex flex-col overflow-hidden"
        style={{ animation: 'eiSlideUp 350ms cubic-bezier(0.25,0.1,0.25,1)' }}
      >
        {/* Header */}
        <div className="px-6 md:px-8 pt-6 md:pt-7 pb-4 bg-[#DDDAD3] flex items-start justify-between">
          <div className="flex-1 pr-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5D6D59]/15 mb-3">
              <Calendar className="w-3.5 h-3.5 text-[#5D6D59]" />
              <span className="font-bold uppercase text-[10px] tracking-[2px] text-[#5D6D59]">
                Before you go
              </span>
            </div>
            <h2
              id="exit-intent-title"
              className="text-[clamp(22px,3.4vw,30px)] leading-[1.15] text-[#3F261F]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              Don't leave revenue on the table.{' '}
              <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>Book your free strategy call.</span>
            </h2>
            <p className="mt-2 text-[15px] leading-[1.5] text-[#76574C] max-w-lg">
              30 minutes with a seasoned RevFactor pricing strategist. We'll spot the revenue gaps in your portfolio. No pitch.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[13px] text-[#5D6D59]">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Walk away with 3 specific recommendations, even if we never work together.</span>
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Close popup"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#76574C] hover:bg-[#C8C4BC]/40 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar iframe — fills remaining vertical space */}
        <div className="flex-1 px-3 pb-3 overflow-hidden">
          <iframe
            src="https://schedule.revfactor.io/embed"
            title="Schedule a strategy call with RevFactor"
            className="w-full h-full border-0 block rounded-[14px]"
            style={{ minHeight: '500px' }}
            allow="payment"
          />
        </div>
      </div>
    </div>
  );
}
