// Cluster builds QA — verifies all 5 new blog posts on staging.
// Pairs with the visual-testing skill (which catches CSS bugs); this catches
// functional bugs: 404 internal links, missing schema, console errors, mobile
// overflow, CTA destination integrity.

const { test, expect } = require('@playwright/test');

const POSTS = [
  {
    slug: 'adr-vs-revpar-airbnb-hosts',
    label: 'cluster-3-adr-revpar',
    expectTitle: /ADR vs RevPAR/,
    expectChart: 1, expectPhilo: 0,
    expectQuickAnswerKeyword: 'Revenue Per Available Room',
  },
  {
    slug: 'the-revfactor-method',
    label: 'cluster-4-method',
    expectTitle: /RevFactor Method/,
    expectChart: 1, expectPhilo: 1,
    expectQuickAnswerKeyword: 'Discover',
  },
  {
    slug: 'how-to-build-comp-set-str',
    label: 'cluster-6-comp-set',
    expectTitle: /Comp Set/,
    expectChart: 1, expectPhilo: 1,
    expectQuickAnswerKeyword: 'comp set',
  },
  {
    slug: 'best-str-revenue-management-companies-2026',
    label: 'cluster-5-listicle',
    expectTitle: /Best STR Revenue Management Companies/,
    expectChart: 1, expectPhilo: 1,
    expectQuickAnswerKeyword: 'three service models',
  },
  {
    slug: 'best-airbnb-property-managers-with-dynamic-pricing-2026',
    label: 'pm-listicle',
    expectTitle: /Best Property Managers With Dynamic Pricing/,
    expectChart: 0, expectPhilo: 1,
    expectQuickAnswerKeyword: 'full-service',
  },
];

// Helper: collect console errors during a page session
function attachConsoleListeners(page) {
  const errors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

for (const post of POSTS) {
  test.describe(`Cluster post: ${post.label}`, () => {
    test('hero renders, schema emits, scroll completes, mobile no overflow', async ({ page, viewport }) => {
      const t0 = Date.now();
      const errors = attachConsoleListeners(page);
      const failedRequests = [];
      page.on('requestfailed', (req) => {
        if (req.resourceType() !== 'image' || req.failure()?.errorText !== 'net::ERR_FAILED') {
          failedRequests.push({ url: req.url(), err: req.failure()?.errorText, type: req.resourceType() });
        }
      });

      const url = `/blog/${post.slug}/`;
      const res = await page.goto(url, { waitUntil: 'domcontentloaded' });
      expect(res?.status()).toBe(200);

      // x-robots-tag noindex on staging
      const xRobots = res?.headers()?.['x-robots-tag'] || '';
      expect(xRobots).toContain('noindex');

      // Hero render + title
      await expect(page).toHaveTitle(post.expectTitle);
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();

      // Step screenshot — hero
      const vpLabel = viewport ? `${viewport.width}x${viewport.height}` : 'default';
      await page.screenshot({
        path: `tests/playwright/screenshots/${post.label}-${vpLabel}-1-hero.png`,
        fullPage: false,
      });

      // Quick Answer block contains expected keyword
      const quickAns = page.locator('.rf-quick-answer').first();
      await expect(quickAns).toBeVisible();
      const quickAnsText = await quickAns.innerText();
      expect(quickAnsText.toLowerCase()).toContain(post.expectQuickAnswerKeyword.toLowerCase());

      // FAQ schema (JSON-LD with FAQPage or Article)
      const ldJsonCount = await page.locator('script[type="application/ld+json"]').count();
      expect(ldJsonCount).toBeGreaterThanOrEqual(1);
      const hasFAQSchema = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of scripts) {
          try {
            const data = JSON.parse(s.textContent);
            const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
            for (const item of items) {
              if (item['@type'] === 'FAQPage' || (Array.isArray(item['@type']) && item['@type'].includes('FAQPage'))) return true;
            }
          } catch (e) { /* skip invalid */ }
        }
        return false;
      });
      expect(hasFAQSchema).toBe(true);

      // Visual component density assertions
      const bleedCount = await page.locator('.rf-bleed').count();
      const chartCount = await page.locator('.rf-chart').count();
      const philoCount = await page.locator('.rf-philosophy').count();
      expect(bleedCount).toBeGreaterThanOrEqual(2);
      if (post.expectChart > 0) expect(chartCount).toBeGreaterThanOrEqual(post.expectChart);
      if (post.expectPhilo > 0) expect(philoCount).toBeGreaterThanOrEqual(post.expectPhilo);

      // Scroll through the entire page (triggers lazy loads + tests scroll integrity)
      await page.evaluate(async () => {
        const total = document.body.scrollHeight;
        for (let y = 0; y < total; y += 800) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 200));
        }
      });
      await page.waitForTimeout(2500); // give lazy images time
      await page.screenshot({
        path: `tests/playwright/screenshots/${post.label}-${vpLabel}-2-bottom.png`,
        fullPage: false,
      });

      // Mobile horizontal overflow check
      const horizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      });
      expect(horizontalOverflow, 'horizontal overflow detected').toBe(false);

      // No critical console errors
      const realErrors = errors.filter((e) =>
        !e.includes('chrome-extension://') &&
        !e.toLowerCase().includes('aborted') &&
        !e.toLowerCase().includes('net::err_blocked_by_client')
      );
      expect(realErrors, `console errors: ${realErrors.join('; ')}`).toEqual([]);

      // No critical network failures — ignore third-party tracking/analytics ERR_ABORTED
      // (Google Analytics, Google Ads, Vercel deployment-protection JWE, and the page's
      // own URL which Chromium reports as aborted when navigation completes before
      // load events finish). These are not real bugs.
      const benignHosts = ['google-analytics.com', 'googletagmanager.com', 'googleadservices.com', 'google.com/rmkt', 'google.com/ccm', '/.well-known/vercel/jwe', 'vercel.live/'];
      const realFailures = failedRequests.filter((r) =>
        r.type !== 'image' && r.type !== 'font' &&
        !benignHosts.some((h) => r.url.includes(h)) &&
        !(r.err === 'net::ERR_ABORTED' && r.url.includes('revfactor-git-cluster-builds'))
      );
      expect(realFailures, `network failures: ${JSON.stringify(realFailures)}`).toEqual([]);

      console.log(`[${post.label}/${vpLabel}] load+scroll: ${Date.now() - t0}ms · bleed=${bleedCount} philo=${philoCount} chart=${chartCount} jsonLD=${ldJsonCount}`);
    });
  });
}

test.describe('Cross-cluster interlinking', () => {
  test('all internal links across the 5 new posts resolve to 200 (no 404s)', async ({ page, request }) => {
    const internalLinks = new Set();
    for (const post of POSTS) {
      await page.goto(`/blog/${post.slug}/`, { waitUntil: 'domcontentloaded' });
      const hrefs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href^="/"]'))
          .map((a) => a.getAttribute('href'))
          .filter((h) => h && !h.startsWith('/#') && !h.startsWith('#'))
      );
      hrefs.forEach((h) => internalLinks.add(h));
    }

    console.log(`Collected ${internalLinks.size} distinct internal hrefs across 5 posts`);

    const failures = [];
    for (const href of internalLinks) {
      const res = await request.get(href);
      if (res.status() !== 200) {
        failures.push({ href, status: res.status() });
      }
    }
    expect(failures, `404/non-200 internal links: ${JSON.stringify(failures, null, 2)}`).toEqual([]);
  });

  test('CTA → consultation page is reachable from every post', async ({ page }) => {
    for (const post of POSTS) {
      await page.goto(`/blog/${post.slug}/`, { waitUntil: 'domcontentloaded' });
      // CTA in nav — labelled "Schedule Strategy Call" or similar; targets /short-term-rental-consultant/
      const ctaCount = await page.locator('a[href*="/short-term-rental-consultant"]').count();
      expect(ctaCount, `${post.label}: no CTA to /short-term-rental-consultant/`).toBeGreaterThanOrEqual(1);
    }
  });

  test('RM pillar hub link (exact-match anchor) present from each spoke', async ({ page }) => {
    for (const post of POSTS) {
      await page.goto(`/blog/${post.slug}/`, { waitUntil: 'domcontentloaded' });
      // Exact-match anchor "revenue management for short-term rentals" pointing to /blog/revenue-management-for-short-term-rentals/
      const exactAnchor = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href="/blog/revenue-management-for-short-term-rentals/"]'));
        return anchors.find((a) => a.textContent.toLowerCase().includes('revenue management for short-term rentals'))?.textContent.trim() || null;
      });
      expect(exactAnchor, `${post.label}: no exact-match RM pillar anchor`).toBeTruthy();
    }
  });
});
