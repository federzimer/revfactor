const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ ...devices['iPhone SE'] });
  const p = await ctx.newPage();
  await p.goto('https://www.revfactor.io/short-term-rental-consultant', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);

  // Scroll to schedule
  await p.locator('#schedule').scrollIntoViewIfNeeded();
  await p.waitForTimeout(2500);

  // Inspect sticky bar state
  const stickyBar = p.locator('.fixed.bottom-0').first();
  const transform = await stickyBar.evaluate(el => getComputedStyle(el).transform);
  const ariaHidden = await stickyBar.getAttribute('aria-hidden');
  const visible = await stickyBar.isVisible();
  console.log('sticky bar transform:', transform);
  console.log('aria-hidden:', ariaHidden);
  console.log('visible:', visible);

  // Inspect IO target
  const sectionExists = await p.evaluate(() => !!document.getElementById('schedule'));
  console.log('#schedule exists:', sectionExists);

  // Check section bounding box vs viewport
  const rect = await p.evaluate(() => {
    const el = document.getElementById('schedule');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, vh: window.innerHeight };
  });
  console.log('schedule bbox:', rect);

  await p.screenshot({ path: '/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts/sticky-trace.png' });
  await b.close();
})();
