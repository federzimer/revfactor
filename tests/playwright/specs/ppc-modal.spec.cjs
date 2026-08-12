// PPC pages: verify the modal-based CTA keeps the pages iframe-free on first
// paint and routes each qualifier branch to the right GHL widget. Each page
// should:
//   1. Render WITHOUT any schedule iframe in the DOM (old scheduler or GHL)
//   2. Open the QualifierGate modal when the hero CTA is clicked, and mount
//      the GHL no-listing form on the no_property path
//   3. Forward UTM/gclid params into the GHL booking iframe src (self-host)

const { test, expect } = require('@playwright/test');

const PPC_PAGES = [
  { path: '/airbnb-pricing-strategy/', label: 'airbnb-pricing-strategy' },
  { path: '/vs/pricelabs/',            label: 'vs-pricelabs' },
  { path: '/short-term-rental-consultant/', label: 'consultant' },
];

const Q1_NO  = '[data-umami-event="qualifier-step"][data-umami-event-answer="no"]';
const Q1_YES = '[data-umami-event="qualifier-step"][data-umami-event-answer="yes"]';

for (const page of PPC_PAGES) {
  test.describe(`PPC ${page.label}`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('no inline schedule iframe in the DOM', async ({ page: pw }) => {
      await pw.goto(page.path, { waitUntil: 'domcontentloaded' });
      // Widget iframes are only rendered AFTER the qualifier (modal) or the
      // exit-intent trigger; on first paint there should be ZERO of either
      // the legacy scheduler or GHL.
      await expect(pw.locator('iframe[src*="schedule.revfactor.io"]')).toHaveCount(0);
      await expect(pw.locator('iframe[src*="links.revfactor.io"]')).toHaveCount(0);
    });

    test('CTA opens modal + no_property path mounts the GHL form', async ({ page: pw }) => {
      await pw.goto(page.path, { waitUntil: 'domcontentloaded' });
      const cta = pw.getByRole('button', { name: /book a discovery call|schedule a discovery call/i }).first();
      await cta.scrollIntoViewIfNeeded();
      await pw.waitForTimeout(300); // animation settle
      await cta.click();
      await expect(pw.locator(Q1_NO)).toBeVisible({ timeout: 10_000 });

      await pw.locator(Q1_NO).click();
      await expect(
        pw.locator('iframe[src*="/widget/form/SUQXaS425Xuw41mNz3sh"]')
      ).toBeVisible({ timeout: 8_000 });
    });

    test('self-host path opens the GHL booking iframe inside the modal (with UTMs forwarded)', async ({ page: pw }) => {
      // Visit with UTMs + gclid to test forwarding into the modal iframe.
      await pw.goto(`${page.path}?utm_source=playwright&utm_campaign=ppc-modal-qa&gclid=PWTEST123`, { waitUntil: 'domcontentloaded' });
      const cta = pw.getByRole('button', { name: /book a discovery call|schedule a discovery call/i }).first();
      await cta.scrollIntoViewIfNeeded();
      await pw.waitForTimeout(300);
      await cta.click();
      await expect(pw.locator(Q1_YES)).toBeVisible({ timeout: 10_000 });

      await pw.locator(Q1_YES).click();
      await pw.locator('[data-umami-event="qualifier-step"][data-umami-event-answer="host"]').click();

      // Iframe is now rendered inside the modal. Its src should carry the
      // forwarded UTM + gclid params.
      const iframe = pw.locator('iframe[src*="links.revfactor.io/widget/booking"]').first();
      await expect(iframe).toBeVisible({ timeout: 8_000 });
      const src = await iframe.getAttribute('src');
      expect(src, 'iframe src').toContain('utm_source=playwright');
      expect(src, 'iframe src').toContain('utm_campaign=ppc-modal-qa');
      expect(src, 'iframe src').toContain('gclid=PWTEST123');
    });
  });
}
