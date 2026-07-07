// Discovery Call modal — full E2E QA before production launch.
//
// Covers the launch-blocker pipeline end-to-end:
//   1. API: /api/discovery-lead accepts both qualifier paths and returns 200
//   2. UI:  Hero CTA → modal opens → Q1 "Not yet"  → email → submit → "done"
//   3. UI:  Hero CTA → modal opens → Q1 "Yes" → Q2 "PM company" → email → submit → "done"
//   4. UI:  Hero CTA → modal opens → Q1 "Yes" → Q2 "Self-host" → Cal.com iframe mounts
//
// Test emails are prefixed `qa+rftest-` so they can be filtered later
// per the filter-test-bookings rule.

const { test, expect } = require('@playwright/test');

const RUN_ID = Date.now();
const testEmail = (tag) => `qa+rftest-${RUN_ID}-${tag}@revfactor.io`;

test.describe('Discovery modal — API direct', () => {
  test('no_property path returns ok', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/discovery-lead`, {
      data: {
        email: testEmail('api-noprop'),
        hasProperty: false,
        isPM: false,
        source: 'playwright-api',
        pageUrl: `${baseURL}/?test=api`,
      },
    });
    expect(res.status(), `body=${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('pm_company path returns ok', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/discovery-lead`, {
      data: {
        email: testEmail('api-pm'),
        hasProperty: true,
        isPM: true,
        source: 'playwright-api',
        pageUrl: `${baseURL}/?test=api`,
      },
    });
    expect(res.status(), `body=${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('invalid email is rejected', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/discovery-lead`, {
      data: { email: 'not-an-email', hasProperty: false, source: 'playwright-api' },
    });
    expect(res.status()).toBe(400);
  });

  test('missing qualifier boolean is rejected', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/discovery-lead`, {
      data: { email: testEmail('api-invalid'), source: 'playwright-api' },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Discovery modal — UI flows (desktop)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Selectors keyed off data-umami-event (stable, won't shift with copy edits).
  const Q1_YES = '[data-umami-event="qualifier-q1-yes"]';
  const Q1_NO  = '[data-umami-event="qualifier-q1-no"]';
  const Q2_HOST = '[data-umami-event="qualifier-q2-host"]';
  const Q2_PM   = '[data-umami-event="qualifier-q2-pm"]';

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

  test('no_property path: opens, captures email, shows done', async ({ page }) => {
    await openModal(page);
    await page.locator(Q1_NO).click();

    // Email step — "Keep me posted" submit
    const submit = page.getByRole('button', { name: /^keep me posted$/i });
    await expect(submit).toBeVisible();

    await page.locator('input[type="email"]').fill(testEmail('ui-noprop'));

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/discovery-lead') && r.request().method() === 'POST', { timeout: 15_000 }),
      submit.click(),
    ]);
    expect(resp.status()).toBe(200);

    // Done state — "You're in."
    await expect(page.getByRole('heading', { name: /you'?re in/i })).toBeVisible({ timeout: 8_000 });
  });

  test('pm_company path: opens, captures email, shows done', async ({ page }) => {
    await openModal(page);
    await page.locator(Q1_YES).click();
    await expect(page.locator(Q2_PM)).toBeVisible();
    await page.locator(Q2_PM).click();

    // PM email step submit — "Get in touch"
    const submit = page.getByRole('button', { name: /^get in touch$/i });
    await expect(submit).toBeVisible();

    await page.locator('input[type="email"]').fill(testEmail('ui-pm'));

    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/discovery-lead') && r.request().method() === 'POST', { timeout: 15_000 }),
      submit.click(),
    ]);
    expect(resp.status()).toBe(200);

    await expect(page.getByRole('heading', { name: /you'?re in/i })).toBeVisible({ timeout: 8_000 });
  });

  test('self_host path: opens, qualifies, shows booking iframe', async ({ page }) => {
    await openModal(page);
    await page.locator(Q1_YES).click();
    await page.locator(Q2_HOST).click();
    // After onQualified, modal renders Cal.com / scheduler iframe.
    await expect(page.locator('iframe').first()).toBeVisible({ timeout: 8_000 });
  });
});
