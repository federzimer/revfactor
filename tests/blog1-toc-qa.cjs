// QA the new TOC pill: collapsed default, expand on click, label tracks scroll
const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

const PREVIEW_PORT = 4322;
const URL = `http://localhost:${PREVIEW_PORT}/blog/revenue-management-for-short-term-rentals/`;
const OUT = path.join(__dirname, '_artifacts', 'blog1-qa');

(async () => {
  // Kick a static preview server pointing at dist/
  const proc = spawn('npx', ['http-server', 'dist', '-p', String(PREVIEW_PORT), '-s', '-c', '-1'], {
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

    // Scroll past hero so floating TOC becomes visible
    await page.evaluate(() => window.scrollTo(0, window.innerHeight));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(OUT, 'local-toc-collapsed.png') });

    // Capture the TOC current label + check it's not the full long list
    const collapsedHtml = await page.evaluate(() => {
      const pill = document.querySelector('#tocPill');
      return pill ? pill.outerHTML.slice(0, 500) : '<no pill>';
    });
    console.log('[TOC] collapsed pill:', collapsedHtml);

    // Click the pill to expand
    await page.click('#tocPill');
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'local-toc-expanded.png') });

    // Scroll down to a deeper section and check label updates
    await page.evaluate(() => {
      const target = document.querySelector('#the-tactical-playbook-6-plays-that-move-revenue');
      if (target) target.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(600);
    const updatedLabel = await page.evaluate(() => document.getElementById('tocCurrentLabel')?.textContent);
    const updatedNum = await page.evaluate(() => document.getElementById('tocCurrentNum')?.textContent);
    console.log('[TOC] after-scroll label:', updatedNum, '/', updatedLabel);
    await page.screenshot({ path: path.join(OUT, 'local-toc-after-scroll.png') });

    // Full page screenshot for visual review
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'local-full.png'), fullPage: true });

    // Mobile
    const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mp = await mctx.newPage();
    mp.on('response', (resp) => {
      if (resp.request().resourceType() === 'image' && resp.status() >= 400) {
        broken.push({ url: resp.url(), status: resp.status() });
      }
    });
    await mp.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    await mp.evaluate(async () => {
      const total = document.body.scrollHeight;
      for (let y = 0; y < total; y += 800) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 200));
      }
      window.scrollTo(0, 0);
    });
    await mp.screenshot({ path: path.join(OUT, 'local-mobile-full.png'), fullPage: true });
    await mctx.close();

    console.log('---');
    console.log(`Broken images: ${broken.length}`);
    broken.forEach((b) => console.log(`  ${b.status} ${b.url}`));
  } finally {
    await browser.close();
    proc.kill('SIGTERM');
  }
})();
