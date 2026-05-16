// Cluster-builds QA: mobile-overflow + console-error + functional CTA flow
// across the 5 new cluster spoke posts on staging. Records video per spec
// and saves per-post screenshots + a JSON summary.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://revfactor-git-cluster-builds-2b123a-federico-zimermans-projects.vercel.app';

const POSTS = [
  { slug: 'best-airbnb-property-managers-with-dynamic-pricing-2026', label: 'PM listicle' },
  { slug: 'adr-vs-revpar-airbnb-hosts',                              label: 'Cluster 3 ADR vs RevPAR' },
  { slug: 'best-str-revenue-management-companies-2026',              label: 'Cluster 5 STR RM cos' },
  { slug: 'how-to-build-comp-set-str',                               label: 'Cluster 6 Comp Set' },
  { slug: 'the-revfactor-method',                                    label: 'Cluster 4 RevFactor Method' },
];

const VIEWPORTS = [
  { name: 'mobile-375',  ...devices['iPhone 13'] },
  { name: 'mobile-390',  ...devices['iPhone 14 Pro'] },
  { name: 'tablet-768',  viewport: { width: 768, height: 1024 }, userAgent: devices['iPad (gen 7)']?.userAgent || 'Mozilla/5.0 (iPad; CPU OS 16_0)' },
];

const OUT = path.resolve(__dirname, '_artifacts/cluster-5posts-2026-05-16');
fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'videos'), { recursive: true });

(async () => {
  const summary = [];

  for (const post of POSTS) {
    for (const vp of VIEWPORTS) {
      const url = `${BASE}/blog/${post.slug}/`;
      const slugSafe = `${post.slug}__${vp.name}`;
      console.log(`\n[${vp.name}] ${post.label}`);

      const browser = await chromium.launch();
      const ctx = await browser.newContext({
        ...vp,
        recordVideo: { dir: path.join(OUT, 'videos'), size: vp.viewport || { width: 390, height: 844 } },
      });
      const page = await ctx.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
      page.on('pageerror', e => pageErrors.push(e.message));

      const t0 = Date.now();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        const tLoad = Date.now() - t0;

        // CWV-equivalent metrics from PerformanceObserver + navigation timing
        const metrics = await page.evaluate(async () => {
          const nav = performance.getEntriesByType('navigation')[0];
          const paints = performance.getEntriesByType('paint');
          const fcp = paints.find(p => p.name === 'first-contentful-paint')?.startTime;

          // LCP via PerformanceObserver — wait briefly to let it settle
          const lcpPromise = new Promise(resolve => {
            let lcp = 0;
            try {
              const obs = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) lcp = entry.startTime;
              });
              obs.observe({ type: 'largest-contentful-paint', buffered: true });
              setTimeout(() => { obs.disconnect(); resolve(lcp); }, 500);
            } catch { resolve(0); }
          });
          // CLS via layout-shift observer
          const clsPromise = new Promise(resolve => {
            let cls = 0;
            try {
              const obs = new PerformanceObserver(list => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) cls += entry.value;
                }
              });
              obs.observe({ type: 'layout-shift', buffered: true });
              setTimeout(() => { obs.disconnect(); resolve(cls); }, 500);
            } catch { resolve(0); }
          });

          const [lcp, cls] = await Promise.all([lcpPromise, clsPromise]);

          return {
            ttfb: nav ? Math.round(nav.responseStart) : null,
            domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
            fullLoad: nav ? Math.round(nav.loadEventEnd) : null,
            fcp: Math.round(fcp || 0),
            lcp: Math.round(lcp),
            cls: Number(cls.toFixed(4)),
            transferSize: nav ? Math.round(nav.transferSize / 1024) : null, // KB
            encodedBodySize: nav ? Math.round(nav.encodedBodySize / 1024) : null,
          };
        });

        // Horizontal overflow check
        const overflow = await page.evaluate(() => {
          const docW = document.documentElement.clientWidth;
          const offenders = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width > docW + 1 || r.right > docW + 1) {
              if (el.offsetParent === null) return;
              const id = el.id || el.tagName.toLowerCase();
              const cls = (el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.');
              offenders.push({ tag: `${id}${cls ? '.' + cls : ''}`, width: Math.round(r.width), right: Math.round(r.right), docW });
            }
          });
          return {
            docW,
            scrollW: document.documentElement.scrollWidth,
            hasHorizontalScroll: document.documentElement.scrollWidth > docW + 1,
            offenderCount: offenders.length,
            offenders: offenders.slice(0, 5),
          };
        });

        // Scroll through page so lazy images + below-fold console errors fire
        await page.evaluate(async () => {
          await new Promise(resolve => {
            let total = 0;
            const step = 600;
            const timer = setInterval(() => {
              window.scrollBy(0, step);
              total += step;
              if (total >= document.documentElement.scrollHeight) {
                clearInterval(timer);
                resolve();
              }
            }, 80);
          });
        });
        await page.waitForTimeout(800);

        // Final overflow after scroll
        const overflowAfterScroll = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          docW: document.documentElement.clientWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        }));

        // CTA click — test schedule modal flow with timing
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(300);
        const ctaSelector = 'a[href*="/short-term-rental-consultant"], a[href*="#schedule"]';
        const ctaCount = await page.locator(ctaSelector).count();
        let modalTiming = null;
        if (ctaCount > 0) {
          const cta = page.locator(ctaSelector).first();
          await cta.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          const tClick = Date.now();
          await cta.click({ timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(700);
          const modalDetected = await page.evaluate(() => {
            const iframe = !!document.querySelector('iframe[src*="schedule"], iframe[src*="cal.com"], iframe[src*="hubspot"]');
            const overlay = !!document.querySelector('[role="dialog"], [aria-modal="true"]');
            return iframe || overlay;
          });
          modalTiming = { ms: Date.now() - tClick, detected: modalDetected };
        }

        const ssPath = path.join(OUT, 'screenshots', `${slugSafe}.png`);
        await page.screenshot({ path: ssPath, fullPage: true });

        const video = await page.video();
        const videoPath = video ? await video.path() : null;

        await ctx.close();
        await browser.close();

        const finalVideo = videoPath ? path.join(OUT, 'videos', `${slugSafe}.webm`) : null;
        if (videoPath && finalVideo) {
          try { fs.renameSync(videoPath, finalVideo); } catch {}
        }

        const record = {
          post: post.label, slug: post.slug, viewport: vp.name, url,
          tLoad,
          metrics,
          overflow,
          overflowAfterScroll,
          ctaCount,
          modalTiming,
          consoleErrors,
          pageErrors,
          screenshot: ssPath,
          video: finalVideo,
        };
        summary.push(record);

        console.log(`  TTFB ${metrics.ttfb}ms · FCP ${metrics.fcp}ms · LCP ${metrics.lcp}ms · CLS ${metrics.cls}`);
        console.log(`  load ${tLoad}ms · transfer ${metrics.transferSize}KB`);
        console.log(`  overflow: ${overflow.hasHorizontalScroll ? '❌ ' + overflow.offenderCount + ' offenders' : '✅ none'}${overflow.hasHorizontalScroll && overflow.offenders.length ? ' (' + overflow.offenders.map(o => o.tag).join(', ') + ')' : ''}`);
        console.log(`  console errors: ${consoleErrors.length}${pageErrors.length ? ' + ' + pageErrors.length + ' page errors' : ''}`);
        if (modalTiming) console.log(`  modal: ${modalTiming.detected ? '✅' : '❌'} in ${modalTiming.ms}ms`);
      } catch (e) {
        console.log(`  ERROR ${e.message}`);
        summary.push({ post: post.label, slug: post.slug, viewport: vp.name, error: e.message });
        try { await ctx.close(); } catch {}
        try { await browser.close(); } catch {}
      }
    }
  }

  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nWrote summary: ${path.join(OUT, 'summary.json')}`);
})();
