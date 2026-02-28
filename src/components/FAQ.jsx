import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: 'how does your pricing model work?',
    a: 'We operate on a success-based fee structure — our compensation is tied to your revenue performance. This means our incentives are perfectly aligned with yours: we only win when you win. No upfront costs, no lock-in contracts.',
  },
  {
    q: 'what kind of results can I expect?',
    a: 'Most clients see a 15-30% increase in revenue within the first 90 days. Results vary based on your market, property type, and current pricing strategy. We provide clear benchmarks and transparent monthly reporting so you always know where you stand.',
  },
  {
    q: 'do I lose control of my pricing?',
    a: "Absolutely not. You retain full visibility and final approval over all pricing decisions. We provide the strategy, data, and recommendations — you decide what gets implemented. Think of us as your revenue co-pilot, not autopilot.",
  },
  {
    q: 'what pricing tools do you work with?',
    a: 'We work with leading dynamic pricing platforms including PriceLabs, Beyond, and Wheelhouse. We calibrate and layer expert strategy on top of these tools — because algorithms alone miss the nuance that drives real revenue.',
  },
  {
    q: 'how many properties do I need to get started?',
    a: 'We work with hosts managing as few as one property to portfolios of 50+. Our strategy is customized to your scale and goals. Whether you have a single luxury cabin or a growing portfolio, the approach adapts.',
  },
  {
    q: 'how do you handle my data and access?',
    a: 'We follow strict data security practices. Your PMS and channel manager access is handled through secure, permissioned integrations. We never share your data with third parties and you can revoke access at any time.',
  },
];

function AccordionItem({ item, isOpen, onToggle }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  return (
    <div className="border-b border-[#C8C4BC]/30">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left group cursor-pointer"
      >
        <span
          className="text-[clamp(18px,3vw,22px)] text-[#3F261F] lowercase pr-4"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
        >
          {item.q}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-[#8F6E62] flex-shrink-0 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-[350ms]"
        style={{
          height: `${height}px`,
          transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        }}
      >
        <div ref={contentRef} className="pb-6">
          <p className="text-[14px] leading-[1.7] text-[#76574C] max-w-2xl">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.faq-animate',
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
    <section ref={sectionRef} id="faq" className="py-24 md:py-32 bg-[#DDDAD3]">
      <div className="max-w-3xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-5">
            COMMON QUESTIONS
          </span>
          <h2
            className="faq-animate opacity-0 text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            everything you need{' '}
            <span style={{ fontStyle: 'italic' }}>to know.</span>
          </h2>
        </div>

        {/* Accordion */}
        <div className="faq-animate opacity-0">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
