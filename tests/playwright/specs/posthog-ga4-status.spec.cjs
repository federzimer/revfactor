// PostHog + GA4 live status probes — confirm both analytics layers are
// loaded, initialized, and accepting events on production.

const { test, expect } = require('@playwright/test');

test.describe('Analytics — PostHog', () => {
  test('PostHog snippet loaded + project token configured', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.posthog === 'object', null, { timeout: 8_000 });
    const info = await page.evaluate(() => ({
      hasPosthog: typeof window.posthog === 'object',
      hasCapture: typeof window.posthog?.capture === 'function',
      hasIdentify: typeof window.posthog?.identify === 'function',
      hasDistinctId: typeof window.posthog?.get_distinct_id === 'function' && !!window.posthog.get_distinct_id(),
      apiHost: window.posthog?.config?.api_host || window.posthog?.get_config?.('api_host'),
      token: window.posthog?.config?.token || window.posthog?.get_config?.('token'),
    }));
    expect(info.hasPosthog).toBe(true);
    expect(info.hasCapture).toBe(true);
    expect(info.hasDistinctId).toBe(true);
    expect(info.token).toMatch(/^phc_/);
  });

  test('PostHog phones home (decide/array config) on page load', async ({ page }) => {
    const requests = [];
    page.on('request', (req) => {
      const u = req.url();
      if (/posthog\.com|posthog\.io|i\.posthog\.com/.test(u)) requests.push({ url: u, method: req.method() });
    });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.posthog?.capture === 'function');
    // Force PostHog to flush by firing an event then waiting one batch window.
    await page.evaluate(() => window.posthog.capture('qa_post_launch_probe', { ts: Date.now(), source: 'playwright' }));
    await page.waitForTimeout(6_000);
    expect(requests.length, `PostHog network calls: ${JSON.stringify(requests, null, 2)}`).toBeGreaterThan(0);
  });
});

test.describe('Analytics — GA4', () => {
  test('gtag is loaded + GA4 measurement id is configured', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.gtag === 'function' && Array.isArray(window.dataLayer));
    const info = await page.evaluate(() => {
      const dl = window.dataLayer || [];
      const ga4Config = dl.find((args) => args && args[0] === 'config' && args[1] === 'G-1CTGBJ9RLK');
      const adsConfig = dl.find((args) => args && args[0] === 'config' && args[1] === 'AW-18106897053');
      return {
        hasGtag: typeof window.gtag === 'function',
        ga4Configured: !!ga4Config,
        adsConfigured: !!adsConfig,
        dataLayerLen: dl.length,
      };
    });
    expect(info.hasGtag).toBe(true);
    expect(info.ga4Configured, 'GA4 G-1CTGBJ9RLK config in dataLayer').toBe(true);
    expect(info.adsConfigured, 'Google Ads AW-18106897053 config in dataLayer').toBe(true);
  });

  test('GA4 collect endpoint receives a test event', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof window.gtag === 'function');
    const collectPromise = page.waitForRequest(
      (req) => /\/g\/collect/.test(req.url()) || /google-analytics\.com\/g\//.test(req.url()),
      { timeout: 8_000 },
    );
    await page.evaluate(() => window.gtag('event', 'qa_post_launch_probe', { ts: Date.now() }));
    const req = await collectPromise;
    expect(req.url()).toMatch(/google-analytics\.com/);
  });
});
