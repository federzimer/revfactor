import { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingDown, Calendar, Bell, DollarSign } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

function ChaosCalendar() {
  const [prices, setPrices] = useState(() => generatePrices());
  const [lostRevenue, setLostRevenue] = useState(2847);

  function generatePrices() {
    return Array.from({ length: 21 }, () => ({
      price: Math.floor(Math.random() * 150) + 80,
      status: ['high', 'low', 'empty', 'ok'][Math.floor(Math.random() * 4)],
    }));
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) => {
        const next = [...prev];
        const idx = Math.floor(Math.random() * next.length);
        const change = Math.floor(Math.random() * 40) - 20;
        next[idx] = {
          price: Math.max(60, Math.min(300, next[idx].price + change)),
          status: ['high', 'low', 'empty', 'ok'][Math.floor(Math.random() * 4)],
        };
        return next;
      });
    }, 800);

    const revenueInterval = setInterval(() => {
      setLostRevenue((prev) => prev + Math.floor(Math.random() * 23) + 5);
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(revenueInterval);
    };
  }, []);

  const statusColor = {
    high: 'text-[#5D6D59] bg-[#5D6D59]/10',
    low: 'text-[#8B3A3A] bg-[#8B3A3A]/10',
    empty: 'text-[#8F6E62] bg-[#8F6E62]/10',
    ok: 'text-[#3F261F] bg-[#3F261F]/5',
  };

  const notifications = [
    { text: 'Competitor dropped price -$18', delay: 0 },
    { text: '3 empty nights this week', delay: 1 },
    { text: 'Event in 2 days — no adjustment', delay: 2 },
  ];

  return (
    <div className="relative">
      {/* Mini Calendar */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(22,25,16,0.06)] border border-[#C8C4BC]/20">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#76574C]">
            PRICING CALENDAR
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-[#8B3A3A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B3A3A] animate-pulse" />
            UNOPTIMIZED
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[9px] font-bold uppercase tracking-[1px] text-[#8F6E62] pb-1">
              {d}
            </div>
          ))}
          {prices.map((cell, i) => (
            <div
              key={i}
              className={`relative text-center py-2 px-1 rounded-lg transition-all duration-300 ${statusColor[cell.status]}`}
            >
              <span
                className="text-[11px] font-medium tabular-nums"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                ${cell.price}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Lost Counter */}
      <div className="mt-4 bg-white rounded-[16px] p-4 shadow-[0_2px_12px_rgba(22,25,16,0.06)] border border-[#8B3A3A]/10">
        <div className="flex items-center justify-between">
          <span className="font-bold uppercase text-[9px] tracking-[2.5px] text-[#8B3A3A]">
            ESTIMATED REVENUE LOST
          </span>
          <span
            className="text-[22px] font-medium text-[#8B3A3A] tabular-nums"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            ${lostRevenue.toLocaleString()}
          </span>
        </div>
        <div className="mt-2 h-1 bg-[#8B3A3A]/10 rounded-full overflow-hidden">
          <div className="h-full bg-[#8B3A3A]/40 rounded-full animate-pulse" style={{ width: '72%' }} />
        </div>
      </div>

      {/* Floating Notifications */}
      <div className="mt-4 space-y-2">
        {notifications.map((n, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-[#C8C4BC]/30 shadow-[0_1px_6px_rgba(22,25,16,0.04)]"
            style={{ animationDelay: `${n.delay * 0.4}s` }}
          >
            <Bell className="w-3.5 h-3.5 text-[#8F6E62] flex-shrink-0" />
            <span className="text-[12px] text-[#76574C]">{n.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pain() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.pain-animate',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            once: true,
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const painPoints = [
    {
      icon: TrendingDown,
      text: 'Leaving money on the table during peak demand periods',
    },
    {
      icon: Calendar,
      text: 'Gap nights and inconsistent occupancy eating into profits',
    },
    {
      icon: DollarSign,
      text: 'No clear strategy — just reacting to competitors blindly',
    },
    {
      icon: Bell,
      text: 'Missing local events, seasonal shifts, and market changes',
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-[#E8E6E1]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-start">
          {/* Left Column */}
          <div>
            <div className="pain-animate opacity-0">
              <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-6">
                THE PROBLEM
              </span>
            </div>

            <h2 className="pain-animate opacity-0 mb-6">
              <span
                className="block text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
              >
                Pricing without strategy
              </span>
              <span
                className="block text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#1E4A40]"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
              >
                is just guessing.
              </span>
            </h2>

            <p className="pain-animate opacity-0 text-[15px] leading-[1.7] text-[#76574C] mb-8 max-w-md">
              Most hosts set prices based on gut feeling or copy their neighbors.
              The result? Thousands left on the table every season.
            </p>

            <div className="space-y-4">
              {painPoints.map((point, i) => (
                <div
                  key={i}
                  className="pain-animate opacity-0 flex items-start gap-3"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#5D6D59]/10 flex items-center justify-center flex-shrink-0">
                    <point.icon className="w-4 h-4 text-[#5D6D59]" />
                  </div>
                  <span className="text-[14px] leading-[1.6] text-[#76574C]">
                    {point.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="pain-animate opacity-0">
            <ChaosCalendar />
          </div>
        </div>
      </div>
    </section>
  );
}
