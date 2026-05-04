// Visual QA: capture live + staging at desktop + mobile, look for missing images
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URLS = {
  live: 'https://revfactor.io/blog/revenue-management-for-short-term-rentals',
  staging: 'https://revfactor-baxf5vnvi-federico-zimermans-projects.vercel.app/blog/revenue-management-for-short-term-rentals',
};
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
const OUT = path.join(__dirname, '_artifacts', 'blog1-qa');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const summary = [];

  for (const [env, url] of Object.entries(URLS)) {
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      const ctx = await browser.newContext({ viewport: vp });
      const page = await ctx.newPage();
      const failedImages = [];
      page.on('response', (resp) => {
        const u = resp.url();
        if (resp.request().resourceType() === 'image' && resp.status() >= 400) {
          failedImages.push({ url: u, status: resp.status() });
        }
      });
      page.on('requestfailed', (req) => {
        if (req.resourceType() === 'image') {
          failedImages.push({ url: req.url(), status: 'failed', err: req.failure()?.errorText });
        }
      });
      console.log(`[${env}/${vpName}] loading ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      // scroll through to trigger lazy-loaded images
      await page.evaluate(async () => {
        const total = document.body.scrollHeight;
        for (let y = 0; y < total; y += 800) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 250));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1500);
      const fullName = `${env}-${vpName}-full.png`;
      await page.screenshot({ path: path.join(OUT, fullName), fullPage: true });
      const aboveFold = `${env}-${vpName}-fold.png`;
      await page.screenshot({ path: path.join(OUT, aboveFold), fullPage: false });

      // collect every <img> tag's loaded state
      const imgReport = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.alt || '',
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          loading: img.loading || 'eager',
        }));
      });
      const broken = imgReport.filter((i) => !i.complete || i.naturalWidth === 0);
      console.log(`[${env}/${vpName}] ${imgReport.length} <img>, ${broken.length} broken, ${failedImages.length} network-failed`);
      summary.push({ env, vpName, total: imgReport.length, broken, failedImages });

      await ctx.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== SUMMARY ===');
  summary.forEach((s) => {
    console.log(`${s.env}/${s.vpName}: ${s.broken.length} broken, ${s.failedImages.length} failed`);
    s.broken.forEach((b) => console.log(`  BROKEN: ${b.src}  alt="${b.alt}"`));
    s.failedImages.forEach((f) => console.log(`  FAIL: ${f.url} (${f.status})`));
  });
})();
