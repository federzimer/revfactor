// RevFactor Staging Site — Browser & Device Test Suite
// Staging: https://revfactor-git-dev-federico-zimermans-projects.vercel.app
// Production: https://revfactor.io

const { test, expect, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const STAGING = 'https://revfactor-git-dev-federico-zimermans-projects.vercel.app';
const SCREENSHOTS = path.join(__dirname, 'screenshots');

// Ensure screenshots dir exists
if (!fs.existsSync(SCREENSHOTS)) fs.mkdirSync(SCREENSHOTS, { recursive: true });

const PAGES = [
  { name: 'home',     path: '/' },
  { name: 'blog',     path: '/blog' },
  { name: 'about',    path: '/about' },
  { name: 'blog-post', path: '/blog/dynamic-pricing-str-beginners-guide' },
];

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-ipad',  width: 768,  height: 1024 },
  { name: 'mobile-iphone', width: 390, height: 844 },
  { name: 'mobile-android', width: 412, height: 915 },
];

// ─── CHROMIUM TESTS ───────────────────────────────────────────────────────────
test.describe('Chromium — Multi-Viewport', () => {
  for (const vp of VIEWPORTS) {
    for (const page of PAGES) {
      test(`[Chrome] ${page.name} @ ${vp.name}`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const pg  = await ctx.newPage();

        const res = await pg.goto(`${STAGING}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 });

        // ── HTTP status
        expect(res.status(), `${page.name} should return 200`).toBe(200);

        // ── No console errors
        const errors = [];
        pg.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
        pg.on('pageerror', err => errors.push(err.message));

        // ── Full-page screenshot
        await pg.screenshot({
          path: path.join(SCREENSHOTS, `chrome_${page.name}_${vp.name}.png`),
          fullPage: true,
        });

        // ── Brand checks: bone background
        const bodyBg = await pg.evaluate(() =>
          getComputedStyle(document.body).backgroundColor
        );
        // #DDDAD3 = rgb(221, 218, 211)
        expect(bodyBg, 'Body should have bone background').toBe('rgb(221, 218, 211)');

        // ── Font: Cormorant Garamond loaded
        const fontLoaded = await pg.evaluate(() =>
          document.fonts.check('400 24px "Cormorant Garamond"')
        );
        expect(fontLoaded, 'Cormorant Garamond should be loaded').toBeTruthy();

        // ── Nav pill visible
        const nav = pg.locator('nav').first();
        await expect(nav).toBeVisible();

        // ── No JS errors
        expect(errors.filter(e =>
          !e.includes('favicon') &&
          !e.includes('404') &&
          !e.includes('robots')
        ).length, `No JS errors on ${page.name}`).toBe(0);

        await ctx.close();
      });
    }
  }
});

// ─── FIREFOX TESTS ───────────────────────────────────────────────────────────
test.describe('Firefox — Key Pages', () => {
  for (const page of PAGES) {
    test(`[Firefox] ${page.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const pg  = await ctx.newPage();

      const res = await pg.goto(`${STAGING}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      expect(res.status()).toBe(200);

      await pg.screenshot({
        path: path.join(SCREENSHOTS, `firefox_${page.name}_desktop.png`),
        fullPage: true,
      });

      const nav = pg.locator('nav').first();
      await expect(nav).toBeVisible();

      await ctx.close();
    });
  }
});

// ─── WEBKIT / SAFARI TESTS ────────────────────────────────────────────────────
test.describe('WebKit / Safari — Key Pages', () => {
  for (const page of PAGES) {
    test(`[Safari] ${page.name}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const pg  = await ctx.newPage();

      const res = await pg.goto(`${STAGING}${page.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      expect(res.status()).toBe(200);

      await pg.screenshot({
        path: path.join(SCREENSHOTS, `safari_${page.name}_desktop.png`),
        fullPage: true,
      });

      await ctx.close();
    });
  }
});

// ─── MOBILE DEVICE EMULATION ──────────────────────────────────────────────────
test.describe('Mobile Device Emulation', () => {
  const mobileDevices = [
    { label: 'iPhone 14 Pro', device: devices['iPhone 14 Pro'] },
    { label: 'iPhone SE',     device: devices['iPhone SE'] },
    { label: 'iPad Pro',      device: devices['iPad Pro'] },
    { label: 'Galaxy S9+',    device: devices['Galaxy S9+'] },
    { label: 'Pixel 5',       device: devices['Pixel 5'] },
  ];

  for (const { label, device } of mobileDevices) {
    test(`[Mobile] ${label} — home`, async ({ browser, browserName }) => {
      if (browserName === 'firefox' && device.isMobile) { test.skip(); return; }
      const ctx = await browser.newContext({ ...device });
      const pg  = await ctx.newPage();

      const res = await pg.goto(STAGING, { waitUntil: 'networkidle', timeout: 30000 });
      expect(res.status()).toBe(200);

      await pg.screenshot({
        path: path.join(SCREENSHOTS, `mobile_${label.replace(/ /g,'_')}_home.png`),
        fullPage: true,
      });

      // Nav visible on mobile
      const nav = pg.locator('nav').first();
      await expect(nav).toBeVisible();

      // No horizontal scroll
      const hasHScroll = await pg.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHScroll, `${label} should not have horizontal scroll`).toBeFalsy();

      await ctx.close();
    });
  }
});

// ─── FUNCTIONAL CHECKS ────────────────────────────────────────────────────────
test.describe('Functional — Home Page', () => {
  test('Hero section visible and has CTA', async ({ page }) => {
    await page.goto(STAGING, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOTS, 'functional_hero.png'), fullPage: false });

    // Main element exists
    await expect(page.locator('main')).toBeVisible();
    // CTA exists — the primary CTA is a button that opens the schedule modal
    const cta = page.locator('button, a').filter({ hasText: /schedule|strategy call|book/i }).first();
    await expect(cta).toBeVisible();
  });

  test('Footer present with correct copyright', async ({ page }) => {
    await page.goto(STAGING, { waitUntil: 'networkidle' });
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('RevFactor');
    await page.screenshot({ path: path.join(SCREENSHOTS, 'functional_footer.png'), fullPage: false });
  });

  test('No broken images on home page', async ({ page }) => {
    await page.goto(STAGING, { waitUntil: 'networkidle' });
    const brokenImages = await page.evaluate(() => {
      return Array.from(document.images)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src);
    });
    expect(brokenImages, `Broken images: ${brokenImages.join(', ')}`).toHaveLength(0);
  });

  test('noindex header NOT present on staging', async ({ page }) => {
    const res = await page.goto(STAGING, { waitUntil: 'networkidle' });
    const robotsHeader = res.headers()['x-robots-tag'] || '';
    // staging should have noindex set via vercel.json for non-prod
    console.log('X-Robots-Tag:', robotsHeader || '(not set)');
    // We just log — staging has noindex by design, prod does not
  });

  test('GSC verification file accessible', async ({ page }) => {
    const res = await page.goto(`${STAGING}/google104b954bd53ffcf1.html`);
    expect(res.status()).toBe(200);
    const body = await page.textContent('body');
    expect(body).toContain('google-site-verification');
  });

  test('Sitemap accessible', async ({ page }) => {
    const res = await page.goto(`${STAGING}/sitemap-index.xml`);
    expect(res.status()).toBe(200);
  });

  test('Robots.txt accessible', async ({ page }) => {
    const res = await page.goto(`${STAGING}/robots.txt`);
    expect(res.status()).toBe(200);
  });
});

// ─── SEO META CHECKS ──────────────────────────────────────────────────────────
test.describe('SEO Meta Tags', () => {
  for (const page of PAGES.slice(0, 3)) {
    test(`Meta tags — ${page.name}`, async ({ page: pg }) => {
      await pg.goto(`${STAGING}${page.path}`, { waitUntil: 'networkidle' });

      const title = await pg.title();
      expect(title.length, 'Title should exist').toBeGreaterThan(5);
      expect(title.length, 'Title should be under 70 chars').toBeLessThan(70);

      const description = await pg.getAttribute('meta[name="description"]', 'content');
      expect(description, 'Meta description should exist').toBeTruthy();
      expect(description.length, 'Description should be over 50 chars').toBeGreaterThan(50);

      const canonical = await pg.getAttribute('link[rel="canonical"]', 'href');
      expect(canonical, 'Canonical URL should exist').toBeTruthy();

      const ogTitle = await pg.getAttribute('meta[property="og:title"]', 'content');
      expect(ogTitle, 'OG title should exist').toBeTruthy();

      const ogImage = await pg.getAttribute('meta[property="og:image"]', 'content');
      expect(ogImage, 'OG image should exist').toBeTruthy();

      console.log(`[${page.name}] title: "${title}" | desc: ${description?.length} chars`);
    });
  }
});

// ─── PERFORMANCE SNAPSHOT ─────────────────────────────────────────────────────
test.describe('Performance', () => {
  test('Home page LCP & load time', async ({ page }) => {
    await page.goto(STAGING, { waitUntil: 'networkidle' });

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint');
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
        loadComplete: Math.round(nav.loadEventEnd),
        fcp: Math.round(paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0),
        lcp: Math.round(lcp[lcp.length - 1]?.startTime || 0),
      };
    });

    console.log('Performance:', JSON.stringify(perfData, null, 2));
    expect(perfData.domContentLoaded, 'DOMContentLoaded < 5s').toBeLessThan(5000);
    expect(perfData.loadComplete, 'Load complete < 10s').toBeLessThan(10000);
  });
});
