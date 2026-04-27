import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Building2, X, ArrowRight, Check } from 'lucide-react';

/* ─── Stripe Checkout URLs (keyed by property count) ─── */
const STRIPE_URLS = {
  1: 'https://buy.stripe.com/3cIbJ03Na8NI3QgbTg0ZW00',
  2: 'https://buy.stripe.com/6oUbJ0bfC1lg2Mc8H40ZW01',
  3: 'https://buy.stripe.com/7sYaEWdnK9RM2Mc3mK0ZW02',
  4: 'https://buy.stripe.com/6oU14mcjGggafyY8H40ZW03',
  5: 'https://buy.stripe.com/6oU4gybfCe823Qg2iG0ZW04',
};

const propertyOptions = [
  { count: 1, label: '1 property' },
  { count: 2, label: '2 properties' },
  { count: 3, label: '3 properties' },
  { count: 4, label: '4 properties' },
  { count: 5, label: '5 properties' },
];

/* ─── Subscribe Modal ───
   Mounted/unmounted by parent via conditional rendering.
   Handles its own exit animation before calling onClose. */
function SubscribeModal({ onClose }) {
  const [selectedCount, setSelectedCount] = useState(null);
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

  const handleCheckout = () => {
    if (selectedCount) {
      window.open(STRIPE_URLS[selectedCount], '_blank');
    }
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
          aria-labelledby="subscribe-modal-title"
          tabIndex={-1}
          className="relative bg-white rounded-[20px] w-full max-w-[420px] max-h-[90dvh] overflow-y-auto p-7 shadow-[0_16px_64px_rgba(22,25,16,0.2)] outline-none"
          style={{ opacity: 0 }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Close subscribe dialog"
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-[#76574C] hover:bg-[#C8C4BC]/20 transition-colors duration-200"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {/* Badge */}
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-4" data-umami-event="CTA-1">
            SUBSCRIBE
          </span>

          {/* Heading */}
          <h2
            id="subscribe-modal-title"
            className="text-[clamp(28px,4vw,36px)] leading-[1.1] text-[#3F261F] mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
          >
            How many properties?
          </h2>
          <p className="text-[14px] leading-[1.6] text-[#76574C] mb-6">
            Select the number of properties you want to manage with RevFactor.
          </p>

          {/* Radio Group */}
          <div role="radiogroup" aria-label="Number of properties" className="space-y-2.5 mb-6">
            {propertyOptions.map(({ count, label }) => (
              <button
                key={count}
                role="radio"
                aria-checked={selectedCount === count}
                onClick={() => setSelectedCount(count)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] border transition-all duration-[200ms] text-left ${selectedCount === count
                    ? 'border-[#13342D] bg-[#13342D]/5'
                    : 'border-[#C8C4BC]/30 hover:border-[#C8C4BC]/60'
                  }`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              >
                {/* Custom radio indicator */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-[200ms] ${selectedCount === count
                      ? 'border-[#13342D] bg-[#13342D]'
                      : 'border-[#C8C4BC]'
                    }`}
                >
                  {selectedCount === count && <Check className="w-3 h-3 text-white" />}
                </div>

                {/* Label */}
                <span className="text-[14px] text-[#3F261F] font-medium">{label}</span>

                {/* Property icons */}
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: count }).map((_, i) => (
                    <Building2
                      key={i}
                      className={`w-3.5 h-3.5 transition-colors duration-[200ms] ${selectedCount === count ? 'text-[#13342D]' : 'text-[#8F6E62]'
                        }`}
                    />
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={!selectedCount}
            className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold uppercase text-[11px] tracking-[2px] rounded-full relative overflow-hidden group transition-all duration-[200ms] ${selectedCount
                ? 'bg-[#13342D] text-[#E8E6E1] hover:scale-[1.02] cursor-pointer'
                : 'bg-[#C8C4BC]/40 text-[#8F6E62] cursor-not-allowed'
              }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            {selectedCount && (
              <span
                className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
                style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
              />
            )}
            <span className="relative z-10">continue to checkout</span>
            <ArrowRight className="relative z-10 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Navbar ─── */
export default function Navbar({ lightBg = false }) {
  const [scrolled, setScrolled] = useState(lightBg);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(lightBg || window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lightBg]);

  const navLinks = [
    { label: 'APPROACH', href: '/#approach' },
    { label: 'PROCESS', href: '/#process' },
    { label: 'RESULTS', href: '/#results' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'JOURNAL', href: '/journal' },
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

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
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

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2 ml-2">
          {/* Owner Portal — outline */}
          <a
            href="https://owner.revfactor.io"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-4 py-2 border font-bold uppercase text-[9px] tracking-[2px] rounded-full transition-all duration-[200ms] hover:scale-[1.02] ${scrolled
                ? 'border-[#3F261F]/30 text-[#3F261F] hover:bg-[#3F261F] hover:text-[#DDDAD3] hover:border-[#3F261F]'
                : 'border-[#E8E6E1]/30 text-[#E8E6E1] hover:bg-[#3F261F] hover:text-[#DDDAD3] hover:border-[#3F261F]'
              }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <Building2 className="w-3 h-3" />
            owner portal
          </a>

          {/* Subscribe — moss to match hero "Schedule a Strategy Call" CTA. Transparent border keeps box-model height matched to Owner Portal's 1px border. */}
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center px-5 py-2 border border-transparent bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          >
            <span
              className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
              style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
            />
            <span className="relative z-10">subscribe</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`md:hidden ml-auto p-2 transition-colors duration-200 ${scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#DDDAD3]/95 backdrop-blur-[16px] rounded-[20px] border border-[#C8C4BC]/40 p-4 md:hidden shadow-[0_8px_32px_rgba(22,25,16,0.12)]">
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
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 mt-2 py-3 border border-[#3F261F]/20 text-[#3F261F] font-bold uppercase text-[10px] tracking-[2px] rounded-full"
            >
              <Building2 className="w-3.5 h-3.5" />
              owner portal
            </a>
            <button
              onClick={() => {
                setMenuOpen(false);
                setModalOpen(true);
              }}
              className="block mt-2 w-full text-center py-3 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full"
            >
              subscribe
            </button>
          </div>
        )}
      </nav>

      {/* Subscribe Modal — conditionally mounted */}
      {modalOpen && <SubscribeModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
