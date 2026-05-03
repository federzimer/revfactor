const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321/blog/revenue-management-for-short-term-rentals', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  // Capture both first and second body paragraphs together (after key stats / takeaways)
  const target = await p.locator('.prose-rf > p:first-of-type').first();
  await target.scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  // grab a region: first paragraph + the next two paragraphs
  const box = await target.boundingBox();
  await p.screenshot({
    path: '/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts/blog-1/v2-first-paras.png',
    clip: { x: Math.max(0, box.x - 20), y: Math.max(0, box.y - 20), width: Math.min(900, 1440 - Math.max(0, box.x - 20)), height: 320 }
  });
  console.log('saved v2-first-paras.png');
  await b.close();
})();
