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
      {/* Parallax Background — <picture> with WebP srcset + JPG fallback. opacity-10 preserves the dark mood overlay. */}
      <picture>
        <source
          type="image/webp"
          srcSet="/images/dynamic-pricing-strategy-mountain-cabin-1200.webp 1200w, /images/dynamic-pricing-strategy-mountain-cabin-1920.webp 1920w"
          sizes="100vw"
        />
        <img
          src="/images/dynamic-pricing-strategy-mountain-cabin-fallback.jpg"
          alt="Mountain cabin overlooking valley at sunrise — illustrating the philosophy that every night has its true market value"
          loading="lazy"
          decoding="async"
          width="1920"
          height="1280"
          className="absolute inset-0 w-full h-full object-cover opacity-10"
        />
      </picture>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
        {/* Question 1 */}
        <div className="mb-16 md:mb-20">
          <p className="philo-reveal opacity-0 font-bold uppercase text-[10px] tracking-[3px] text-[#8F6E62] mb-4">
            MOST HOSTS ASK
          </p>
          <h2
            className="philo-reveal opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#C8C4BC]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            "What should I charge?"
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
            className="philo-reveal opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#E8E6E1]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
          >
            "What is every night worth?"
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
