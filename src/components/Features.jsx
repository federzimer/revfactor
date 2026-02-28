import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BarChart3, Zap, CalendarDays } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ─── Card 1: Metric Shuffler ─── */
function MetricShuffler() {
  const [order, setOrder] = useState([0, 1, 2]);
  const metrics = [
    { label: 'Market Position Score', value: '94', suffix: '/100' },
    { label: 'Pricing Health Index', value: 'A+', suffix: '' },
    { label: 'Revenue vs Comp Set', value: '+18', suffix: '%' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setOrder((prev) => {
        const next = [...prev];
        next.push(next.shift());
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-[200px]">
      {order.map((idx, position) => (
        <div
          key={idx}
          className="absolute left-0 right-0 bg-white rounded-[16px] p-4 border border-[#C8C4BC]/20 shadow-[0_2px_12px_rgba(22,25,16,0.06)]"
          style={{
            top: `${position * 24}px`,
            zIndex: 3 - position,
            opacity: 1 - position * 0.15,
            transform: `scale(${1 - position * 0.03})`,
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold uppercase text-[8px] tracking-[2px] text-[#8F6E62] mb-1">
                {metrics[idx].label}
              </p>
              <p
                className="text-[28px] font-medium text-[#161910]"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {metrics[idx].value}
                <span className="text-[14px] text-[#8F6E62]">{metrics[idx].suffix}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#5D6D59]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#5D6D59]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Card 2: Strategy Typewriter ─── */
function StrategyTypewriter() {
  const messages = [
    'Analyzing comp set pricing...',
    'Adjusting weekend premium +12%...',
    'Event surge detected: Marathon Weekend...',
    'Minimum stay optimized to 3 nights...',
    'Gap night filled: Tuesday $89...',
    'Seasonal rate adjustment applied...',
  ];
  const [current, setCurrent] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const msg = messages[current];
    if (charIndex < msg.length) {
      const timeout = setTimeout(() => {
        setDisplayed(msg.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 35);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrent((prev) => (prev + 1) % messages.length);
        setCharIndex(0);
        setDisplayed('');
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, current]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-[#5D6D59] animate-pulse" />
        <span className="font-bold uppercase text-[8px] tracking-[2.5px] text-[#5D6D59]">
          STRATEGY ENGINE
        </span>
        <span className="ml-auto font-bold uppercase text-[8px] tracking-[2px] text-[#8F6E62]">
          LIVE
        </span>
      </div>
      <div className="bg-[#161910] rounded-[12px] p-4 min-h-[52px]">
        <p
          className="text-[13px] text-[#7A8B76]"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          <span className="text-[#5D6D59]">→ </span>
          {displayed}
          <span className="inline-block w-[2px] h-[14px] bg-[#13342D] ml-0.5 align-middle" style={{ animation: 'blink-cursor 0.8s ease-in-out infinite' }} />
        </p>
      </div>
      <div className="flex gap-1">
        {messages.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i === current ? 'bg-[#5D6D59]' : 'bg-[#C8C4BC]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Card 3: Calendar Optimizer ─── */
function CalendarOptimizer() {
  const [prices, setPrices] = useState(() =>
    Array.from({ length: 28 }, (_, i) => ({
      day: i + 1,
      price: Math.floor(Math.random() * 100) + 120,
      optimized: false,
    }))
  );
  const [cursorPos, setCursorPos] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    const runCycle = () => {
      let step = 0;
      setOptimizing(true);

      const interval = setInterval(() => {
        if (step < 6) {
          const idx = Math.floor(Math.random() * 28);
          setCursorPos(idx);
          setPrices((prev) => {
            const next = [...prev];
            const change = Math.floor(Math.random() * 30) - 5;
            next[idx] = {
              ...next[idx],
              price: Math.max(89, next[idx].price + change),
              optimized: true,
            };
            return next;
          });
          step++;
        } else {
          clearInterval(interval);
          setCursorPos(null);

          setTimeout(() => {
            setPrices((prev) =>
              prev.map((p) => ({
                ...p,
                price: Math.floor(Math.random() * 100) + 120,
                optimized: false,
              }))
            );
            setOptimizing(false);
          }, 3000);
        }
      }, 600);

      return () => clearInterval(interval);
    };

    const timeout = setTimeout(runCycle, 1500);
    const cycle = setInterval(runCycle, 10000);

    return () => {
      clearTimeout(timeout);
      clearInterval(cycle);
    };
  }, []);

  const getDemandColor = (price) => {
    if (price > 200) return 'bg-[#5D6D59]/20 text-[#5D6D59]';
    if (price > 160) return 'bg-[#7A8B76]/15 text-[#5D6D59]';
    if (price > 120) return 'bg-[#8F6E62]/10 text-[#76574C]';
    return 'bg-[#8F6E62]/5 text-[#8F6E62]';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold uppercase text-[8px] tracking-[2.5px] text-[#8F6E62]">
          MARCH 2025
        </span>
        {optimizing && (
          <span className="flex items-center gap-1.5 text-[9px] text-[#5D6D59] font-bold uppercase tracking-[2px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5D6D59] animate-pulse" />
            OPTIMIZING
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[8px] font-bold uppercase tracking-[1px] text-[#8F6E62] pb-1">
            {d}
          </div>
        ))}
        {prices.map((cell, i) => (
          <div
            key={i}
            className={`relative text-center py-1.5 rounded-lg transition-all duration-300 ${getDemandColor(cell.price)} ${
              cursorPos === i ? 'ring-2 ring-[#5D6D59] ring-offset-1' : ''
            } ${cell.optimized ? 'scale-[1.02]' : ''}`}
          >
            <span className="block text-[7px] text-[#8F6E62] mb-0.5">{cell.day}</span>
            <span
              className="text-[10px] font-medium tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              ${cell.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Features Section ─── */
export default function Features() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.feature-card',
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
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
    <section ref={sectionRef} id="approach" className="py-24 md:py-32 bg-[#DDDAD3]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-5">
            OUR APPROACH
          </span>
          <h2
            className="text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            revenue intelligence,{' '}
            <span style={{ fontStyle: 'italic' }}>not just tools.</span>
          </h2>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="feature-card opacity-0 bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(22,25,16,0.06)] border border-[#C8C4BC]/15 hover:shadow-[0_8px_32px_rgba(22,25,16,0.08)] transition-shadow duration-[350ms]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#5D6D59]/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#5D6D59]" />
              </div>
              <h3 className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#3F261F]">
                REVENUE INTELLIGENCE
              </h3>
            </div>
            <MetricShuffler />
            <p className="mt-4 text-[13px] leading-[1.6] text-[#76574C]">
              Real-time market positioning and competitive analysis that turns data into pricing decisions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card opacity-0 bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(22,25,16,0.06)] border border-[#C8C4BC]/15 hover:shadow-[0_8px_32px_rgba(22,25,16,0.08)] transition-shadow duration-[350ms]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#5D6D59]/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#5D6D59]" />
              </div>
              <h3 className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#3F261F]">
                LIVE STRATEGY ENGINE
              </h3>
            </div>
            <StrategyTypewriter />
            <p className="mt-4 text-[13px] leading-[1.6] text-[#76574C]">
              Continuous market monitoring with expert-calibrated pricing adjustments — not just algorithmic guesswork.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card opacity-0 bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(22,25,16,0.06)] border border-[#C8C4BC]/15 hover:shadow-[0_8px_32px_rgba(22,25,16,0.08)] transition-shadow duration-[350ms]">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-[#5D6D59]/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-[#5D6D59]" />
              </div>
              <h3 className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#3F261F]">
                DYNAMIC CALENDAR
              </h3>
            </div>
            <CalendarOptimizer />
            <p className="mt-4 text-[13px] leading-[1.6] text-[#76574C]">
              Every night priced to its true market value — demand-responsive, event-aware, strategically optimized.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
