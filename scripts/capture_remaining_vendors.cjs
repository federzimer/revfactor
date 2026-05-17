// Recapture the 3 vendors that failed the first run, after re-discovering
// their actual domains.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SHOT_DIR = path.join(ROOT, 'public/photos/blog/vendor-screenshots');

const VENDORS = [
  { slug: 'roami',    url: 'https://roami.com' },
  { slug: 'revparty', url: 'https://revparty.com' },
  { slug: 'rented',   url: 'https://rented.com' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  });
  for (const v of VENDORS) {
    const out = path.join(SHOT_DIR, `${v.slug}.png`);
    const page = await ctx.newPage();
    try {
      await page.goto(v.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      // dismiss consent
      for (const sel of ['button:has-text("Accept")', 'button:has-text("Got it")', 'button:has-text("OK")', '#onetrust-accept-btn-handler']) {
        try { const b = page.locator(sel).first(); if (await b.count() > 0) { await b.click({ timeout: 1500 }); await page.waitForTimeout(500); break; } } catch {}
      }
      await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1280, height: 750 }, type: 'png' });
      console.log(`  ✓ ${v.slug} ← ${v.url}`);
      for (const w of [1200, 600]) {
        const webp = path.join(SHOT_DIR, `${v.slug}-${w}.webp`);
        execSync(`cwebp -q 82 -resize ${w} 0 "${out}" -o "${webp}"`, { stdio: 'pipe' });
        console.log(`    → ${v.slug}-${w}.webp`);
      }
    } catch (e) {
      console.log(`  ✗ ${v.slug}: ${e.message.slice(0,80)}`);
    } finally {
      await page.close();
    }
  }
  await ctx.close();
  await browser.close();
})();
