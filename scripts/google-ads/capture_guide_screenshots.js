// Capture screenshots from Google Ads help pages for the launch walkthrough.
// Each step navigates to the relevant support article, scrolls to embedded UI
// images, and saves clean PNGs. Pages are public — no auth required.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = '/Users/aaronwhittaker/Claude/google-ads/guide_screenshots';

const PAGES = [
  {
    name: '01-conversions-tools-menu',
    url: 'https://support.google.com/google-ads/answer/1722022',
    description: 'Tools → Measurement → Conversions menu path',
    waitFor: 'h1',
  },
  {
    name: '02-primary-secondary-goals',
    url: 'https://support.google.com/google-ads/answer/11422704',
    description: 'Primary vs secondary conversion goals UI',
    waitFor: 'h1',
  },
  {
    name: '03-enhanced-conversions',
    url: 'https://support.google.com/google-ads/answer/9888656',
    description: 'Enhanced Conversions setup',
    waitFor: 'h1',
  },
  {
    name: '04-link-ga4',
    url: 'https://support.google.com/google-ads/answer/9379636',
    description: 'Link Google Ads to GA4',
    waitFor: 'h1',
  },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();

  for (const p of PAGES) {
    console.log(`Capturing: ${p.name}`);
    await page.goto(p.url, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForSelector(p.waitFor, { timeout: 8000 });
    } catch {}
    await page.waitForTimeout(2500);

    // dismiss any cookie banner / signin prompt
    try {
      const dismiss = page.locator('button:has-text("Reject"), button:has-text("Got it"), button[aria-label*="close" i]').first();
      if (await dismiss.isVisible({ timeout: 1000 })) await dismiss.click();
    } catch {}

    await page.screenshot({
      path: path.join(OUT, `${p.name}.png`),
      fullPage: true,
    });
  }

  await browser.close();
  console.log('Done.');
})();
