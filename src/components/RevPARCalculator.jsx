import { useState, useMemo, useRef } from 'react';

const fmtUSD = (n) => (Number.isFinite(n) ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : 'N/A');
const fmtPct = (n) => (Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : 'N/A');

export default function RevPARCalculator({ defaultRevenue = 36000, defaultBooked = 60, defaultAvailable = 90, defaultCost = 8400 }) {
  const [revenue, setRevenue] = useState(defaultRevenue);
  const [booked, setBooked] = useState(defaultBooked);
  const [available, setAvailable] = useState(defaultAvailable);
  const [cost, setCost] = useState(defaultCost);

  // One engagement event per mount, on the first edit of any input.
  const engagedRef = useRef(false);
  const markEngaged = () => {
    if (engagedRef.current) return;
    engagedRef.current = true;
    window.rfTrack?.('calculator-engaged', { calculator: 'revpar', page: location.pathname });
  };

  const metrics = useMemo(() => {
    const rev = Number(revenue) || 0;
    const b = Number(booked) || 0;
    const a = Number(available) || 0;
    const c = Number(cost) || 0;
    const adr = b > 0 ? rev / b : NaN;
    const occ = a > 0 ? b / a : NaN;
    const revpar = a > 0 ? rev / a : NaN;
    const goppar = a > 0 ? (rev - c) / a : NaN;
    const gop = rev - c;
    return { adr, occ, revpar, goppar, gop };
  }, [revenue, booked, available, cost]);

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #C8C4BC',
    borderRadius: '8px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '15px',
    color: '#3F261F',
    background: '#FAFAF7',
    outline: 'none',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: '#5D6D59',
    marginBottom: '6px',
  };

  const metricCard = (label, value, sub) => (
    <div style={{ flex: '1 1 140px', padding: '16px', background: '#13342D', color: '#E8E6E1', borderRadius: '12px', minWidth: 0 }}>
      <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#A9BBA3', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '24px', fontWeight: 500, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#A9BBA3', marginTop: '4px' }}>{sub}</div>}
    </div>
  );

  return (
    <div className="rf-revpar-calculator" style={{ margin: '1.75rem 0', padding: '1.75rem', border: '1px solid #C8C4BC', background: '#E8E6E1', borderRadius: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div>
          <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#5D6D59' }}>Try it on your numbers</div>
          <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '26px', color: '#3F261F', lineHeight: 1.1, marginTop: '2px' }}>RevPAR · ADR · Occupancy · GOPPAR</div>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', color: '#76574C', letterSpacing: '0.5px' }}>NO LOGIN · NO EMAIL · RUNS LOCALLY</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle} htmlFor="rev-rev">Total revenue ($)</label>
          <input id="rev-rev" type="number" min="0" step="100" value={revenue} onChange={(e) => { markEngaged(); setRevenue(e.target.value); }} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rev-booked">Booked nights</label>
          <input id="rev-booked" type="number" min="0" step="1" value={booked} onChange={(e) => { markEngaged(); setBooked(e.target.value); }} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rev-available">Available nights</label>
          <input id="rev-available" type="number" min="0" step="1" value={available} onChange={(e) => { markEngaged(); setAvailable(e.target.value); }} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="rev-cost" title="Cleaning + supplies + channel commission + dynamic pricing fees over the same period">Operating cost ($)</label>
          <input id="rev-cost" type="number" min="0" step="50" value={cost} onChange={(e) => { markEngaged(); setCost(e.target.value); }} style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {metricCard('ADR', fmtUSD(metrics.adr), 'revenue ÷ booked nights')}
        {metricCard('Occupancy', fmtPct(metrics.occ), 'booked ÷ available')}
        {metricCard('RevPAR', fmtUSD(metrics.revpar), 'revenue ÷ available nights')}
        {metricCard('GOPPAR', fmtUSD(metrics.goppar), `gross op profit ${fmtUSD(metrics.gop)} ÷ available`)}
      </div>

      <p style={{ fontSize: '13px', color: '#76574C', lineHeight: 1.6, marginTop: '14px', marginBottom: 0 }}>
        ADR is what you charged on booked nights. RevPAR averages revenue across every night you had to sell, which is the metric that maps to actual revenue. GOPPAR subtracts operating cost (cleaning, supplies, channel commission, pricing fees) and reflects what reaches the owner.
      </p>
    </div>
  );
}
