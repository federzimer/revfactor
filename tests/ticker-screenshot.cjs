// Capture the new compact markets ticker at desktop + mobile.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:4399/blog/';
const OUT = path.resolve(__dirname, '_artifacts/ticker-2026-05-16');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'desktop-1440', w: 1440, h: 200 },
  { name: 'mobile-390',   w: 390,  h: 200 },
];

(async () => {
  const browser = await chromium.launch();
  for (const s of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    // Disable animation for a clean screenshot
    await page.addStyleTag({ content: '.rf-ticker-track { animation: none !important; }' });
    const ticker = await page.locator('.rf-stats-ticker').first();
    await ticker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const ssPath = path.join(OUT, `ticker__${s.name}.png`);
    await ticker.screenshot({ path: ssPath });
    console.log(`[${s.name}] ${ssPath}`);

    // Also full-page top capture for context (hero + ticker + featured)
    const ctx2Path = path.join(OUT, `top__${s.name}.png`);
    await page.screenshot({ path: ctx2Path, clip: { x: 0, y: 0, width: s.w, height: Math.min(900, 1200) } });
    console.log(`   context: ${ctx2Path}`);
    await ctx.close();
  }
  await browser.close();
})();
