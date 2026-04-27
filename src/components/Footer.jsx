import { Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#161910] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3
              className="text-[28px] text-[#E8E6E1] mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
            >
              revfactor
            </h3>
            <p
              className="text-[16px] text-[#8F6E62]"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
            >
              Intelligent pricing for inspired stays
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <p className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#8F6E62] mb-4">
                COMPANY
              </p>
              <div className="space-y-2.5">
                <a
                  href="/about"
                  className="block text-[13px] text-[#8F6E62] hover:text-[#E8E6E1] transition-colors duration-200"
                >
                  About
                </a>
                <a
                  href="/journal"
                  className="block text-[13px] text-[#8F6E62] hover:text-[#E8E6E1] transition-colors duration-200"
                >
                  Journal
                </a>
                <a
                  href="#"
                  className="block text-[13px] text-[#8F6E62] hover:text-[#E8E6E1] transition-colors duration-200"
                >
                  Careers
                </a>
              </div>
            </div>
            <div>
              <p className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#8F6E62] mb-4">
                LEGAL
              </p>
              <div className="space-y-2.5">
                {['Terms', 'Privacy', 'Cookies'].map((link) => (
                  <a
                    key={link}
                    href="#"
                    className="block text-[13px] text-[#8F6E62] hover:text-[#E8E6E1] transition-colors duration-200"
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Status + Social */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full bg-[#5D6D59]"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
              />
              <span
                className="text-[11px] text-[#7A8B76] font-medium tracking-wide"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Revenue Engine Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://www.instagram.com/revfactor"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#E8E6E1]/5 flex items-center justify-center hover:bg-[#E8E6E1]/10 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-[#8F6E62]" />
              </a>
              <a
                href="https://www.linkedin.com/company/revfactor/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#E8E6E1]/5 flex items-center justify-center hover:bg-[#E8E6E1]/10 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-[#8F6E62]" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#E8E6E1]/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#8F6E62]/50">
            &copy; 2026 RevFactor. Past performance is not indicative of future results.
          </p>
          <p className="text-[11px] text-[#8F6E62]/30">
            Precision revenue craft.
          </p>
        </div>
      </div>
    </footer>
  );
}
