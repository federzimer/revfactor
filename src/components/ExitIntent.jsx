import { useEffect, useRef, useState } from 'react';
import { X, Download, ShieldCheck } from 'lucide-react';

/* ─── Exit-Intent Capture ───
   Detects when the user's cursor leaves the top edge of the viewport (about
   to switch tabs / close window / hit URL bar) and offers a lead magnet
   in exchange for an email. One-shot per session — never re-trigger.

   Triggers ONLY:
     - desktop (mouse leave from top)
     - mobile (alternate trigger: scroll past 60% then idle 12s)
   Skips:
     - if the schedule modal is open
     - if user already booked (window.localStorage flag set on confirm)
     - if user already saw + dismissed (sessionStorage flag)
     - first 8s of pageview (avoid fires on bounce)

   Submits to /api/lead-magnet (Astro server endpoint or Apps Script). For
   now, posts to a placeholder; wire to Resend / Sheet / Plusvibe later. */

const STORAGE_KEY = 'revfactor.exit_intent_seen';

export default function ExitIntent() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const trigCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (localStorage.getItem('revfactor.booked')) return;

    let armedAt = Date.now();
    const ARM_DELAY = 8000;

    const trigger = (reason) => {
      if (Date.now() - armedAt < ARM_DELAY) return;
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      // Skip if any modal is already open (look for body-scroll-lock signal
      // OR a [role=dialog] in the DOM)
      if (document.querySelector('[role="dialog"]')) return;
      trigCountRef.current += 1;
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
      setOpen(true);
      // Telemetry — fires whenever popup actually shows
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'exit_intent_shown', { reason });
      }
    };

    // Desktop: mouseleave from top of viewport
    const onMouseLeave = (e) => {
      if (e.clientY <= 0) trigger('mouseleave');
    };

    // Mobile: scrolled past 60% and idle for 12s
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

  const close = () => setOpen(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setStatus('submitting');
    try {
      // POST to /api/lead-magnet — Astro endpoint to be wired to Resend/Sheet.
      // For now, also fire as a GA4 event so we can measure capture rate
      // before the backend is in.
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'lead_magnet_submit', { value: 200, currency: 'USD' });
      }
      await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'exit_intent', page: window.location.pathname }),
      }).catch(() => {});
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadein"
         style={{ animation: 'eiFadeIn 250ms cubic-bezier(0.25,0.1,0.25,1)' }}>
      <style>{`
        @keyframes eiFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes eiSlideUp { from { transform: translateY(24px); opacity:0 } to { transform: translateY(0); opacity:1 } }
      `}</style>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px]" onClick={close} />
      <div className="relative bg-[#E8E6E1] rounded-[20px] max-w-[480px] w-full p-7 md:p-9 shadow-[0_24px_80px_rgba(0,0,0,0.4)] border border-[#C8C4BC]"
           style={{ animation: 'eiSlideUp 350ms cubic-bezier(0.25,0.1,0.25,1)' }}>
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full text-[#76574C] hover:bg-[#C8C4BC]/40 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {status === 'done' ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#5D6D59] mx-auto mb-4 flex items-center justify-center">
              <Download className="w-7 h-7 text-[#E8E6E1]" />
            </div>
            <h3 className="text-[26px] leading-[1.15] text-[#3F261F] mb-3"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Check your inbox
            </h3>
            <p className="text-[16px] text-[#76574C] leading-[1.6]">
              Sent the 1-page revenue audit checklist to <span className="font-bold">{email}</span>. Should land in 2 min.
            </p>
          </div>
        ) : (
          <>
            <p className="font-bold uppercase text-[11px] tracking-[3px] text-[#5D6D59] mb-3">
              BEFORE YOU GO
            </p>
            <h3 className="text-[clamp(24px,4vw,32px)] leading-[1.15] text-[#3F261F] mb-3"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Not ready to talk?{' '}
              <span style={{ fontStyle: 'italic', color: '#5D6D59' }}>Take the audit.</span>
            </h3>
            <p className="text-[16px] text-[#76574C] leading-[1.55] mb-5">
              Get the 1-page revenue audit checklist Federico uses to spot leaks across 100+ STR portfolios. Free PDF, 2-min read.
            </p>
            <form onSubmit={submit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'submitting'}
                className="w-full px-4 py-3.5 rounded-full bg-white border border-[#C8C4BC] text-[16px] text-[#3F261F] placeholder:text-[#8F6E62] focus:outline-none focus:border-[#5D6D59] focus:ring-2 focus:ring-[#5D6D59]/20"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[12px] tracking-[2px] rounded-full hover:bg-[#7A8B76] active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                {status === 'submitting' ? 'Sending…' : 'Send the checklist'}
              </button>
            </form>
            <div className="mt-4 flex items-start gap-2 text-[13px] text-[#8F6E62]">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>No spam. One email with the PDF, then occasional STR revenue tips. Unsubscribe anytime.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
