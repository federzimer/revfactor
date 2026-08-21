import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { GHL_BOOKING, withTrackingParams, loadGhlEmbedScript } from '../data/ghl.ts';

/* ─── Exit-Intent Strategy-Call Capture ───
   When the visitor's cursor leaves the top edge of the viewport, surface
   a 2-line headline plus the calendar embedded directly. One-shot per
   session.

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
      if (document.querySelector('[role="dialog"]')) return;
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      setOpen(true);
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'exit_intent_shown', { reason });
      }
      window.posthog?.capture('exit_intent_shown', { trigger_reason: reason });
      window.rfTrack?.('exit-intent', { action: 'shown', reason, page: location.pathname });
    };

    // Track cursor Y so we can distinguish "user leaving via the top of the
    // viewport" from "user moving into the calendar iframe". Iframes fire a
    // document.mouseleave even when cursor is entering them, so checking
    // clientY <= 0 alone produces false positives every time the user
    // interacts with the calendar. Only fire if the cursor was already
    // near the top of the viewport in the moment before leaving.
    let lastMoveY = Infinity;
    const onMouseMove = (e) => { lastMoveY = e.clientY; };
    const onMouseLeave = (e) => {
      if (e.clientY > 0) return;
      if (lastMoveY > 50) return;
      trigger('mouseleave');
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

    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  // Close on Escape + lock body scroll while open. Also load GHL's
  // form_embed.js (iframe auto-resize) only once the popup actually opens.
  // keeps PPC pages iframe/script-free on first paint.
  useEffect(() => {
    if (!open) return;
    loadGhlEmbedScript();
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
    window.posthog?.capture('exit_intent_dismissed');
    window.rfTrack?.('exit-intent', { action: 'dismissed' });
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
        /* Style the iframe-wrapper scrollbar to match the rest of the
           site (6px bone track + walnut-light thumb, see src/index.css).
           Keeps scroll capability for short-viewport users; tracks the
           same look as the global page scrollbar. */
        .ei-iframe-wrap { scrollbar-width: thin; scrollbar-color: #8F6E62 #DDDAD3; }
        .ei-iframe-wrap::-webkit-scrollbar { width: 6px; }
        .ei-iframe-wrap::-webkit-scrollbar-track { background: #DDDAD3; }
        .ei-iframe-wrap::-webkit-scrollbar-thumb { background: #8F6E62; border-radius: 3px; }
      `}</style>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px]" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-intent-title"
        className="relative bg-[#DDDAD3] rounded-[20px] w-full max-w-[760px] max-h-[92dvh] shadow-[0_24px_80px_rgba(0,0,0,0.4)] outline-none flex flex-col overflow-hidden"
        style={{ animation: 'eiSlideUp 350ms cubic-bezier(0.25,0.1,0.25,1)' }}
      >
        {/* Header: just the 2-line headline, forced break.
            Line 1: "Don't leave revenue on the table."
            Line 2: italic "Book your discovery call." */}
        <div className="px-6 md:px-8 pt-6 md:pt-7 pb-4 flex items-start justify-between">
          <h2
            id="exit-intent-title"
            className="text-[clamp(22px,3.4vw,30px)] leading-[1.2] text-[#3F261F] flex-1 pr-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Don't leave revenue on the table.
            <br />
            <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>Book your discovery call.</span>
          </h2>
          <button
            onClick={close}
            aria-label="Close popup"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[#76574C] hover:bg-[#C8C4BC]/40 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GHL booking iframe, auto-resized by form_embed.js. The wrapper
            scrolls if the widget outgrows the viewport-capped max height;
            the visible scrollbar is styled via .ei-iframe-wrap CSS. */}
        <div
          className="ei-iframe-wrap min-h-0 px-3 pb-3"
          style={{ maxHeight: 'min(720px, calc(92dvh - 120px))', overflowY: 'auto' }}
        >
          <iframe
            src={withTrackingParams(GHL_BOOKING)}
            id="ghl-booking-exit"
            title="Schedule a Discovery Call with RevFactor"
            className="w-full border-0 block rounded-[14px]"
            scrolling="auto"
            style={{ minHeight: 480 }}
            allow="payment"
          />
        </div>
      </div>
    </div>
  );
}
