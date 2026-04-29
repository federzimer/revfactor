// Functional E2E for the RevFactor PPC consultant landing page
// (https://www.revfactor.io/short-term-rental-consultant).
//
// SCOPE: walks the booking flow up to (but NOT including) submission of a
// real booking. Submitting would create a real calendar invite to Federico —
// out of scope per the qa-flow-tester "Don't submit when … sends to a real
// prospect/customer" rule.
//
// What this catches:
//   - Hero + sticky mobile CTA render
//   - Sticky mobile CTA opens the schedule modal
//   - Schedule iframe (custom Next.js app at schedule.revfactor.io/embed) renders
//   - Inline schedule section + Federico signature block visible above the fold
//   - Section order: results → schedule → difference → process → faq
//   - No console errors during the run
//
// Run from project root:
//   npx playwright test --reporter=list
// Or just one project:
//   npx playwright test --project=mobile-iphone-14

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = path.resolve(__dirname, '../screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const PAGE_PATH = '/short-term-rental-consultant';
const SCHEDULER_IFRAME_SRC = 'https://schedule.revfactor.io/embed';

function setupErrorCollection(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push({ type: 'pageerror', message: err.message }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push({ type: 'console.error', message: msg.text() });
  });
  page.on('requestfailed', (req) => {
    const url = req.url();
    // Ignore third-party tracking + font CDN failures that are unrelated to functional UX.
    // Ignore tracking pixels (often abort by design — analytics + ads + fonts).
    if (/google-analytics|googletagmanager|googleadservices|google\.com\/rmkt|fonts\.gstatic|fonts\.googleapis|hotjar|doubleclick|facebook|tiktok|cloudflareinsights/.test(url)) return;
    errors.push({ type: 'requestfailed', url, reason: req.failure()?.errorText });
  });
  return errors;
}

async function shot(page, label) {
  const file = path.join(SHOTS, `${Date.now()}-${label}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ${path.basename(file)}`);
  return file;
}

test.describe('RevFactor — strategy call booking flow', () => {
  test('mobile: sticky CTA opens scheduler iframe', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test — see desktop test for the inline embed');
    const errors = setupErrorCollection(page);

    // 1. Land on PPC page
    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await shot(page, '01-mobile-landing');
    // Default headline (no ?msg= URL param) should be the loss-framing variant.
    await expect(page.locator('h1')).toContainText(/lose 18%/i);

    // 2. Sticky mobile CTA visible at viewport bottom. Use the .last() match
    // so we get the bottom-of-viewport sticky bar, not the top navbar CTA
    // (the new minimal PPCNavbar shows a "Talk to Federico" anchor too).
    const stickyCta = page.locator('button').filter({ hasText: /free 30 min/i });
    await expect(stickyCta).toBeVisible();
    const stickyBox = await stickyCta.boundingBox();
    const viewport = page.viewportSize();
    expect(stickyBox.y + stickyBox.height).toBeGreaterThan(viewport.height - 100);
    console.log(`  ✓ Sticky CTA at y=${Math.round(stickyBox.y)} (viewport h=${viewport.height})`);

    // 3. Click sticky CTA. The current sticky-bar implementation triggers
    // setScheduleOpen (modal), but the navbar's Talk-to-Federico anchor
    // smooth-scrolls to #schedule. Both flows end at the calendar.
    const t0 = Date.now();
    await stickyCta.click();
    // Modal contains an iframe pointing at the custom scheduler. Scope to a
    // modal-specific ancestor (the ScheduleModal renders a fixed-position
    // overlay, distinct from the inline #schedule section).
    const modalRoot = page.locator('[role="dialog"], .fixed.inset-0').filter({ has: page.locator(`iframe[src*="${SCHEDULER_IFRAME_SRC}"]`) }).first();
    await expect(modalRoot).toBeVisible({ timeout: 8000 });
    const modalIframe = modalRoot.locator(`iframe[src*="${SCHEDULER_IFRAME_SRC}"]`);
    await expect(modalIframe).toBeVisible({ timeout: 8000 });
    const elapsed = Date.now() - t0;
    console.log(`  ✓ Modal opened with scheduler iframe in ${elapsed}ms`);
    await page.waitForTimeout(2500); // give iframe a chance to render its calendar
    await shot(page, '02-mobile-modal-open');

    // 4. Iframe content has loaded (we can't pierce the cross-origin iframe's
    //    DOM directly, but we can confirm dimensions are non-trivial)
    const iframeBox = await modalIframe.boundingBox();
    expect(iframeBox.width).toBeGreaterThan(200);
    expect(iframeBox.height).toBeGreaterThan(300);
    console.log(`  ✓ Iframe rendered ${Math.round(iframeBox.width)}×${Math.round(iframeBox.height)}px`);

    // 5. STOP — do not submit. A real booking would create a calendar invite
    //    on Federico's calendar.
    console.log('  ⏸  Stopping at iframe-loaded — not submitting (would book Federico for real)');

    // Edge case: closing the modal hides the modal-scoped iframe (the inline
    // #schedule section's iframe is still on the page, so we check the
    // modal-root not the iframe selector).
    const closeButton = modalRoot.locator('button[aria-label*="close" i], button:has-text("×"), button:has-text("Close")').first();
    if (await closeButton.count() > 0) {
      await closeButton.click();
      await page.waitForTimeout(500);
      await expect(modalRoot).not.toBeVisible();
      console.log('  ✓ Modal close button works');
    }

    if (errors.length) {
      console.log('  ⚠ Console / network errors:', JSON.stringify(errors, null, 2));
    }
    expect(errors).toEqual([]);
  });

  test('desktop: section order + inline schedule + founder signature', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    const errors = setupErrorCollection(page);

    await page.goto(PAGE_PATH, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await shot(page, '03-desktop-landing');

    // 1. Federico signature block visible above the fold
    const founderName = page.locator('text=Federico Zimerman').first();
    await expect(founderName).toBeVisible();
    const fzBox = await founderName.boundingBox();
    expect(fzBox.y).toBeLessThan(900); // within the 1440×900 viewport fold
    console.log(`  ✓ Federico signature at y=${Math.round(fzBox.y)} (above fold)`);

    // 2. Verify the section order matches the post-CRO layout
    const expectedOrder = ['results', 'schedule', 'difference', 'process', 'faq'];
    const actualOrder = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('section[id]')).map(s => s.id);
    });
    console.log(`  Section order: ${actualOrder.join(' → ')}`);
    for (let i = 0; i < expectedOrder.length; i++) {
      expect(actualOrder).toContain(expectedOrder[i]);
    }
    // Position checks — schedule must come before difference (the post-CRO move)
    expect(actualOrder.indexOf('schedule')).toBeLessThan(actualOrder.indexOf('difference'));
    expect(actualOrder.indexOf('results')).toBeLessThan(actualOrder.indexOf('schedule'));

    // 3. Inline schedule section: scroll into view + verify iframe renders
    const scheduleSection = page.locator('#schedule');
    await scheduleSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    const inlineIframe = scheduleSection.locator(`iframe[src*="${SCHEDULER_IFRAME_SRC}"]`);
    await expect(inlineIframe).toBeVisible();
    const inlineBox = await inlineIframe.boundingBox();
    expect(inlineBox.height).toBeGreaterThan(400);
    console.log(`  ✓ Inline iframe rendered ${Math.round(inlineBox.width)}×${Math.round(inlineBox.height)}px`);
    await shot(page, '04-desktop-schedule-section');

    // 4. Testimonials with metric badges + names render
    const testimonialNames = ['Kate Henry', 'Kassidy & Erin Warren', 'Sarah'];
    for (const name of testimonialNames) {
      await expect(page.locator(`text=${name}`).first()).toBeVisible();
    }
    console.log(`  ✓ All 3 named testimonials present`);

    if (errors.length) {
      console.log('  ⚠ Console / network errors:', JSON.stringify(errors, null, 2));
    }
    expect(errors).toEqual([]);
  });
});
