import { useEffect, useState } from 'react';

/* ─── PPC Navbar ───
   ClickFunnels-style minimal nav for paid landing pages.
   No links off the page — logo is non-clickable, anchors jump to sections,
   primary CTA scrolls to #schedule. */

const navLinks = [
  { label: 'DIFFERENCE', href: '#difference' },
  { label: 'RESULTS', href: '#results' },
  { label: 'STRATEGY', href: '#process' },
  { label: 'FAQ', href: '#faq' },
];

export default function PPCNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (href) => (e) => {
    e.preventDefault();
    setMenuOpen(false);
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] md:w-auto px-3 py-2.5 rounded-full flex items-center gap-1 transition-all duration-[350ms] ${
        scrolled
          ? 'bg-[#DDDAD3]/60 backdrop-blur-[12px] border border-[#C8C4BC]/40 shadow-[0_4px_24px_rgba(22,25,16,0.08)]'
          : 'bg-transparent border border-transparent'
      }`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
    >
      {/* Wordmark — plain text, NOT a link (ClickFunnels rule: no off-page nav) */}
      <span
        className={`text-[22px] font-normal tracking-[0.5px] px-3 transition-colors duration-[350ms] select-none ${
          scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
        }`}
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        revfactor
      </span>

      {/* Desktop Links — all in-page jumps */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={scrollTo(link.href)}
            className={`px-3 py-1.5 font-bold uppercase text-[9px] tracking-[2.5px] transition-colors duration-[200ms] hover:opacity-70 ${
              scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Desktop CTA: Free Strategy → #schedule */}
      <div className="hidden md:flex items-center gap-2 ml-2">
        <a
          href="#schedule"
          onClick={scrollTo('#schedule')}
          className="inline-flex items-center px-5 py-2 border border-transparent bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        >
          <span
            className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          />
          <span className="relative z-10">free strategy</span>
        </a>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className={`md:hidden ml-auto p-2 transition-colors duration-200 ${
          scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
        }`}
        aria-label="Toggle menu"
      >
        <div className="relative w-[18px] h-[18px]">
          <span
            className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current"
            style={{
              top: menuOpen ? '8.25px' : '3.25px',
              transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'top 300ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          />
          <span
            className="absolute left-[2px] right-[2px] h-[1.5px] rounded-full bg-current top-[8.25px]"
            style={{
              opacity: menuOpen ? 0 : 1,
              transition: 'opacity 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          />
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

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#DDDAD3]/95 backdrop-blur-[16px] rounded-[20px] border border-[#C8C4BC]/40 p-4 md:hidden shadow-[0_8px_32px_rgba(22,25,16,0.12)]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={scrollTo(link.href)}
              className="block py-2.5 font-bold uppercase text-[10px] tracking-[2.5px] text-[#3F261F]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#schedule"
            onClick={scrollTo('#schedule')}
            className="block mt-2 w-full text-center py-3 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[10px] tracking-[2px] rounded-full"
          >
            free strategy
          </a>
        </div>
      )}
    </nav>
  );
}
