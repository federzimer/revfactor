// Capture vendor logos (via Clearbit free logo API) + homepage screenshots
// (via Playwright) for the journal listicles. Idempotent — skips files that
// already exist.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const LOGO_DIR = path.join(ROOT, 'public/photos/blog/vendor-logos');
const SHOT_DIR = path.join(ROOT, 'public/photos/blog/vendor-screenshots');
fs.mkdirSync(LOGO_DIR, { recursive: true });
fs.mkdirSync(SHOT_DIR, { recursive: true });

const VENDORS = [
  // PM listicle
  { slug: 'vacasa',         domain: 'vacasa.com',         url: 'https://www.vacasa.com' },
  { slug: 'avantstay',      domain: 'avantstay.com',      url: 'https://www.avantstay.com' },
  { slug: 'evolve',         domain: 'evolve.com',         url: 'https://evolve.com' },
  { slug: 'awning',         domain: 'awning.com',         url: 'https://awning.com' },
  { slug: 'itrip',          domain: 'itrip.net',          url: 'https://www.itrip.net' },
  { slug: 'roami',          domain: 'roami.co',           url: 'https://www.roami.co' },
  // STR RM cos listicle
  { slug: 'pacer',          domain: 'pacerrev.com',       url: 'https://www.pacerrev.com' },
  { slug: 'revparty',       domain: 'revpartyconsulting.com', url: 'https://www.revpartyconsulting.com' },
  { slug: 'str-consulting', domain: 'strconsulting.io',   url: 'https://strconsulting.io' },
  { slug: 'hostlyft',       domain: 'hostlyft.com',       url: 'https://hostlyft.com' },
  { slug: 'pricing-by-mira', domain: 'pricingbymira.com', url: 'https://pricingbymira.com' },
  { slug: 'rented',         domain: 'rented.com',         url: 'https://www.rented.com' },
  { slug: 'dosbnb',         domain: 'dosbnb.com',         url: 'https://dosbnb.com' },
  { slug: 'beyond-pricing', domain: 'beyondpricing.com',  url: 'https://www.beyondpricing.com' },
  { slug: 'maverick-str',   domain: 'maverickstr.co',     url: 'https://maverickstr.co' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(true)));
      } else if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        file.close();
        download(res.headers.location, dest).then(resolve, reject);
      } else {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        resolve(false);
      }
    }).on('error', (e) => { file.close(); try { fs.unlinkSync(dest); } catch {}; reject(e); });
  });
}

(async () => {
  // 1. Logos via Clearbit
  console.log('=== Logos (Clearbit) ===');
  for (const v of VENDORS) {
    const out = path.join(LOGO_DIR, `${v.slug}.png`);
    if (fs.existsSync(out)) { console.log(`  ✓ ${v.slug} (cached)`); continue; }
    const url = `https://logo.clearbit.com/${v.domain}?size=256&format=png`;
    try {
      const ok = await download(url, out);
      console.log(`  ${ok ? '✓' : '✗'} ${v.slug} ← ${url}`);
    } catch (e) {
      console.log(`  ✗ ${v.slug}: ${e.message}`);
    }
  }

  // 2. Homepage screenshots via Playwright
  console.log('\n=== Homepage screenshots ===');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  });

  for (const v of VENDORS) {
    const out = path.join(SHOT_DIR, `${v.slug}.png`);
    if (fs.existsSync(out)) { console.log(`  ✓ ${v.slug} (cached)`); continue; }
    const page = await ctx.newPage();
    try {
      await page.goto(v.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2500); // hydrate + LCP
      // dismiss common cookie/consent
      const dismissSel = ['button:has-text("Accept")', 'button:has-text("Got it")', 'button:has-text("OK")', 'button:has-text("Agree")', '#onetrust-accept-btn-handler'];
      for (const sel of dismissSel) {
        try { const b = page.locator(sel).first(); if (await b.count() > 0) { await b.click({ timeout: 1500 }); await page.waitForTimeout(500); break; } } catch {}
      }
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 750 }, type: 'png' });
      console.log(`  ✓ ${v.slug} ← ${v.url}`);
    } catch (e) {
      console.log(`  ✗ ${v.slug}: ${e.message.slice(0,80)}`);
    } finally {
      await page.close();
    }
  }
  await ctx.close();
  await browser.close();

  // 3. Convert PNGs → webp at 1200/600 for responsive serving
  console.log('\n=== Encode to WebP (1200 + 600) ===');
  const { execSync } = require('child_process');
  for (const v of VENDORS) {
    const png = path.join(SHOT_DIR, `${v.slug}.png`);
    if (!fs.existsSync(png)) continue;
    for (const w of [1200, 600]) {
      const out = path.join(SHOT_DIR, `${v.slug}-${w}.webp`);
      if (fs.existsSync(out)) continue;
      try {
        execSync(`cwebp -q 82 -resize ${w} 0 "${png}" -o "${out}"`, { stdio: 'pipe' });
        console.log(`  ✓ ${v.slug}-${w}.webp`);
      } catch (e) { console.log(`  ✗ ${v.slug}-${w}: ${e.message.slice(0,60)}`); }
    }
  }
  console.log('\nDone.');
})();
