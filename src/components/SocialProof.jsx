import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    rating: 5,
    quote: [
      "In my humble opinion, there is no better revenue manager out there.",
      "But in the first year, every single property saw significant growth.",
      "I've seen the same results on all my properties since joining.",
    ],
    author: 'Sarah from The Kawrells',
    verified: true,
    property: '', // TODO: add property type
    location: '', // TODO: add location
    metric: '',   // TODO: add metric
  },
  {
    id: 2,
    rating: 5,
    quote: [
      "The best way I can describe their service is that it just works.",
      "I could fan girl about the job they do all day long.",
    ],
    author: 'Emily Karnaz',
    verified: true,
    property: '', // TODO: add property type
    location: '', // TODO: add location
    metric: '',   // TODO: add metric
  },
  {
    id: 3,
    rating: 5,
    quote: [
      "Federico's aggressive approach to pricing has been a game-changer for our portfolio.",
    ],
    author: 'Cheyenne',
    verified: true,
    property: '', // TODO: add property type
    location: '', // TODO: add location
    metric: '',   // TODO: add metric
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
            className="text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            Real hosts,{' '}
            <span style={{ fontStyle: 'italic' }}>real revenue.</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="testimonial-card bg-white rounded-[20px] p-7 shadow-[0_2px_12px_rgba(22,25,16,0.05)] border border-[#C8C4BC]/15 flex flex-col"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#D9A05B] text-[#D9A05B]" />
                ))}
              </div>

              {/* Quotes */}
              <blockquote className="mb-6 flex-1 space-y-2">
                {t.quote.map((line, j) => (
                  <p
                    key={j}
                    className="text-[18px] leading-[1.5] text-[#3F261F]"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
                  >
                    "{line}"
                  </p>
                ))}
              </blockquote>

              {/* Author */}
              <div className="pt-4 border-t border-[#C8C4BC]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#3F261F] mb-0.5">
                      {t.author}
                    </p>
                    {(t.property || t.location) && (
                      <p className="text-[12px] text-[#76574C]">
                        {[t.property, t.location].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {t.metric && (
                      <span
                        className="inline-block px-2.5 py-1 bg-[#5D6D59]/10 text-[#5D6D59] rounded-full text-[11px] font-medium"
                        style={{ fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {t.metric}
                      </span>
                    )}
                    {t.verified && (
                      <span className="inline-block px-2 py-1 bg-[#5D6D59]/10 text-[#5D6D59] rounded-full text-[8px] font-bold uppercase tracking-[1.5px]">
                        VERIFIED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
