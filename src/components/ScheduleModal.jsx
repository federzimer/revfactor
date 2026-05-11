import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';

/* ─── Schedule Modal ───
   Renders an iframe with the RevFactor scheduling embed.
   Auto-sizes panel height to the iframe's posted content height
   (scheduler app sends iframeHeight via postMessage as the user moves
   through date → time → form → confirmed). Falls back to 720px default
   with a max-h:92dvh safety cap. */
export default function ScheduleModal({ onClose }) {
  const isClosingRef = useRef(false);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  // Default to 900px so the modal opens large enough to fit the calendar
  // (~720-800px content) even before the scheduler posts an iframeHeight
  // message. Adjusts down via postMessage when the scheduler reports its
  // actual content height per step.
  const [iframeContentHeight, setIframeContentHeight] = useState(900);

  // Listen for postMessage from the scheduler iframe to auto-resize.
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      const h = e.data.iframeHeight ?? e.data.height
              ?? e.data.data?.height ?? e.data.data?.iframeHeight;
      const n = Number(h);
      if (Number.isFinite(n) && n > 400 && n < 1600) setIframeContentHeight(n);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // Entrance animation + scroll lock on mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const tl = gsap.timeline();
    tl.fromTo(
      overlayRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3, ease: 'power2.out' }
    );
    tl.fromTo(
      panelRef.current,
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' },
      '-=0.15'
    );

    if (panelRef.current) panelRef.current.focus();

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    window.posthog?.capture('schedule_modal_dismissed');

    if (!overlayRef.current || !panelRef.current) {
      onClose();
      return;
    }

    gsap.killTweensOf([overlayRef.current, panelRef.current]);
    const tl = gsap.timeline({ onComplete: () => onClose() });
    tl.to(panelRef.current, {
      opacity: 0,
      y: 20,
      scale: 0.97,
      duration: 0.25,
      ease: 'power2.in',
    });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '-=0.1');
  }, [onClose]);

  // Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // Visible iframe area = posted height minus the 48px we clip from top
  // (embed page wraps card in py-12 = 48px). Min 480 so first paint isn't
  // squished while iframe is loading.
  const visibleIframeHeight = Math.max(480, iframeContentHeight - 48);

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998]"
      style={{ opacity: 0 }}
    >
      {/* Hide visible scrollbar on the iframe wrapper while keeping scroll
          capability so visitors on short viewports can still reach the
          bottom of the calendar without seeing a competing scrollbar. */}
      <style>{`
        .sm-iframe-wrap { scrollbar-width: thin; scrollbar-color: #8F6E62 #DDDAD3; }
        .sm-iframe-wrap::-webkit-scrollbar { width: 6px; }
        .sm-iframe-wrap::-webkit-scrollbar-track { background: #DDDAD3; }
        .sm-iframe-wrap::-webkit-scrollbar-thumb { background: #8F6E62; border-radius: 3px; }
      `}</style>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" />

      <div
        className="relative flex items-center justify-center min-h-full p-4"
        onClick={handleOverlayClick}
      >
        {/* Panel — max-h:92dvh capped, height auto-grows to header + iframe.
            On short viewports panel hits the cap and the iframe wrapper
            scrolls inside. */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          tabIndex={-1}
          className="relative bg-white rounded-[20px] w-full max-w-[760px] max-h-[92dvh] overflow-hidden shadow-[0_16px_64px_rgba(22,25,16,0.2)] outline-none flex flex-col pt-4"
          style={{ opacity: 0 }}
        >
          {/* Visually-hidden accessibility title — preserves aria-labelledby
              while removing the visible "BOOK A CALL" / "Schedule your
              strategy call" header that duplicated the iframe's own header
              ("rf. DISCOVERY — Book a 30 minute discovery call"). Removal
              gives the calendar ~80px more vertical room. */}
          <h2 id="schedule-modal-title" className="sr-only">
            Schedule your strategy call
          </h2>

          {/* Floating close button — was inside the header before; now
              absolute-positioned in the top-right with a frosted background
              so it stays legible over the iframe's own header. */}
          <button
            onClick={handleClose}
            aria-label="Close schedule dialog"
            data-umami-event="CTA-2"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm text-[#76574C] hover:bg-[#C8C4BC]/60 shadow-[0_2px_8px_rgba(22,25,16,0.12)] transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {/* Iframe wrapper — fills the panel (capped by max-h:92dvh). The
              iframe-internal scroll handles long forms. marginTop:-48 clips
              the embed page's py-12 top padding so the iframe's header
              starts right at the top of the panel. */}
          <div
            className="sm-iframe-wrap min-h-0 px-4 pb-4 overflow-hidden"
            style={{
              // Wrap height matches the scheduler's posted content height
              // (Fede's scheduler posts iframeHeight = its rendered content
              // height per step). The iframe element itself extends 48px
              // taller via height:calc(100% + 48) which gives an internal
              // buffer that prevents iframe scrollbars from appearing for
              // 1-2px content-vs-viewport discrepancies. Capped at 92dvh-48
              // so short viewports scroll the iframe internally instead of
              // overflowing the panel.
              height: `min(${Math.max(480, iframeContentHeight)}px, calc(92dvh - 48px))`,
            }}
          >
            <iframe
              src="https://schedule.revfactor.io/embed"
              title="Schedule a strategy call with RevFactor"
              className="w-full rounded-[12px] border-0 block"
              style={{ marginTop: '-48px', height: 'calc(100% + 48px)' }}
              allow="payment"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
