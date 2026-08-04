import { useEffect, useRef, useState } from 'react';
import { Building2, Phone } from 'lucide-react';
import ScheduleModal from './ScheduleModal';

/* ─── Subscribe checkout ───
   Single Stripe checkout link. The "subscribe" buttons send visitors
   straight here — the property count is selected inside Stripe Checkout
   rather than via an on-site modal. */
const CHECKOUT_URL = 'https://checkout.revfactor.io/b/bJe7sKdnK0hcdqQ0ay0ZW0b';

function goToCheckout(source) {
  window.posthog?.capture('subscribe_checkout_started', { source });
  // Umami props are kebab-case sitewide; PostHog keeps its snake_case source
  window.rfTrack?.('outbound-click', { destination: 'subscribe', source: source.replace('_', '-') });
  window.open(CHECKOUT_URL, '_blank');
}

/* ─── Navbar ─── */
export default function Navbar({ lightBg = false }) {
  const [scrolled, setScrolled] = useState(lightBg);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(lightBg || window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lightBg]);

  // Open the ScheduleModal from anywhere on the page via custom event.
  // Use it from MDX / inline scripts: window.dispatchEvent(new CustomEvent('revfactor:open-schedule'))
  // Defensive try/catch because posthog can exist as a stub before its
  // capture function is wired — uncaught throws here would prevent
  // setScheduleOpen() from running.
  useEffect(() => {
    const open = () => {
      try {
        if (typeof window.posthog?.capture === 'function') {
          window.posthog.capture('schedule_modal_opened', { source: 'event' });
        }
      } catch (_) { /* swallow analytics errors */ }
      setScheduleOpen(true);
    };
    window.addEventListener('revfactor:open-schedule', open);
    return () => window.removeEventListener('revfactor:open-schedule', open);
  }, []);

  const navLinks = [
    { label: 'APPROACH', href: '/#approach' },
    { label: 'PROCESS', href: '/#process' },
    { label: 'RESULTS', href: '/#results' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'JOURNAL', href: '/blog' },
  ];

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[85%] md:w-auto px-3 py-2.5 rounded-full flex items-center gap-1 transition-all duration-[350ms] ${scrolled
          ? 'bg-[#DDDAD3]/60 backdrop-blur-[12px] border border-[#C8C4BC]/40 shadow-[0_4px_24px_rgba(22,25,16,0.08)]'
          : 'bg-transparent border border-transparent'
          }`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        {/* Wordmark */}
        <a
          href="/"
          aria-label="RevFactor home"
          className={`text-[22px] font-normal tracking-[0.5px] px-3 transition-colors duration-[350ms] ${scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
            }`}
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          revfactor
        </a>

        {/* Desktop Links — lg breakpoint (1024px) keeps tablets on the
            hamburger menu where the 3 buttons can stack without cutoff. */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`px-3 py-1.5 font-bold uppercase text-[9px] tracking-[2.5px] transition-colors duration-[200ms] hover:opacity-70 ${scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
                }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Buttons — order: Owners → Subscribe → Discovery Call.
            Discovery Call sits on the right (visually heaviest) so it
            anchors the eye as the primary conversion path. */}
        <div className="hidden lg:flex items-center gap-2 ml-2">
          {/* Owners — outline (renamed from "owner portal" for compactness) */}
          <a
            href="https://owner.revfactor.io"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { window.posthog?.capture('owner_portal_clicked'); window.rfTrack?.('outbound-click', { destination: 'owner-portal', source: 'navbar-desktop' }); }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 border font-bold uppercase text-[9px] tracking-[2px] rounded-full transition-all duration-[200ms] hover:scale-[1.02] ${scrolled
                ? 'border-[#3F261F]/30 text-[#3F261F] hover:bg-[#3F261F] hover:text-[#DDDAD3] hover:border-[#3F261F]'
                : 'border-[#E8E6E1]/30 text-[#E8E6E1] hover:bg-[#3F261F] hover:text-[#DDDAD3] hover:border-[#3F261F]'
              }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <Building2 className="w-3 h-3" />
            owners
          </a>

          {/* Subscribe — moss. Goes straight to Stripe Checkout. */}
          <button
            onClick={() => goToCheckout('navbar_desktop')}
            className="inline-flex items-center px-5 py-2 border border-transparent bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full whitespace-nowrap cursor-pointer relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <span
              className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            />
            <span className="relative z-10">subscribe</span>
          </button>

          {/* Discovery Call — brownish-red (#8B3A3A) primary CTA on the
              right edge. */}
          <button
            onClick={() => { window.posthog?.capture('schedule_modal_opened', { source: 'navbar_desktop' }); window.rfTrack?.('schedule-cta-click', { source: 'navbar-desktop', page: location.pathname }); setScheduleOpen(true); }}
            className="inline-flex items-center px-5 py-2 border border-transparent bg-[#8B3A3A] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full whitespace-nowrap cursor-pointer relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <span
              className="absolute inset-0 bg-[#6F2F2F] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            />
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              <Phone className="w-3 h-3" />
              discovery call
            </span>
          </button>
        </div>

        {/* Mobile / tablet menu button — visible <1024px */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`lg:hidden ml-auto p-2 cursor-pointer transition-colors duration-200 ${scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
            }`}
          aria-label="Toggle menu"
        >
          <div className="relative w-[18px] h-[18px]">
            {/* Top → slides to center + rotates to form \ */}
            <span
              className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
              style={{
                top: menuOpen ? '8.25px' : '3.25px',
                transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'top 300ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            />
            {/* Middle → fades out */}
            <span
              className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current top-[8.25px]"
              style={{
                opacity: menuOpen ? 0 : 1,
                transition: 'opacity 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            />
            {/* Bottom → slides to center + rotates to form / */}
            <span
              className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
              style={{
                top: menuOpen ? '8.25px' : '13.25px',
                transform: menuOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
                transition: 'top 300ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
              }}
            />
          </div>
        </button>

        {/* Mobile Dropdown */}
        {menuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#DDDAD3]/95 backdrop-blur-[16px] rounded-[20px] border border-[#C8C4BC]/40 p-4 lg:hidden shadow-[0_8px_32px_rgba(22,25,16,0.12)] min-w-[280px]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-2.5 font-bold uppercase text-[10px] tracking-[2.5px] text-[#3F261F]"
              >
                {link.label}
              </a>
            ))}
            <a
              href="https://owner.revfactor.io"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setMenuOpen(false);
                window.posthog?.capture('owner_portal_clicked');
                window.rfTrack?.('outbound-click', { destination: 'owner-portal', source: 'navbar-mobile' });
              }}
              className="flex items-center justify-center gap-2 mt-2 py-3 border border-[#3F261F]/20 text-[#3F261F] font-bold uppercase text-[10px] tracking-[2px] rounded-full"
            >
              <Building2 className="w-3.5 h-3.5" />
              owners
            </a>
            <button
              onClick={() => {
                setMenuOpen(false);
                goToCheckout('navbar_mobile');
              }}
              className="block mt-2 w-full text-center py-3 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full cursor-pointer"
            >
              subscribe
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                window.posthog?.capture('schedule_modal_opened', { source: 'navbar_mobile' });
                window.rfTrack?.('schedule-cta-click', { source: 'navbar-mobile', page: location.pathname });
                setScheduleOpen(true);
              }}
              className="flex items-center justify-center gap-2 mt-2 w-full py-3 bg-[#8B3A3A] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              discovery call
            </button>
          </div>
        )}
      </nav>

      {/* Schedule Modal — opened from the "Discovery Call" button or the
          global revfactor:open-schedule event. */}
      {scheduleOpen && <ScheduleModal onClose={() => setScheduleOpen(false)} />}
    </>
  );
}
