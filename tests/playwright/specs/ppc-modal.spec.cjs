// PPC pages: verify the new modal-based CTA replaces the inline scheduler
// iframe across all 3 PPC landing pages. Each page should:
//   1. Render WITHOUT an inline schedule iframe in the DOM
//   2. Open the QualifierGate modal when the hero CTA is clicked
//   3. Successfully POST to /api/discovery-lead (no_property path)
//
// Triggered by the refactor that swapped the inline schedule.revfactor.io
// embed for the Discovery Call modal across PPCLanding.

const { test, expect } = require('@playwright/test');

const RUN_ID = Date.now();
const testEmail = (page, tag) => `aaron+rftest-${RUN_ID}-ppc-${page}-${tag}@procloser.ai`;

const PPC_PAGES = [
  { path: '/airbnb-pricing-strategy/', label: 'airbnb-pricing-strategy' },
  { path: '/vs/pricelabs/',            label: 'vs-pricelabs' },
  { path: '/short-term-rental-consultant/', label: 'consultant' },
];

const Q1_NO  = '[data-umami-event="qualifier-q1-no"]';
const Q1_YES = '[data-umami-event="qualifier-q1-yes"]';

for (const page of PPC_PAGES) {
  test.describe(`PPC ${page.label}`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('no inline schedule iframe in the DOM', async ({ page: pw }) => {
      await pw.goto(page.path, { waitUntil: 'networkidle' });
      // Modal iframe is only rendered AFTER QualifierGate qualifies; on first
      // paint there should be ZERO schedule.revfactor.io iframes.
      const iframes = pw.locator('iframe[src*="schedule.revfactor.io"]');
      await expect(iframes).toHaveCount(0);
    });

    test('CTA opens modal + no_property path POSTs to /api/discovery-lead', async ({ page: pw }) => {
      await pw.goto(page.path, { waitUntil: 'networkidle' });
      const cta = pw.getByRole('button', { name: /book a discovery call|schedule a discovery call/i }).first();
      await cta.scrollIntoViewIfNeeded();
      await pw.waitForTimeout(300); // animation settle
      await cta.click();
      await expect(pw.locator(Q1_NO)).toBeVisible({ timeout: 10_000 });

      await pw.locator(Q1_NO).click();
      const submit = pw.getByRole('button', { name: /^keep me posted$/i });
      await expect(submit).toBeVisible();

      await pw.locator('input[type="email"]').fill(testEmail(page.label, 'noprop'));
      const [resp] = await Promise.all([
        pw.waitForResponse((r) => r.url().includes('/api/discovery-lead') && r.request().method() === 'POST', { timeout: 15_000 }),
        submit.click(),
      ]);
      expect(resp.status()).toBe(200);
      await expect(pw.getByRole('heading', { name: /you'?re in/i })).toBeVisible({ timeout: 8_000 });
    });

    test('self-host path opens the scheduler iframe inside the modal (with UTMs forwarded)', async ({ page: pw }) => {
      // Visit with UTMs + gclid to test forwarding into the modal iframe.
      await pw.goto(`${page.path}?utm_source=playwright&utm_campaign=ppc-modal-qa&gclid=PWTEST123`, { waitUntil: 'networkidle' });
      const cta = pw.getByRole('button', { name: /book a discovery call|schedule a discovery call/i }).first();
      await cta.scrollIntoViewIfNeeded();
      await pw.waitForTimeout(300);
      await cta.click();
      await expect(pw.locator(Q1_YES)).toBeVisible({ timeout: 10_000 });

      await pw.locator(Q1_YES).click();
      await pw.locator('[data-umami-event="qualifier-q2-host"]').click();

      // Iframe is now rendered inside the modal. Its src should carry the
      // forwarded UTM + gclid params.
      const iframe = pw.locator('iframe[src*="schedule.revfactor.io"]').first();
      await expect(iframe).toBeVisible({ timeout: 8_000 });
      const src = await iframe.getAttribute('src');
      expect(src, 'iframe src').toContain('utm_source=playwright');
      expect(src, 'iframe src').toContain('utm_campaign=ppc-modal-qa');
      expect(src, 'iframe src').toContain('gclid=PWTEST123');
    });
  });
}
