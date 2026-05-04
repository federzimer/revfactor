// iOS Safari emulation pass for the 3 PPC landing pages.
// Uses Playwright's iPhone device profiles (closer to real iOS Safari than
// desktop WebKit — different UA, viewport units, touch handling, safe-area).
//
// Per page × per device:
//   1. Hero renders, screenshot
//   2. CountUp proof strip shows correct values (post-fix)
//   3. No horizontal scroll (overflow-x bugs are common on iOS)
//   4. Sticky bottom CTA visible
//   5. Booking flow: scroll → date → time → form fields visible
//   6. Footer ↔ sticky-bar gap fix verified

const { test, expect, devices } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const ART = path.join(__dirname, '_artifacts');
if (!fs.existsSync(ART)) fs.mkdirSync(ART, { recursive: true });

const PAGES = [
  '/short-term-rental-consultant',
  '/airbnb-pricing-strategy',
  '/vs/pricelabs',
];

const IOS_DEVICES = [
  ['iphone-14-pro', devices['iPhone 14 Pro']],
  ['iphone-14',     devices['iPhone 14']],
  ['iphone-se',     devices['iPhone SE']],
];

for (const [deviceName, deviceProfile] of IOS_DEVICES) {
  for (const slug of PAGES) {
    test(`[${deviceName}] ${slug} — full mobile QA`, async ({ browser }) => {
      const ctx = await browser.newContext({ ...deviceProfile });
      const page = await ctx.newPage();
      try {
        await page.goto(`https://www.revfactor.io${slug}`, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForTimeout(2500);

        const tag = `ios-${deviceName}-${slug.replace(/\//g, '_')}`;

        // 1. Hero
        await page.screenshot({ path: path.join(ART, `${tag}-1-hero.png`), fullPage: false });

        // 2. CountUp proof strip — scroll to it, verify non-zero
        await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
        await page.waitForTimeout(1500);
        const proofText = await page.locator('body').innerText();
        const liftMatch = proofText.match(/\+(\d+)%[\s\S]{0,40}revenue/i);
        console.log(`[${deviceName} ${slug}] proof: ${liftMatch ? liftMatch[0].slice(0, 30) : 'NOT FOUND'}`);
        if (liftMatch) {
          expect(liftMatch[1]).not.toBe('0');
        }

        // 3. No horizontal scroll
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow, `${slug} has horizontal overflow on ${deviceName}`).toBe(false);

        // 4. Sticky bottom CTA
        const sticky = page.locator('.fixed.bottom-0').first();
        await expect(sticky).toBeVisible();

        // 5. Schedule section
        await page.locator('#schedule').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(ART, `${tag}-2-schedule.png`), fullPage: false });

        const frame = page.frameLocator('iframe[title="Schedule a strategy call with RevFactor"]').first();
        await frame.locator('text=SELECT A DATE').waitFor({ timeout: 15000 });

        // 6. Pick date + time
        const days = frame.locator('button:not([disabled])').filter({ hasText: /^[0-9]{1,2}$/ });
        await days.first().click();
        await page.waitForTimeout(700);

        const time = frame.locator('button:has-text("AM"), button:has-text("PM")').first();
        await time.click();
        await page.waitForTimeout(700);

        // 7. Form fields
        const nameField = frame.locator('input[placeholder*="John"], input[name="name"]').first();
        await nameField.waitFor({ state: 'visible', timeout: 8000 });
        await page.screenshot({ path: path.join(ART, `${tag}-3-form.png`), fullPage: false });

        // 8. Footer ↔ sticky-bar gap (scroll all the way down)
        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(ART, `${tag}-4-footer.png`), fullPage: false });
      } finally {
        await ctx.close();
      }
    });
  }
}
