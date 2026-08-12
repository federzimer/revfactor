// Discovery Call modal — E2E QA of the qualifier → GHL widget pipeline.
//
// Covers all three qualifier branches:
//   1. UI: Hero CTA → modal opens → Q1 "Not yet" → GHL no-listing form mounts
//   2. UI: Hero CTA → modal opens → Q1 "Yes" → Q2 "PM company" → GHL PM form mounts
//   3. UI: Hero CTA → modal opens → Q1 "Yes" → Q2 "Self-host" → GHL booking widget mounts
//
// Lead capture + booking now live entirely in GoHighLevel (links.revfactor.io);
// the old /api/discovery-lead endpoint is dormant and no longer exercised here
// (its API tests were removed with the migration — see git history to revive).

const { test, expect } = require('@playwright/test');

test.describe('Discovery modal — UI flows (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Selectors keyed off data-umami-event (stable, won't shift with copy edits).
  const Q1_YES = '[data-umami-event="qualifier-step"][data-umami-event-answer="yes"]';
  const Q1_NO  = '[data-umami-event="qualifier-step"][data-umami-event-answer="no"]';
  const Q2_HOST = '[data-umami-event="qualifier-step"][data-umami-event-answer="host"]';
  const Q2_PM   = '[data-umami-event="qualifier-step"][data-umami-event-answer="pm"]';

  async function openModal(page) {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Hero CTA. Multiple buttons match — the first is in the Hero, the second
    // is the pre-footer CTA band; either should open the modal.
    const heroCta = page.getByRole('button', { name: /schedule a discovery call/i }).first();
    await heroCta.waitFor({ state: 'visible', timeout: 10_000 });
    await heroCta.scrollIntoViewIfNeeded();
    // GSAP staggered entrance — give it a beat to bind handlers + settle.
    await page.waitForTimeout(400);
    await heroCta.click();
    // Wait for Q1 button — proves both modal mount + QualifierGate render.
    await expect(page.locator(Q1_YES)).toBeVisible({ timeout: 10_000 });
  }

  test('no_property path: opens and mounts the GHL no-listing form', async ({ page }) => {
    await openModal(page);
    await page.locator(Q1_NO).click();

    await expect(
      page.locator('iframe[src*="/widget/form/SUQXaS425Xuw41mNz3sh"]')
    ).toBeVisible({ timeout: 8_000 });
    // form_embed.js (GHL auto-resize) is injected alongside the iframe.
    await expect(page.locator('script[src*="form_embed.js"]')).toHaveCount(1);
  });

  test('pm_company path: opens and mounts the GHL partnership form', async ({ page }) => {
    await openModal(page);
    await page.locator(Q1_YES).click();
    await expect(page.locator(Q2_PM)).toBeVisible();
    await page.locator(Q2_PM).click();

    await expect(
      page.locator('iframe[src*="/widget/form/bEBHJS1TYGvMd92gaafL"]')
    ).toBeVisible({ timeout: 8_000 });
  });

  test('self_host path: opens, qualifies, mounts the GHL booking widget', async ({ page }) => {
    await openModal(page);
    await page.locator(Q1_YES).click();
    await page.locator(Q2_HOST).click();

    await expect(
      page.locator('iframe[src*="/widget/booking/lArwJ0BFe3TYOsCYHfet"]')
    ).toBeVisible({ timeout: 8_000 });
  });
});
