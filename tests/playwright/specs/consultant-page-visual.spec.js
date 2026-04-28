// Visual regression baselines for the RevFactor PPC consultant landing page.
//
// First run: captures baselines under tests/playwright/visual-baselines/.
// Subsequent runs: diffs against those baselines and fails on pixel changes.
//
// What's masked (excluded from the diff):
//   - The schedule iframe at #schedule and inside the modal — the embedded
//     scheduler at https://schedule.revfactor.io/embed shows live date
//     selection that changes daily and would create false-positive diffs.
//   - The footer copyright year (renders new Date().getFullYear() — would
//     fail on Jan 1 of every new year).
//
// Stat strip (+18% / +75% / $320 / 30 min) is hardcoded in the React, not
// dynamic, so it's NOT masked — we want regressions there to fail.
//
// To accept a deliberate visual change:
//   npx playwright test consultant-page-visual --update-snapshots
//
// Run normally:
//   npx playwright test consultant-page-visual --reporter=list

import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PAGE_PATH = '/short-term-rental-consultant';

// Snapshot stability config — disable animations + hide blinking caret so the
// pixels don't drift between runs.
const SNAPSHOT_OPTS = {
  fullPage: true,
  animations: 'disabled',
  caret: 'hide',
  // Tolerance values for full-page snapshots on a long marketing page with
  // images + iframes are intentionally generous. The goal is "catch obvious
  // regressions, not flag font-hinting noise":
  //   - threshold: per-pixel color diff (0..1). 0.3 = a pixel must differ by
  //     30% RGB before being counted as changed. Filters anti-aliasing drift.
  //   - maxDiffPixelRatio: portion of pixels allowed to differ AFTER the
  //     per-pixel threshold. 0.03 = 3% of the page can shift without failing.
  threshold: 0.3,
  maxDiffPixelRatio: 0.03,
};

const VIEWPORTS = [
  { name: 'desktop',  width: 1440, height: 900,  isMobile: false },
  { name: 'tablet',   width: 768,  height: 1024, isMobile: false },
  { name: 'iphone',   width: 393,  height: 852,  isMobile: true  }, // iPhone 14 Pro
];

test.describe('RevFactor consultant page — visual regression', () => {
  // This file controls its own viewport per test, so it doesn't need the
  // project-driven viewport from playwright.config.js. Run on chromium only
  // to avoid duplicate runs (mobile-iphone-14 project would otherwise re-run
  // each test and overwrite the baselines).
  test.skip(({ browserName }) => browserName !== 'chromium', 'visual regression: chromium only');

  for (const vp of VIEWPORTS) {
    test(`baseline: ${vp.name} (${vp.width}x${vp.height})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: vp.isMobile,
        hasTouch: vp.isMobile,
      });
      const page = await context.newPage();

      await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });

      // Give the schedule iframe + any lazy-loaded images time to settle.
      await page.waitForTimeout(4000);

      // Scroll-to-bottom-then-top trick to force lazy-loaded images to fire,
      // then settle back at the top so the screenshot starts fresh.
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1500);

      // Force the iframe to a fixed height so the auto-resize postMessage
      // listener doesn't shift everything below it between runs.
      await page.addStyleTag({ content: `
        #schedule iframe { height: 640px !important; }
      ` });

      // Build mask list — anything dynamic that we don't want to diff.
      // Mask the WHOLE #schedule section (not just the iframe) — the section
      // contains the iframe which has its own internal dynamics and the
      // section's height fluctuates as the iframe resizes via postMessage.
      const masks = [
        page.locator('#schedule'),
        page.locator('footer'), // copyright year drifts annually
      ];

      await expect(page).toHaveScreenshot(`consultant-${vp.name}.png`, {
        ...SNAPSHOT_OPTS,
        mask: masks,
      });

      await context.close();
    });
  }
});
