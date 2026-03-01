import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ─── Animated SVGs ─── */
function RevenueChart() {
  const pathRef = useRef(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 3,
      ease: 'power2.out',
      repeat: -1,
      repeatDelay: 2,
    });
  }, []);

  return (
    <svg viewBox="0 0 300 120" className="w-full max-w-[280px] mx-auto">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8E6E1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E8E6E1" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[30, 60, 90].map((y) => (
        <line key={y} x1="10" y1={y} x2="290" y2={y} stroke="#E8E6E1" strokeOpacity="0.1" strokeWidth="0.5" />
      ))}
      <path
        ref={pathRef}
        d="M 10 100 Q 50 95 80 85 T 140 65 T 200 40 T 260 25 L 290 15"
        fill="none"
        stroke="url(#chartGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Dot at end */}
      <circle cx="290" cy="15" r="4" fill="#E8E6E1" opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function HeatmapCalendar() {
  const cellsRef = useRef([]);

  useEffect(() => {
    const cells = cellsRef.current.filter(Boolean);
    if (!cells.length) return;

    const ctx = gsap.context(() => {
      gsap.to(cells, {
        fill: () => gsap.utils.random(['#D9A05B', '#BD5E3B', '#8F6E62', '#D9A05B']),
        duration: 2,
        stagger: 0.1,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-sm drop-shadow-2xl">
      <rect x="50" y="50" width="300" height="200" rx="16" fill="white" opacity="0.05" />
      {Array.from({ length: 24 }).map((_, i) => (
        <rect
          key={i}
          ref={(el) => (cellsRef.current[i] = el)}
          x={70 + (i % 6) * 45}
          y={70 + Math.floor(i / 6) * 45}
          width="35"
          height="35"
          rx="6"
          fill="#8F6E62"
        />
      ))}
    </svg>
  );
}

function OccupancyEKG() {
  const path1Ref = useRef(null);
  const path2Ref = useRef(null);

  useEffect(() => {
    [path1Ref, path2Ref].forEach((ref) => {
      const path = ref.current;
      if (!path) return;
      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 4,
        ease: 'power1.out',
        repeat: -1,
        repeatDelay: 1.5,
      });
    });
  }, []);

  return (
    <svg viewBox="0 0 300 100" className="w-full max-w-[280px] mx-auto">
      {/* Occupancy line */}
      <path
        ref={path1Ref}
        d="M 0 70 Q 30 65 50 55 T 100 45 T 150 35 T 200 30 T 250 28 L 300 25"
        fill="none"
        stroke="#E8E6E1"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* ADR line */}
      <path
        ref={path2Ref}
        d="M 0 80 Q 30 75 50 65 T 100 55 T 150 42 T 200 38 T 250 32 L 300 28"
        fill="none"
        stroke="#7A8B76"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
      />
      {/* Labels */}
      <text x="5" y="16" fill="#E8E6E1" opacity="0.4" fontSize="7" fontFamily="'JetBrains Mono', monospace">OCC</text>
      <text x="5" y="96" fill="#7A8B76" opacity="0.4" fontSize="7" fontFamily="'JetBrains Mono', monospace">ADR</text>
    </svg>
  );
}

const steps = [
  {
    number: '01',
    title: 'discover',
    copy: "We audit your property's market position, pricing gaps, and revenue potential.",
    bg: 'bg-[#13342D]',
    Visual: RevenueChart,
  },
  {
    number: '02',
    title: 'strategize',
    copy: 'We build a custom pricing strategy calibrated to your market, events, and goals.',
    bg: 'bg-[#3F261F]',
    Visual: HeatmapCalendar,
  },
  {
    number: '03',
    title: 'optimize',
    copy: 'Daily monitoring, strategic adjustments, and monthly reporting — revenue on autopilot.',
    bg: 'bg-[#5D6D59]',
    Visual: OccupancyEKG,
  },
];

export default function Process() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (i < cardsRef.current.length - 1) {
          ScrollTrigger.create({
            trigger: card,
            start: 'top 10%',
            end: 'bottom 10%',
            onEnter: () => {
              gsap.to(card, {
                scale: 0.92,
                opacity: 0.5,
                filter: 'blur(8px)',
                duration: 0.6,
                ease: 'power2.out',
              });
            },
            onLeaveBack: () => {
              gsap.to(card, {
                scale: 1,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 0.6,
                ease: 'power2.out',
              });
            },
          });
        }
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="process" className="py-24 md:py-32 bg-[#DDDAD3]">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-5">
            HOW IT WORKS
          </span>
          <h2
            className="text-[clamp(32px,5vw,48px)] leading-[1.1] text-[#3F261F] lowercase"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400 }}
          >
            three steps to{' '}
            <span style={{ fontStyle: 'italic' }}>optimized revenue.</span>
          </h2>
        </div>

        {/* Stacking Cards */}
        <div className="space-y-6">
          {steps.map((step, i) => (
            <div
              key={i}
              ref={(el) => (cardsRef.current[i] = el)}
              className={`${step.bg} rounded-[24px] p-8 md:p-12 sticky top-24 min-h-[400px] md:min-h-[450px] flex items-center`}
              style={{ zIndex: i + 1 }}
            >
              <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center w-full">
                <div>
                  <span
                    className="block text-[48px] font-medium text-white/15 mb-4"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {step.number}
                  </span>
                  <h3
                    className="text-[clamp(36px,5vw,52px)] leading-[1.05] text-[#E8E6E1] lowercase mb-4"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, fontStyle: 'italic' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-[1.7] text-white/60 max-w-md">
                    {step.copy}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <step.Visual />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
