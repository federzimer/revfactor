import { useEffect, useRef, useState } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'APPROACH', href: '#approach' },
    { label: 'PROCESS', href: '#process' },
    { label: 'RESULTS', href: '#results' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2.5 rounded-full flex items-center gap-1 transition-all duration-[350ms] ${
        scrolled
          ? 'bg-[#DDDAD3]/60 backdrop-blur-[12px] border border-[#C8C4BC]/40 shadow-[0_4px_24px_rgba(22,25,16,0.08)]'
          : 'bg-transparent border border-transparent'
      }`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
    >
      {/* Wordmark */}
      <a
        href="#"
        className={`font-[\'Cormorant_Garamond\',Georgia,serif] text-[22px] font-normal lowercase tracking-[0.5px] px-3 transition-colors duration-[350ms] ${
          scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
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
            className={`px-3 py-1.5 font-bold uppercase text-[9px] tracking-[2.5px] transition-colors duration-[200ms] hover:opacity-70 ${
              scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* CTA */}
      <a
        href="#contact"
        className="hidden md:inline-flex items-center ml-2 px-5 py-2 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <span className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]" style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }} />
        <span className="relative z-10">let's talk</span>
      </a>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`md:hidden ml-2 p-2 transition-colors duration-200 ${
          scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
        }`}
        aria-label="Toggle menu"
      >
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <path
            d={menuOpen ? 'M1 1L17 11M1 11L17 1' : 'M0 1H18M0 6H18M0 11H18'}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
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
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="block mt-2 text-center py-3 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full"
          >
            let's talk
          </a>
        </div>
      )}
    </nav>
  );
}
