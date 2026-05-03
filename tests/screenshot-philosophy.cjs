// Targeted screenshot of the rf-philosophy block (now HTML, not an <img>)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321/blog/revenue-management-for-short-term-rentals', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);

  const targets = [
    ['rf-philosophy', '.rf-philosophy'],
    ['rf-leaks', '.rf-leaks'],
    ['rf-takeaways', '.rf-takeaways'],
    ['drop-cap-area', '.prose-rf > p:first-of-type'],
    ['quote-em', 'blockquote'],
  ];
  for (const [name, sel] of targets) {
    try {
      const el = p.locator(sel).first();
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await p.waitForTimeout(300);
        await el.screenshot({ path: `/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts/blog-1/v2-${name}.png` });
        console.log(`saved v2-${name}.png`);
      } else {
        console.log(`(no match: ${sel})`);
      }
    } catch (e) {
      console.log(`(error ${name}: ${e.message})`);
    }
  }
  await b.close();
})();
