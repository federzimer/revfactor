const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321/blog/revenue-management-for-short-term-rentals', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  // Scroll to the hero figure
  const hero = await p.locator('.rf-hero img').first();
  await hero.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts/blog-1/section-hero.png' });
  // FAQ
  const faqH2 = p.locator('h2', { hasText: /frequently asked questions/i }).first();
  await faqH2.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.screenshot({ path: '/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts/blog-1/section-faq.png' });
  await b.close();
})();
