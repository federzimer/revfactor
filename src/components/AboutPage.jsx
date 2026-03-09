import { useEffect, useRef, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { geoAlbersUsa, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import us from 'us-atlas/states-10m.json';
import { MAP_MARKERS, ACTIVE_STATES } from '../data/mapData';
import Footer from './Footer';

// ─── Constants ─────────────────────────────────────────────

const ACTIVE_SET = new Set(ACTIVE_STATES);
const SORTED_MARKERS = [...MAP_MARKERS].sort((a, b) => b.count - a.count);

const STATS = [
  { value: '165+', label: 'PROPERTIES' },
  { value: '24', label: 'STATES' },
  { value: '56', label: 'MARKETS' },
];

// ─── Map Tooltip (desktop — HTML portal) ───────────────────

function MapTooltip({ marker, position }) {
  if (!marker) return null;

  const flipX = position.x > window.innerWidth - 240;

  return createPortal(
    <div
      className="fixed z-[9990] pointer-events-none"
      style={{
        left: flipX ? position.x - 8 : position.x,
        top: position.y - 12,
        transform: flipX
          ? 'translate(-100%, -100%)'
          : 'translate(-50%, -100%)',
        opacity: 1,
        transition: 'opacity 150ms ease',
      }}
    >
      <div className="bg-[#161910] border border-[#C8C4BC]/20 rounded-[12px] px-4 py-3 shadow-[0_8px_32px_rgba(22,25,16,0.4)] max-w-[240px]">
        <p
          className="text-[14px] text-[#E8E6E1] mb-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
        >
          {marker.label}
        </p>
        <p className="font-bold uppercase text-[8px] tracking-[2px] text-[#7A8B76]">
          {marker.state}
        </p>
      </div>
      {!flipX && (
        <div className="w-0 h-0 mx-auto border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#161910]" />
      )}
    </div>,
    document.body
  );
}

// ─── Mobile Info Bar ───────────────────────────────────────

function MobileInfoBar({ marker, onClose }) {
  if (!marker) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9990] bg-[#161910] border-t border-[#E8E6E1]/10 px-5 py-4"
      style={{ animation: 'slide-up 0.3s ease-out' }}
    >
      <div className="flex items-start justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex-1 min-w-0">
          <p
            className="text-[16px] text-[#E8E6E1] mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}
          >
            {marker.label}
          </p>
          <p className="font-bold uppercase text-[8px] tracking-[2px] text-[#7A8B76]">
            {marker.state}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-[#8F6E62] hover:text-[#E8E6E1] p-1.5 transition-colors duration-200 shrink-0"
          aria-label="Close info bar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── US Map ────────────────────────────────────────────────

function USMap({ onMarkerHover, onMarkerLeave, onMarkerTap, isMobile }) {
  const mapRef = useRef(null);

  const { statePaths, markerPositions } = useMemo(() => {
    const projection = geoAlbersUsa().scale(1280).translate([480, 300]);
    const pathGen = geoPath(projection);
    const statesGeo = feature(us, us.objects.states);

    const paths = statesGeo.features.map((f) => ({
      id: f.id,
      name: f.properties.name,
      d: pathGen(f),
      isActive: ACTIVE_SET.has(f.properties.name),
    }));

    const positions = SORTED_MARKERS
      .map((marker) => {
        const projected = projection([marker.lng, marker.lat]);
        if (!projected) return null;
        return {
          ...marker,
          x: projected[0],
          y: projected[1],
          r: 4 + Math.sqrt(marker.count) * 2.5,
        };
      })
      .filter(Boolean);

    return { statePaths: paths, markerPositions: positions };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.4 });

      tl.fromTo(
        '.map-state-active',
        { opacity: 0 },
        { opacity: 1, duration: 0.5, stagger: 0.02, ease: 'power2.out' }
      );

      tl.fromTo(
        '.map-marker',
        { scale: 0, opacity: 0, transformOrigin: 'center center' },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          stagger: 0.03,
          ease: 'back.out(1.4)',
        },
        '-=0.3'
      );
    }, mapRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={mapRef}
      viewBox="0 0 960 600"
      role="img"
      aria-label="Interactive map of the United States showing RevFactor market coverage across 24 states and 56 markets"
      className="w-full h-auto"
      style={{ maxWidth: '1200px', margin: '0 auto', display: 'block' }}
    >
      <title>RevFactor US Market Coverage Map</title>
      <desc>
        An interactive map highlighting 24 active states and 56 market locations
        where RevFactor manages short-term rental properties.
      </desc>

      {/* State shapes */}
      <g>
        {statePaths.map((state) => (
          <path
            key={state.id}
            d={state.d}
            fill={state.isActive ? 'rgba(93,109,89,0.08)' : 'transparent'}
            stroke="rgba(143,110,98,0.3)"
            strokeWidth="0.5"
            strokeLinejoin="round"
            className={`transition-[fill] duration-200 ${state.isActive ? 'map-state-active' : ''}`}
            onMouseEnter={
              state.isActive
                ? (e) => { e.currentTarget.style.fill = 'rgba(93,109,89,0.15)'; }
                : undefined
            }
            onMouseLeave={
              state.isActive
                ? (e) => { e.currentTarget.style.fill = 'rgba(93,109,89,0.08)'; }
                : undefined
            }
          />
        ))}
      </g>

      {/* Market markers */}
      <g>
        {markerPositions.map((marker) => (
          <g key={marker.label} className="map-marker" style={{ cursor: 'pointer' }}>
            <circle
              cx={marker.x}
              cy={marker.y}
              r={marker.r}
              fill="rgba(19,52,45,0.7)"
              stroke="rgba(19,52,45,1)"
              strokeWidth="1"
              className="transition-all duration-200 hover:fill-[#13342D] hover:scale-[1.15]"
              style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}
              tabIndex={0}
              role="button"
              aria-label={`${marker.label}, ${marker.state}`}
              onMouseEnter={
                !isMobile
                  ? (e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      onMarkerHover(marker, {
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      });
                    }
                  : undefined
              }
              onMouseLeave={!isMobile ? onMarkerLeave : undefined}
              onClick={isMobile ? () => onMarkerTap(marker) : undefined}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onMarkerTap(marker);
                }
              }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

// ─── Main About Page ───────────────────────────────────────

export default function AboutPage() {
  const pageRef = useRef(null);
  const [tooltipMarker, setTooltipMarker] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [mobileMarker, setMobileMarker] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-animate',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          delay: 0.2,
        }
      );
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-[#161910] flex flex-col">
      {/* Minimal Nav */}
      <nav
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-2.5 rounded-full flex items-center gap-1 bg-[#161910]/60 backdrop-blur-[12px] border border-[#E8E6E1]/10 shadow-[0_4px_24px_rgba(22,25,16,0.2)]"
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <Link
          to="/"
          className="text-[22px] font-normal tracking-[0.5px] px-3 text-[#E8E6E1] transition-colors duration-[350ms]"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          revfactor
        </Link>
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-2 ml-2 px-5 py-2 bg-[#13342D] text-[#E8E6E1] font-bold uppercase text-[9px] tracking-[2px] rounded-full relative overflow-hidden group transition-transform duration-[200ms] hover:scale-[1.02]"
          style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        >
          <span
            className="absolute inset-0 bg-[#1E4A40] translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms]"
            style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
          />
          <ArrowLeft className="relative z-10 w-3 h-3" />
          <span className="relative z-10">back to home</span>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {/* Copy Block */}
        <section className="pt-32 md:pt-40 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
            <span className="about-animate opacity-0 inline-block px-3 py-1.5 rounded-full bg-[#5D6D59]/10 text-[#5D6D59] font-bold uppercase text-[9px] tracking-[2.5px] mb-5">
              WHERE WE OPERATE
            </span>

            <h1
              className="about-animate opacity-0 text-[clamp(32px,6vw,56px)] leading-[1.1] text-[#E8E6E1] mb-6"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 400, letterSpacing: '0.5px' }}
            >
              Revenue management{' '}
              <em
                className="not-italic"
                style={{ fontStyle: 'italic', color: '#7A8B76' }}
              >
                across the nation
              </em>
            </h1>

            <p className="about-animate opacity-0 text-[15px] leading-[1.7] text-[#8F6E62] max-w-xl mx-auto mb-12 md:mb-16">
              We optimize pricing for 165+ properties across 24 states — from mountain
              cabins in the Smokies to beachfront condos on the Carolina coast.
            </p>

            {/* Stat Badges */}
            <div className="about-animate opacity-0 flex flex-wrap justify-center gap-4 md:gap-6 mb-16 md:mb-20">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center gap-1.5 px-6 py-4 rounded-[16px] bg-[#E8E6E1]/5 border border-[#E8E6E1]/10"
                >
                  <span
                    className="text-[28px] font-medium text-[#E8E6E1]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {stat.value}
                  </span>
                  <span className="font-bold uppercase text-[8px] tracking-[2.5px] text-[#8F6E62]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interactive Map */}
        <section className="pb-12 md:pb-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="about-animate opacity-0">
              <USMap
                onMarkerHover={(marker, pos) => {
                  setTooltipMarker(marker);
                  setTooltipPos(pos);
                }}
                onMarkerLeave={() => setTooltipMarker(null)}
                onMarkerTap={(marker) => {
                  setMobileMarker(marker);
                  setTooltipMarker(null);
                }}
                isMobile={isMobile}
              />
            </div>

          </div>
        </section>
      </main>

      <Footer />

      {/* Tooltip (desktop) */}
      {!isMobile && <MapTooltip marker={tooltipMarker} position={tooltipPos} />}

      {/* Mobile Info Bar */}
      {isMobile && <MobileInfoBar marker={mobileMarker} onClose={() => setMobileMarker(null)} />}
    </div>
  );
}
