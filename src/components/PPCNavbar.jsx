import { useEffect, useState } from 'react';

/* ─── PPC Navbar ───
   ClickFunnels-style minimal nav for paid landing pages: wordmark + single
   "Talk to Federico" CTA only. Section-jump links (Difference / Results /
   Strategy / FAQ) intentionally removed — they were splitting attention
   on a single-purpose conversion page. The only nav action is "go to
   schedule." Mobile = same shape, no hamburger drawer. */

export default function PPCNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSchedule = (e) => {
    e.preventDefault();
    const el = document.getElementById('schedule');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] md:w-auto px-3 py-2.5 rounded-full flex items-center gap-3 transition-all duration-[350ms] ${
        scrolled
          ? 'bg-[#DDDAD3]/60 backdrop-blur-[12px] border border-[#C8C4BC]/40 shadow-[0_4px_24px_rgba(22,25,16,0.08)]'
          : 'bg-transparent border border-transparent'
      }`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
    >
      {/* Wordmark — plain text, NOT a link */}
      <span
        className={`text-[22px] font-normal tracking-[0.5px] px-3 transition-colors duration-[350ms] select-none ${
          scrolled ? 'text-[#3F261F]' : 'text-[#E8E6E1]'
        }`}
        style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
      >
        revfactor
      </span>

      {/* Single CTA — Talk to Federico → #schedule. Visible on every viewport. */}
      <a
        href="#schedule"
        onClick={scrollToSchedule}
        className="ml-auto inline-flex items-center px-5 py-2 bg-[#5D6D59] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <span
          className="absolute inset-0 bg-[#7A8B76] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        />
        <span className="relative z-10">Talk to Federico</span>
      </a>
    </nav>
  );
}
