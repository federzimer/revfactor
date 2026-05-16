// Capture journal index at desktop/tablet/mobile widths so I can self-review
// the masonry silhouette before pushing.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:4399/blog/';
const OUT = path.resolve(__dirname, '_artifacts/masonry-2026-05-16');
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'desktop-1440', w: 1440, h: 900 },
  { name: 'desktop-1280', w: 1280, h: 900 },
  { name: 'tablet-900',   w: 900,  h: 1200 },
  { name: 'tablet-768',   w: 768,  h: 1024 },
  { name: 'mobile-390',   w: 390,  h: 844 },
];

(async () => {
  const browser = await chromium.launch();
  for (const s of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const ssPath = path.join(OUT, `index__${s.name}.png`);
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log(`[${s.name}] ${ssPath}`);

    // Also capture the masonry section only — easier visual diff
    const grid = await page.locator('.masonry-grid').first();
    if (await grid.count() > 0) {
      await grid.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const gPath = path.join(OUT, `masonry__${s.name}.png`);
      await grid.screenshot({ path: gPath });
      console.log(`   masonry-only: ${gPath}`);
    }
    await ctx.close();
  }
  await browser.close();
})();
