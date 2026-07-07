// Real test booking with conversion-ping verification.
// Captures every request to googleadservices/google-analytics during
// the booking flow, runs through to setStep('confirmed'), reports
// whether the conversion ping fires.
//
// Booking is REAL — name is marked TEST so Fede can identify + cancel.

const { chromium } = require('playwright');
const path = require('path');

const ART = '/Users/aaronwhittaker/Claude/RevFactor/tests/_artifacts';
const NAME = 'TEST — Conversion Tracking — please cancel';
const EMAIL = 'qa+conv-e2e@revfactor.io';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Capture every conversion-related network request
  const pings = [];
  page.on('request', (req) => {
    const url = req.url();
    if (
      url.includes('googleadservices.com') ||
      url.includes('google-analytics.com/g/collect') ||
      url.includes('analytics.google.com')
    ) {
      pings.push({
        time: new Date().toISOString(),
        method: req.method(),
        url: url.slice(0, 250),
      });
    }
  });

  console.log('1. Opening landing page...');
  await page.goto('https://www.revfactor.io/short-term-rental-consultant', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(2500);

  console.log('2. Scrolling to #schedule + waiting for iframe...');
  await page.locator('#schedule').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);

  const frame = page.frameLocator('iframe[title="Schedule a strategy call with RevFactor"]').first();

  console.log('3. Picking first available date...');
  await frame.locator('text=SELECT A DATE').waitFor({ timeout: 15000 });
  const days = frame.locator('button:not([disabled])').filter({ hasText: /^[0-9]{1,2}$/ });
  await days.first().click();
  await page.waitForTimeout(700);

  console.log('4. Picking first time slot...');
  const time = frame.locator('button:has-text("AM"), button:has-text("PM")').first();
  await time.waitFor({ timeout: 8000 });
  await time.click();
  await page.waitForTimeout(700);

  console.log('5. Filling form...');
  await frame.locator('input[name="name"]').fill(NAME);
  await frame.locator('input[name="email"]').fill(EMAIL);
  await page.screenshot({ path: path.join(ART, 'conv-1-form-filled.png'), fullPage: false });

  console.log('6. Submitting booking...');
  // Find + click submit button
  const submit = frame.locator('button[type="submit"], button:has-text("Confirm"), button:has-text("Book")').first();
  await submit.click();

  // Wait for confirmation + conversion ping to fire
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(ART, 'conv-2-after-submit.png'), fullPage: false });

  console.log('\n=== CAPTURED CONVERSION-RELATED PINGS ===');
  if (pings.length === 0) {
    console.log('🚨 ZERO pings. Booking submitted but no gtag/Google Ads request fired.');
  } else {
    pings.forEach((p, i) => {
      console.log(`${i + 1}. [${p.method}] ${p.time}`);
      console.log(`   ${p.url}`);
    });
  }

  // Specifically check for the AW conversion
  const conv = pings.find((p) => p.url.includes('googleadservices.com/pagead/conversion'));
  console.log('\n=== KEY VERDICT ===');
  if (conv) {
    console.log('✅ Google Ads conversion ping FIRED:');
    console.log(`   ${conv.url}`);
  } else {
    console.log('🚨 Google Ads conversion ping did NOT fire.');
    const ga4 = pings.find((p) => p.url.includes('google-analytics.com'));
    if (ga4) {
      console.log('   (GA4 traffic captured — booking did go through, but conversion tag is broken)');
    } else {
      console.log('   (No GA4 traffic either — booking may have failed entirely)');
    }
  }

  await browser.close();
})();
