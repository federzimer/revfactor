/**
 * Scrape median hotel nightly rate per FIFA host city for one match night and
 * for a non-match control night. Output JSON.
 *
 * Approach: Booking.com search results — we capture the price-per-night
 * field across the first page of results and take the median.
 */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'raw', 'hotel_rates.json');

// One representative match night per city + one pre-tournament control night.
// Match night = first big match in that city. Control = same weekday a month prior.
const CITIES = [
  { key: 'atlanta',       q: 'Atlanta',       match: '2026-06-15', control: '2026-05-15' },
  { key: 'boston',        q: 'Boston',        match: '2026-06-13', control: '2026-05-13' },
  { key: 'dallas',        q: 'Dallas',        match: '2026-06-14', control: '2026-05-14' },
  { key: 'houston',       q: 'Houston',       match: '2026-06-14', control: '2026-05-14' },
  { key: 'kansas_city',   q: 'Kansas+City',   match: '2026-06-16', control: '2026-05-16' },
  { key: 'los_angeles',   q: 'Los+Angeles',   match: '2026-06-12', control: '2026-05-12' },
  { key: 'miami',         q: 'Miami',         match: '2026-06-15', control: '2026-05-15' },
  { key: 'new_york',      q: 'New+York',      match: '2026-06-13', control: '2026-05-13' },
  { key: 'philadelphia',  q: 'Philadelphia',  match: '2026-06-14', control: '2026-05-14' },
  { key: 'san_francisco', q: 'San+Francisco', match: '2026-06-13', control: '2026-05-13' },
  { key: 'seattle',       q: 'Seattle',       match: '2026-06-15', control: '2026-05-15' },
];

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function getMedianRate(page, q, date) {
  const checkout = addDays(date, 1);
  const url = `https://www.booking.com/searchresults.html?ss=${q}&checkin=${date}&checkout=${checkout}&group_adults=2&no_rooms=1&group_children=0`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try { await page.waitForSelector('[data-testid="property-card"]', { timeout: 20000 }); } catch {}
  await page.waitForTimeout(2500);
  // Capture ALL visible price strings, filter to numeric dollar values
  const rates = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-testid="price-and-discounted-price"], [data-testid="price"]');
    const out = [];
    nodes.forEach(n => {
      const t = (n.innerText || '').replace(/,/g, '');
      const m = t.match(/\$\s?(\d{2,5})/);
      if (m) out.push(Number(m[1]));
    });
    return out;
  });
  if (!rates.length) return null;
  rates.sort((a, b) => a - b);
  const median = rates[Math.floor(rates.length / 2)];
  const mean = Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  return { n: rates.length, min: rates[0], median, mean, max: rates[rates.length - 1], raw: rates };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36',
    locale: 'en-US',
    viewport: { width: 1400, height: 900 },
  });
  const page = await ctx.newPage();

  const out = {};
  for (const c of CITIES) {
    console.log(`[${c.key}] match night ${c.match}...`);
    const match = await getMedianRate(page, c.q, c.match).catch(e => ({ error: String(e) }));
    console.log(`  match:`, match && match.median ? `$${match.median} (n=${match.n})` : match);
    await page.waitForTimeout(1500);
    console.log(`[${c.key}] control night ${c.control}...`);
    const ctrl = await getMedianRate(page, c.q, c.control).catch(e => ({ error: String(e) }));
    console.log(`  control:`, ctrl && ctrl.median ? `$${ctrl.median} (n=${ctrl.n})` : ctrl);
    out[c.key] = { city: c.q.replace('+', ' '), match_date: c.match, control_date: c.control, match, control: ctrl };
    fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
    await page.waitForTimeout(2000);
  }

  await browser.close();
  console.log(`\nWrote ${OUT}`);
})();
