// Quick visual-QA screenshotter for the new Blog 1 staging.
// Captures: full page, plus per-section crops at the spots where the
// custom MDX components (hero, quick-answer, key-stats, takeaways,
// figures, author bio, FAQ) live.

const { chromium } = require('playwright');
const path = require('path');

const URL = process.env.URL || 'http://localhost:4321/blog/revenue-management-for-short-term-rentals';
const OUT = path.resolve(__dirname, '_artifacts/blog-1');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  console.log(`Loading ${URL}…`);
  const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`HTTP ${resp.status()}`);

  // Wait for fonts + images
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);

  // Full-page screenshot
  const fullPath = `${OUT}/01-full-page.png`;
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`Saved ${fullPath}`);

  // Above-the-fold (hero region)
  const aboveFoldPath = `${OUT}/02-above-fold.png`;
  await page.screenshot({ path: aboveFoldPath, fullPage: false });
  console.log(`Saved ${aboveFoldPath}`);

  // Section captures by selector
  const sections = [
    ['quick-answer', '.rf-quick-answer'],
    ['key-stats', '.rf-key-stats'],
    ['takeaways', '.rf-takeaways'],
    ['seven-leaks-figure', 'img[alt*="seven leaks" i]'],
    ['strategic-philosophy-figure', 'img[alt*="strategic philosophy" i]'],
    ['revpar-figure', 'img[alt*="revpar wins" i], img[alt*="property a vs property b" i]'],
    ['tactical-plays-figure', 'img[alt*="tactical plays" i]'],
    ['author-bio', '.rf-author-bio'],
  ];

  for (const [name, sel] of sections) {
    try {
      const el = await page.locator(sel).first();
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const out = `${OUT}/section-${name}.png`;
        await el.screenshot({ path: out });
        console.log(`Saved ${out}`);
      } else {
        console.log(`(no match for ${name}: ${sel})`);
      }
    } catch (e) {
      console.log(`(error on ${name}: ${e.message})`);
    }
  }

  // FAQ region — find the Frequently Asked Questions h2
  try {
    const faqH2 = page.locator('h2', { hasText: /frequently asked questions/i }).first();
    if (await faqH2.count() > 0) {
      await faqH2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/section-faq.png`, fullPage: false });
      console.log('Saved section-faq.png');
    }
  } catch (e) {
    console.log('FAQ scrollshot error:', e.message);
  }

  // Mobile capture
  await ctx.close();
  const mobile = await browser.newContext({ viewport: { width: 414, height: 896 }, deviceScaleFactor: 2 });
  const mp = await mobile.newPage();
  await mp.goto(URL, { waitUntil: 'networkidle' });
  await mp.evaluate(() => document.fonts.ready);
  await mp.waitForTimeout(500);
  await mp.screenshot({ path: `${OUT}/03-mobile-full.png`, fullPage: true });
  console.log('Saved 03-mobile-full.png');

  await browser.close();
})();
