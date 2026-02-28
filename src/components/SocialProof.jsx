import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote:
      "RevFactor transformed how we think about pricing. We went from gut-feeling rates to data-driven strategy — and our revenue shows it.",
    name: 'SARAH M.',
    property: 'Mountain Retreat',
    location: 'Asheville, NC',
    metric: '+28% RevPAR',
  },
  {
    quote:
      "They don't just set prices and disappear. The ongoing strategy adjustments and monthly reporting give us total confidence.",
    name: 'JAMES & LISA K.',
    property: 'Lakefront Cabin',
    location: 'Lake Tahoe, CA',
    metric: '+19% Occupancy',
  },
  {
    quote:
      "We manage 12 properties and RevFactor treats each one individually. The market intelligence they provide is genuinely impressive.",
    name: 'DAVID R.',
    property: 'Portfolio Manager',
    location: 'Smoky Mountains, TN',
    metric: '+34% Revenue',
  },
];

export default function SocialProof() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.testimonial-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
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
    <section ref={sectionRef} id="results" className="py-24 md:py-32 bg-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-5">
            CLIENT RESULTS
          </span>
          <h2
            className="text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            real hosts,{' '}
            <span style={{ fontStyle: 'italic' }}>real revenue.</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testimonial-card opacity-0 bg-white rounded-[20px] p-7 shadow-[0_2px_12px_rgba(22,25,16,0.05)] border border-[#C8C4BC]/15 flex flex-col"
            >
              <Quote className="w-6 h-6 text-[#5D6D59]/30 mb-4" />
              <blockquote
                className="text-[18px] leading-[1.5] text-[#3F261F] mb-6 flex-1"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
              >
                {t.quote}
              </blockquote>
              <div className="pt-4 border-t border-[#C8C4BC]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#3F261F] mb-0.5">
                      {t.name}
                    </p>
                    <p className="text-[12px] text-[#76574C]">
                      {t.property} · {t.location}
                    </p>
                  </div>
                  <span
                    className="inline-block px-2.5 py-1 bg-[#5D6D59]/10 text-[#5D6D59] rounded-full text-[11px] font-medium"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {t.metric}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
