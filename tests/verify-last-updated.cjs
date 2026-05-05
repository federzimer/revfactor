const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  // Wait for the Vercel security challenge to redirect us through
  await page.goto('https://www.revfactor.io/blog/revenue-management-for-short-term-rentals/', {
    waitUntil: 'load',
    timeout: 60000,
  });
  // If we land on the security checkpoint, wait for the auto-redirect
  let title = await page.title();
  if (title.includes('Vercel Security')) {
    console.log('Vercel challenge encountered, waiting for auto-redirect...');
    try {
      await page.waitForFunction(() => !document.title.includes('Vercel Security'), { timeout: 20000 });
    } catch {}
    title = await page.title();
  }
  console.log(`final title: ${title}`);

  // Now look for Last Updated
  const html = await page.content();
  const lastUpdated = (html.match(/Last Updated/g) || []).length;
  console.log(`Last Updated occurrences: ${lastUpdated}`);
  const m = html.match(/Last Updated[^A-Za-z0-9]*<\/div>\s*<div[^>]*>([^<]+)/);
  if (m) console.log(`Last Updated date: ${m[1].trim()}`);

  // Snapshot the meta strip
  await page.screenshot({ path: 'tests/_artifacts/blog1-qa/last-updated-verify.png', fullPage: false });
  await browser.close();
})();
