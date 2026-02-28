import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, X } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const forYou = [
  'You own 1+ STR properties and want higher returns',
  'You value data-driven decisions over guesswork',
  'You want expert strategy, not just a pricing tool',
  'You\'re ready to invest in professional revenue management',
  'You want transparent reporting and full control',
];

const notForYou = [
  'You prefer to set prices once and forget them',
  'You\'re looking for the cheapest option, not the best',
  'You want to micromanage every pricing decision',
  'You don\'t believe market data should drive pricing',
];

export default function Qualification() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.qual-animate',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            once: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#DDDAD3]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-5">
            IS THIS FOR YOU?
          </span>
          <h2
            className="text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            the right fit{' '}
            <span style={{ fontStyle: 'italic' }}>matters.</span>
          </h2>
        </div>

        {/* Split */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* For You */}
          <div className="qual-animate opacity-0 bg-[#1E4A40] rounded-[24px] p-8 md:p-10">
            <h3
              className="text-[24px] text-[#E8E6E1] lowercase mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
            >
              revfactor is for you if...
            </h3>
            <div className="space-y-4">
              {forYou.map((item, i) => (
                <div key={i} className="qual-animate opacity-0 flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#5D6D59] flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-[#E8E6E1]" />
                  </div>
                  <span className="text-[14px] leading-[1.6] text-[#E8E6E1]/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Not For You */}
          <div className="qual-animate opacity-0 bg-white rounded-[24px] p-8 md:p-10 border border-[#C8C4BC]/20">
            <h3
              className="text-[24px] text-[#3F261F] lowercase mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
            >
              we might not be the right fit if...
            </h3>
            <div className="space-y-4">
              {notForYou.map((item, i) => (
                <div key={i} className="qual-animate opacity-0 flex items-start gap-3">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-[#8F6E62]/15 flex items-center justify-center flex-shrink-0">
                    <X className="w-3 h-3 text-[#8F6E62]" />
                  </div>
                  <span className="text-[14px] leading-[1.6] text-[#76574C]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
