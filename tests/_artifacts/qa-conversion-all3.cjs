// QA: verify conversion funnel on all 3 PPC pages without booking.
// Runs through hero → calendar mount → date pick → time pick → form
// fields → reads gtag dataLayer to confirm tracking is wired. Stops
// before submit (we already verified end-to-end on consultant page
// earlier; no need to spam Fede's calendar).
//
// Also captures: console errors, broken images, missing CTAs.

const { chromium, devices } = require('playwright');
const path = require('path');

const ART = '/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts';
const PAGES = [
  '/short-term-rental-consultant',
  '/airbnb-pricing-strategy',
  '/vs/pricelabs',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const slug of PAGES) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    const consoleErrors = [];
    const networkFails = [];
    const conversionPings = [];

    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('chrome-extension://')) {
        networkFails.push(`${r.failure()?.errorText} ${r.url().slice(0, 120)}`);
      }
    });
    page.on('request', (r) => {
      const u = r.url();
      if (u.includes('googleadservices') || u.includes('google-analytics')) {
        conversionPings.push(u.slice(0, 180));
      }
    });

    const r = { slug, errors: [], warnings: [], pass: [] };
    try {
      console.log(`\n--- ${slug} ---`);
      await page.goto(`https://www.revfactor.io${slug}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await page.waitForTimeout(3000);

      // 1. Page loaded — check for hero CTA
      const hero = await page.locator('h1').first().textContent();
      if (!hero) r.errors.push('No H1 found');
      else r.pass.push(`Hero loaded: "${hero.slice(0, 50)}..."`);

      // 2. CTA must scroll to or open #schedule
      const ctaCount = await page.locator('button:has-text("Strategy Call"), button:has-text("Book Free")').count();
      if (ctaCount === 0) r.errors.push('No "Strategy Call" CTA visible');
      else r.pass.push(`${ctaCount} primary CTA(s) on page`);

      // 3. gtag wired
      const hasGtag = await page.evaluate(() => typeof window.gtag === 'function');
      if (!hasGtag) r.errors.push('gtag NOT defined globally');
      else r.pass.push('gtag wired');

      // 4. Microsoft Clarity wired
      const hasClarity = await page.evaluate(() => typeof window.clarity === 'function');
      if (!hasClarity) r.warnings.push('Microsoft Clarity not loaded (might be blocked)');
      else r.pass.push('Clarity wired');

      // 5. Schedule iframe loads
      await page.locator('#schedule').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2500);
      const frame = page.frameLocator('iframe[title="Schedule a strategy call with RevFactor"]').first();
      try {
        await frame.locator('text=SELECT A DATE').waitFor({ timeout: 12000 });
        r.pass.push('Calendar iframe loaded → SELECT A DATE visible');
      } catch (e) {
        r.errors.push('Calendar iframe failed to render SELECT A DATE');
      }

      // 6. Pick date + time (don't submit)
      try {
        const days = frame.locator('button:not([disabled])').filter({ hasText: /^[0-9]{1,2}$/ });
        await days.first().click();
        await page.waitForTimeout(700);
        const time = frame.locator('button:has-text("AM"), button:has-text("PM")').first();
        await time.waitFor({ timeout: 6000 });
        await time.click();
        await page.waitForTimeout(700);
        const nameField = frame.locator('input[name="name"]').first();
        await nameField.waitFor({ timeout: 6000 });
        r.pass.push('Date → time → form fields all reachable');
      } catch (e) {
        r.errors.push(`Booking flow broke: ${e.message.slice(0, 80)}`);
      }

      // 7. Capture conversion-related pings (form_start should fire)
      const hasFormStart = conversionPings.some((p) => p.includes('form_start') || p.includes('book_strategy_call'));
      if (!hasFormStart) r.warnings.push('No form_start gtag event captured (may not fire until type)');
      else r.pass.push('form_start gtag event captured');

      // 8. Console errors / network failures
      if (consoleErrors.length > 0) r.warnings.push(`${consoleErrors.length} console error(s): ${consoleErrors[0].slice(0, 100)}`);
      if (networkFails.length > 0) r.warnings.push(`${networkFails.length} network failure(s): ${networkFails[0]}`);

      await page.screenshot({ path: path.join(ART, `qa-${slug.replace(/\//g, '_')}.png`) });
    } catch (e) {
      r.errors.push(`Hard failure: ${e.message}`);
    } finally {
      await ctx.close();
      results.push(r);
    }
  }

  await browser.close();

  // Print summary
  console.log('\n\n=================== QA REPORT ===================');
  let totalErr = 0;
  for (const r of results) {
    console.log(`\n${r.slug}`);
    if (r.errors.length) {
      console.log(`  ERRORS (${r.errors.length}):`);
      r.errors.forEach((e) => console.log(`    🚨 ${e}`));
      totalErr += r.errors.length;
    }
    if (r.warnings.length) {
      console.log(`  WARNINGS (${r.warnings.length}):`);
      r.warnings.forEach((w) => console.log(`    ⚠️  ${w}`));
    }
    if (r.pass.length) {
      console.log(`  PASSED (${r.pass.length}):`);
      r.pass.forEach((p) => console.log(`    ✅ ${p}`));
    }
  }
  console.log('\n=================================================');
  console.log(totalErr === 0 ? '✅ All 3 pages have no conversion-blocking issues.' : `🚨 ${totalErr} conversion-blocking error(s) found.`);
})();
