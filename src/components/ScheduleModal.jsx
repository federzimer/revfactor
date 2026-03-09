import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';

/* ─── Schedule Modal ───
   Renders an iframe with the RevFactor scheduling embed.
   Mounted/unmounted by parent via conditional rendering.
   Handles its own exit animation before calling onClose. */
export default function ScheduleModal({ onClose }) {
  const isClosingRef = useRef(false);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

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

  // Close with exit animation, then unmount via parent
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

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

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9998]"
      style={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[4px]" />

      {/* Centering wrapper */}
      <div
        className="relative flex items-center justify-center min-h-full p-4"
        onClick={handleOverlayClick}
      >
        {/* Panel */}
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-modal-title"
          tabIndex={-1}
          className="relative bg-white rounded-[20px] w-full max-w-[700px] max-h-[90dvh] overflow-hidden shadow-[0_16px_64px_rgba(22,25,16,0.2)] outline-none flex flex-col"
          style={{ opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 pt-6 pb-4">
            <div>
              <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-2">
                BOOK A CALL
              </span>
              <h2
                id="schedule-modal-title"
                className="text-[clamp(24px,3.5vw,32px)] leading-[1.1] text-[#3F261F]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
                data-umami-event="CTA-2"
              >
                Schedule your strategy call
              </h2>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close schedule dialog"
              className="w-8 h-8 flex items-center justify-center rounded-full text-[#76574C] hover:bg-[#C8C4BC]/20 transition-colors duration-200 flex-shrink-0"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Iframe */}
          <div className="flex-1 min-h-[500px] px-4 pb-4">
            <iframe
              src="https://schedule.revfactor.io/embed"
              title="Schedule a strategy call with RevFactor"
              className="w-full h-full min-h-[500px] rounded-[12px] border-0"
              allow="payment"
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
