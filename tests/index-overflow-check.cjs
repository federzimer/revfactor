const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  for (const v of [{ w: 1440, n: 'desktop' }, { w: 768, n: 'tablet' }, { w: 390, n: 'mobile' }]) {
    const ctx = await browser.newContext({ viewport: { width: v.w, height: 900 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://localhost:4399/blog/', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({
      docW: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
    }));
    console.log(`[${v.n} ${v.w}] docW=${r.docW} scrollW=${r.scrollW} overflow=${r.scrollW > r.docW + 1 ? '❌' : '✅'} consoleErrors=${errs.length}`);
    await ctx.close();
  }
  await browser.close();
})();
