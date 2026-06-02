import { useMemo, useState } from 'react';

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function RevPARCalculator() {
  const [revenue, setRevenue] = useState('18000');
  const [bookedNights, setBookedNights] = useState('60');
  const [availableNights, setAvailableNights] = useState('90');

  const metrics = useMemo(() => {
    const total = Number(revenue) || 0;
    const booked = Number(bookedNights) || 0;
    const available = Number(availableNights) || 0;
    const adr = booked > 0 ? total / booked : 0;
    const occupancy = available > 0 ? booked / available : 0;
    const revpar = available > 0 ? total / available : 0;
    return { adr, occupancy, revpar };
  }, [availableNights, bookedNights, revenue]);

  const fields = [
    ['Total revenue', revenue, setRevenue],
    ['Booked nights', bookedNights, setBookedNights],
    ['Available nights', availableNights, setAvailableNights],
  ];

  return (
    <section className="my-10 rounded-[16px] border border-[#C8C4BC]/60 bg-[#E8E6E1] p-5 md:p-7">
      <div className="grid gap-4 md:grid-cols-3">
        {fields.map(([label, value, setter]) => (
          <label key={label} className="grid gap-2 text-[10px] font-bold uppercase tracking-[2px] text-[#76574C]">
            {label}
            <input
              value={value}
              onChange={(event) => setter(event.target.value)}
              inputMode="decimal"
              className="min-h-11 rounded-[8px] border border-[#C8C4BC] bg-white/70 px-3 text-[15px] font-normal normal-case tracking-normal text-[#3F261F] outline-none focus:border-[#13342D]/50"
            />
          </label>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-[12px] bg-white/60 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-[#8F6E62]">ADR</div>
          <div className="mt-2 text-[28px] text-[#13342D]" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            {currency(metrics.adr)}
          </div>
        </div>
        <div className="rounded-[12px] bg-white/60 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-[#8F6E62]">Occupancy</div>
          <div className="mt-2 text-[28px] text-[#13342D]" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            {Math.round(metrics.occupancy * 100)}%
          </div>
        </div>
        <div className="rounded-[12px] bg-[#13342D] p-4 text-[#E8E6E1]">
          <div className="text-[10px] font-bold uppercase tracking-[2px] text-[#A8BBA3]">RevPAR</div>
          <div className="mt-2 text-[28px]" style={{ fontFamily: "'Cormorant Garamond',Georgia,serif" }}>
            {currency(metrics.revpar)}
          </div>
        </div>
      </div>
    </section>
  );
}
