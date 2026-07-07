// Google Ads + GA4 conversion tracking — verify each tracked event actually
// pushes the right payload into window.dataLayer when fired. Doesn't wait on
// Google's pipeline (which has 3-24h reporting latency); proves the gtag
// pipeline runs and the conversion IDs + values are correct.
//
// Tracked conversions (per BaseLayout.astro + QualifierGate.jsx):
//   $1500  Strategy Call Booked    AW-18106897053/l1rvCK6w3q4cEJ2lhbpD
//   $75    Discovery Lead Captured AW-18106897053/MT8ACNTnqbEcEJ2lhbpD
//   $100   Phone Click             AW-18106897053/eLI7CMiey6McEJ2lhbpD

const { test, expect } = require('@playwright/test');

const RUN_ID = Date.now();
const testEmail = (tag) => `qa+rftest-${RUN_ID}-conv-${tag}@revfactor.io`;

// Sniff dataLayer for a payload matching predicate; resolve with the first
// match within `timeoutMs` ms.
async function waitForDataLayerEvent(page, predicate, timeoutMs = 8000) {
  return await page.evaluate(
    ({ predFn, timeoutMs }) => new Promise((resolve, reject) => {
      const dl = (window.dataLayer = window.dataLayer || []);
      const pred = new Function('args', `return (${predFn})(args)`);
      // Check anything already in the queue first.
      for (const args of dl) { try { if (pred(args)) return resolve(args); } catch {} }
      const origPush = dl.push.bind(dl);
      const timer = setTimeout(() => reject(new Error('dataLayer event timeout')), timeoutMs);
      dl.push = (...items) => {
        for (const args of items) {
          try { if (pred(args)) { clearTimeout(timer); dl.push = origPush; resolve(args); } } catch {}
        }
        return origPush(...items);
      };
    }),
    { predFn: predicate.toString(), timeoutMs },
  );
}

test.describe('Conversion tracking — production', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('Discovery Lead Captured ($75) fires on no_property submit', async ({ page }) => {
    await page.goto('/?utm_source=playwright&gclid=PWCONV1', { waitUntil: 'domcontentloaded' });

    // Open modal via Hero CTA
    const cta = page.getByRole('button', { name: /schedule a discovery call/i }).first();
    await cta.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await cta.click();
    await expect(page.locator('[data-umami-event="qualifier-q1-no"]')).toBeVisible({ timeout: 10_000 });

    // Arm the dataLayer listener BEFORE the form submit. The conversion event
    // fires synchronously alongside the API success.
    const conversionPromise = waitForDataLayerEvent(
      page,
      // args is the gtag(...) arguments converted to an object via dataLayer.push;
      // first element is the event name, second is the params object.
      (args) =>
        args && args[0] === 'event' &&
        args[1] === 'conversion' &&
        args[2] && args[2].send_to === 'AW-18106897053/MT8ACNTnqbEcEJ2lhbpD' &&
        args[2].value === 75 &&
        args[2].currency === 'USD',
      12_000,
    );

    await page.locator('[data-umami-event="qualifier-q1-no"]').click();
    await page.locator('input[type="email"]').fill(testEmail('lead'));
    await page.getByRole('button', { name: /^keep me posted$/i }).click();

    const fired = await conversionPromise;
    expect(fired, 'AW-18106897053/MT8...$75 conversion event payload').toBeTruthy();
  });

  test('Phone Click ($100) fires on tel: link click', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Inject a tel: anchor we can click safely (without actually placing a call).
    await page.evaluate(() => {
      const a = document.createElement('a');
      a.href = 'tel:+15555550100';
      a.id = '__qa_tel';
      a.textContent = 'QA call';
      a.style.position = 'fixed'; a.style.left = '-9999px';
      document.body.appendChild(a);
    });

    const conversionPromise = waitForDataLayerEvent(
      page,
      (args) =>
        args && args[0] === 'event' &&
        args[1] === 'conversion' &&
        args[2] && args[2].send_to === 'AW-18106897053/eLI7CMiey6McEJ2lhbpD' &&
        args[2].value === 100,
      8_000,
    );

    // Cancel the navigation so the test doesn't actually try to dial.
    await page.evaluate(() => {
      document.getElementById('__qa_tel').addEventListener('click', (e) => e.preventDefault(), { once: true });
      document.getElementById('__qa_tel').click();
    });

    const fired = await conversionPromise;
    expect(fired, 'AW-18106897053/eLI7...$100 phone-click conversion').toBeTruthy();
  });

  test('Strategy Call Booked ($1500) fires on simulated scheduler postMessage', async ({ page }) => {
    await page.goto('/?utm_source=playwright&gclid=PWCONV3', { waitUntil: 'domcontentloaded' });

    const conversionPromise = waitForDataLayerEvent(
      page,
      (args) =>
        args && args[0] === 'event' &&
        args[1] === 'conversion' &&
        args[2] && args[2].send_to === 'AW-18106897053/l1rvCK6w3q4cEJ2lhbpD' &&
        args[2].value === 1500,
      8_000,
    );

    // Simulate the scheduler iframe confirming a booking via postMessage —
    // this is what BaseLayout.astro's listener catches.
    await page.evaluate(() => {
      window.postMessage({ type: 'scheduler_booking_confirmed' }, '*');
    });

    const fired = await conversionPromise;
    expect(fired, 'AW-18106897053/l1rv...$1500 strategy-call-booked conversion').toBeTruthy();
  });

  test('GA4 (G-1CTGBJ9RLK) is configured', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // gtag('config', 'G-1CTGBJ9RLK') is pushed into dataLayer on page load.
    const found = await page.evaluate(() => {
      const dl = window.dataLayer || [];
      return dl.some((args) => args && args[0] === 'config' && args[1] === 'G-1CTGBJ9RLK');
    });
    expect(found, 'GA4 config event in dataLayer').toBe(true);
  });

  test('Google Ads (AW-18106897053) is configured', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const found = await page.evaluate(() => {
      const dl = window.dataLayer || [];
      return dl.some((args) => args && args[0] === 'config' && args[1] === 'AW-18106897053');
    });
    expect(found, 'Google Ads config event in dataLayer').toBe(true);
  });
});
