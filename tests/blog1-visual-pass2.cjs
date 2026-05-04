// Visual QA pass 2: hero/gradient/progress-bar/testimonial/rf-band changes
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 4323;
const URL = `http://localhost:${PORT}/blog/revenue-management-for-short-term-rentals/`;
const OUT = path.join(__dirname, '_artifacts', 'blog1-qa');

(async () => {
  const proc = spawn('npx', ['http-server', 'dist', '-p', String(PORT), '-s', '-c', '-1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((r) => setTimeout(r, 2500));

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const broken = [];
    page.on('response', (resp) => {
      if (resp.request().resourceType() === 'image' && resp.status() >= 400) {
        broken.push({ url: resp.url(), status: resp.status() });
      }
    });
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

    // Capture hero
    await page.screenshot({ path: path.join(OUT, 'pass2-hero.png'), fullPage: false });

    // Scroll to first new pull-quote (mid-century interior)
    const firstQuote = await page.$('img[src*="interior-mid-century"]');
    if (firstQuote) {
      await firstQuote.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, 'pass2-discipline-quote.png') });
    }

    // Scroll to rf-band bone (diagnostic frame)
    const boneBand = await page.$('.rf-band.bone');
    if (boneBand) {
      await boneBand.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, 'pass2-bone-band.png') });
    }

    // Scroll to testimonial card
    const testimonial = await page.$('.rf-testimonial');
    if (testimonial) {
      await testimonial.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, 'pass2-testimonial.png') });
    }

    // Capture progress bar (scroll to mid-page so bar is visible)
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'pass2-progressbar.png'), clip: { x: 0, y: 0, width: 1440, height: 80 } });

    // Full page snapshot for review
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'pass2-full.png'), fullPage: true });

    console.log(`broken images: ${broken.length}`);
    broken.forEach((b) => console.log(`  ${b.status} ${b.url}`));

    // Mobile pass
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mp = await mctx.newPage();
    await mp.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await mp.screenshot({ path: path.join(OUT, 'pass2-mobile-hero.png') });
    await mctx.close();
  } finally {
    await browser.close();
    proc.kill('SIGTERM');
  }
})();
