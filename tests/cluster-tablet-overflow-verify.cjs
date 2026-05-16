// Verify table-overflow fix at 768 against local build for the 2 listicles.
const { chromium } = require('playwright');

const URLS = [
  'http://localhost:4399/blog/best-airbnb-property-managers-with-dynamic-pricing-2026/',
  'http://localhost:4399/blog/best-str-revenue-management-companies-2026/',
];

(async () => {
  const browser = await chromium.launch();
  for (const url of URLS) {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({
      docW: document.documentElement.clientWidth,
      scrollW: document.documentElement.scrollWidth,
      tableWidths: Array.from(document.querySelectorAll('.prose-rf table')).map(t => ({
        w: t.getBoundingClientRect().width,
        scrollW: t.scrollWidth,
        display: getComputedStyle(t).display,
        overflowX: getComputedStyle(t).overflowX,
      })),
    }));
    console.log(url);
    console.log(`  docW=${r.docW}, scrollW=${r.scrollW}, pageOverflow=${r.scrollW > r.docW + 1 ? '❌' : '✅'}`);
    r.tableWidths.forEach((t, i) => console.log(`  table[${i}] w=${Math.round(t.w)} scrollW=${t.scrollW} display=${t.display} overflow=${t.overflowX}`));
    await ctx.close();
  }
  await browser.close();
})();
