import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';
import QualifierGate from './QualifierGate.jsx';
import { GHL_BOOKING, withTrackingParams, loadGhlEmbedScript } from '../data/ghl.ts';

/* ─── Schedule Modal ───
   Two-stage modal:
     1. QualifierGate: 2-question pre-booking qualifier.
        Q1 No / Q2 PM paths embed a GHL form (leads land in the CRM).
        Q1 Yes + Q2 Self-host → renders the GHL booking widget below.
     2. GHL booking iframe, auto-resized by form_embed.js (iframe-resizer),
        max-h:92dvh safety cap on the wrapper. */
export default function ScheduleModal({ onClose }) {
  const isClosingRef = useRef(false);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  // Gate stays mounted until visitor self-identifies as a self-host.
  // null = still qualifying; { hasProperty: true, isPM: false } = unlocked.
  const [qualified, setQualified] = useState(null);

  // Forward UTMs + Google Ads ValueTrack params + the DTR ?msg= variant key
  // to the booking widget so the GHL booking record carries campaign
  // metadata. Conversions still attribute either way (BaseLayout's
  // postMessage listener fires the $1500 conversion from revfactor.io
  // origin, which naturally carries gclid), but the CRM row would lose its
  // source attribution without this.
  const scheduleUrl = withTrackingParams(GHL_BOOKING);

  // form_embed.js resizes the GHL iframe from the parent side.
  useEffect(() => {
    if (qualified) loadGhlEmbedScript();
  }, [qualified]);

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
    // stage tells qualifier abandonment apart from closing over the calendar
    window.rfTrack?.('schedule-modal-close', { stage: qualified ? 'calendar' : 'qualifier' });

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
  }, [onClose, qualified]);

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
        {/* Panel: max-h:92dvh capped, height auto-grows to header + iframe.
            On short viewports panel hits the cap and the iframe wrapper
            scrolls inside. */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          tabIndex={-1}
          className={`relative bg-white rounded-[20px] w-full ${qualified ? 'max-w-[760px]' : 'max-w-[520px]'} max-h-[92dvh] overflow-hidden shadow-[0_16px_64px_rgba(22,25,16,0.2)] outline-none flex flex-col pt-4`}
          style={{ opacity: 0 }}
        >
          <h2 id="schedule-modal-title" className="sr-only">
            {qualified ? 'Book your Discovery Call' : 'Discovery qualifier'}
          </h2>

          {/* Floating close button */}
          <button
            onClick={handleClose}
            aria-label="Close schedule dialog"
            className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-sm text-[#76574C] hover:bg-[#C8C4BC]/60 shadow-[0_2px_8px_rgba(22,25,16,0.12)] transition-colors duration-200 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {qualified ? (
            // Self-host path → GHL booking widget. form_embed.js sets the
            // iframe height to the widget's content; the wrapper scrolls
            // only if the widget outgrows the viewport.
            <div
              className="sm-iframe-wrap min-h-0 px-4 pb-4"
              style={{
                maxHeight: 'calc(92dvh - 48px)',
                minHeight: 480,
                overflowY: 'auto',
              }}
            >
              <iframe
                src={scheduleUrl}
                id="ghl-booking-modal"
                title="Book a Discovery Call with RevFactor"
                className="w-full rounded-[12px] border-0 block"
                style={{ minHeight: 480 }}
                scrolling="auto"
                allow="payment"
              />
            </div>
          ) : (
            // Pre-booking qualifier: Q1 then Q2 (or GHL form on no/PM paths)
            <QualifierGate
              onQualified={(data) => setQualified(data)}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
