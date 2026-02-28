import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = sectionRef.current.querySelectorAll('.philo-reveal');
      elements.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              once: true,
            },
          }
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-44 overflow-hidden bg-[#161910]"
    >
      {/* Parallax Background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80&auto=format')`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        {/* Question 1 */}
        <div className="mb-16 md:mb-20">
          <p className="philo-reveal opacity-0 font-bold uppercase text-[10px] tracking-[3px] text-[#8F6E62] mb-4">
            MOST HOSTS ASK
          </p>
          <h2
            className="philo-reveal opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#C8C4BC] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            "what should I charge?"
          </h2>
        </div>

        {/* Divider */}
        <div className="philo-reveal opacity-0 flex items-center justify-center gap-6 mb-16 md:mb-20">
          <div className="w-16 h-px bg-[#8F6E62]/30" />
          <span className="font-bold uppercase text-[10px] tracking-[3px] text-[#8F6E62]">VS</span>
          <div className="w-16 h-px bg-[#8F6E62]/30" />
        </div>

        {/* Question 2 */}
        <div>
          <p className="philo-reveal opacity-0 font-bold uppercase text-[10px] tracking-[3px] text-[#7A8B76] mb-4">
            WE ASK
          </p>
          <h2
            className="philo-reveal opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#E8E6E1] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
          >
            "what is every night worth?"
          </h2>
        </div>

        {/* Subtext */}
        <p className="philo-reveal opacity-0 mt-12 text-[15px] leading-[1.7] text-[#8F6E62] max-w-lg mx-auto">
          The difference between setting a price and understanding value
          is the difference between surviving and thriving.
        </p>
      </div>
    </section>
  );
}
