// Pull market summaries for ~12 US STR archetypes so I can decide which
// markets and metrics to feature in the journal-index ticker.
const fs = require('fs');
const path = require('path');

const KEY = '7MbvQHvzOK4fhF5IT02B10VesLaBLND7E3JM93Ld';

const MARKETS = [
  { country: 'United States', region: 'Tennessee',     locality: 'Gatlinburg' },
  { country: 'United States', region: 'Tennessee',     locality: 'Pigeon Forge' },
  { country: 'United States', region: 'Georgia',       locality: 'Blue Ridge' },
  { country: 'United States', region: 'Oklahoma',      locality: 'Broken Bow' },
  { country: 'United States', region: 'California',    locality: 'Big Bear Lake' },
  { country: 'United States', region: 'California',    locality: 'Joshua Tree' },
  { country: 'United States', region: 'Florida',       locality: 'Destin' },
  { country: 'United States', region: 'South Carolina',locality: 'Hilton Head Island' },
  { country: 'United States', region: 'Utah',          locality: 'Park City' },
  { country: 'United States', region: 'North Carolina',locality: 'Asheville' },
  { country: 'United States', region: 'New York',      locality: 'Hudson' },
  { country: 'United States', region: 'Texas',         locality: 'Fredericksburg' },
];

(async () => {
  const out = [];
  for (const m of MARKETS) {
    const res = await fetch('https://api.airroi.com/markets/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
      body: JSON.stringify({ market: m }),
    });
    const data = await res.json();
    if (data.errors) {
      console.log(`${m.locality}: ERROR — ${data.errors.join('; ')}`);
      out.push({ ...m, error: data.errors });
      continue;
    }
    const row = {
      ...m,
      adr: Math.round(data.average_daily_rate),
      occupancy: Math.round(data.occupancy * 100),
      revpar: Math.round(data.rev_par),
      revenue_annual: Math.round((data.revenue || 0) * 12),
      listings: Math.round(data.active_listings_count),
      lead_time_days: Math.round(data.booking_lead_time || 0),
      avg_los: Math.round((data.length_of_stay || 0) * 10) / 10,
    };
    out.push(row);
    console.log(`${m.locality}, ${m.region}: ADR $${row.adr} · occ ${row.occupancy}% · RevPAR $${row.revpar} · ${row.listings} listings`);
  }
  const outPath = path.join(__dirname, '../tests/_artifacts/airroi-markets-2026-05-16.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${outPath}`);
})();
