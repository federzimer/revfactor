// Live QA capture for dynamic-pricing post — desktop + mobile, full-page +
// targeted sections (hero, charts, illustrations).
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'https://www.revfactor.io/blog/dynamic-pricing-str-beginners-guide';
const OUT = __dirname;

const targets = [
  // [section-id-or-selector, save-name]
  ['main img.rf-bleed, main img[src*="hero"], header img', '01-hero'],
  ['svg.rf-chart, .rf-chart, figure:has(svg)', '02-charts'],
  ['figure.rf-figure-quote, .rf-bleed:has(.rf-quote)', '03-quote-figures'],
];

(async () => {
  const browser = await chromium.launch();
  for (const [device, label] of [['desktop', { viewport: { width: 1440, height: 900 } }],
                                  ['mobile-iphone14', devices['iPhone 14']]]) {
    const ctx = await browser.newContext({ ...label });
    const page = await ctx.newPage();
    console.log(`[${device}] loading ${URL}`);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);  // settle animations

    // 1. Full-page screenshot
    const fullPath = path.join(OUT, `${device}-full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`  → ${fullPath}`);

    // 2. Above-the-fold (the hero region)
    const heroPath = path.join(OUT, `${device}-01-hero.png`);
    await page.screenshot({ path: heroPath, fullPage: false });
    console.log(`  → ${heroPath}`);

    // 3. Sweep through key sections — scroll and snap
    const sections = await page.evaluate(() => {
      const out = [];
      // Find every chart, every figure-quote, every illustration
      document.querySelectorAll('figure, svg.rf-chart, .rf-chart, .rf-bleed').forEach((el, i) => {
        const r = el.getBoundingClientRect();
        out.push({
          tag: el.tagName,
          cls: el.className.toString().slice(0, 60),
          y: Math.round(r.top + window.scrollY),
          h: Math.round(r.height),
          alt: el.querySelector('img')?.alt?.slice(0, 60) || '',
        });
      });
      return out;
    });
    console.log(`  ${device}: ${sections.length} figure/chart/bleed elements`);

    // 4. Capture each section
    let i = 0;
    for (const s of sections) {
      i++;
      try {
        const handle = await page.evaluateHandle(({ y, h }) => {
          const els = document.querySelectorAll('figure, svg.rf-chart, .rf-chart, .rf-bleed');
          for (const el of els) {
            const r = el.getBoundingClientRect();
            if (Math.abs((r.top + window.scrollY) - y) < 5) return el;
          }
          return null;
        }, { y: s.y, h: s.h });
        const el = handle.asElement();
        if (el) {
          const p = path.join(OUT, `${device}-section-${String(i).padStart(2,'0')}.png`);
          await el.screenshot({ path: p });
          console.log(`  → ${p}  (${s.tag}.${s.cls.split(' ')[0]} @ y=${s.y})`);
        }
      } catch (e) { /* skip */ }
    }

    // 5. Console errors + broken image count
    const consoleErrors = [];
    page.on('console', m => m.type() === 'error' && consoleErrors.push(m.text()));
    const brokenImgs = await page.$$eval('img', imgs =>
      imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
    );
    fs.writeFileSync(
      path.join(OUT, `${device}-meta.json`),
      JSON.stringify({ url: URL, viewport: device, sections, consoleErrors, brokenImgs }, null, 2),
    );
    await ctx.close();
  }
  await browser.close();
  console.log('\n=== done ===');
})();
