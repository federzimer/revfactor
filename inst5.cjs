const { chromium } = require('playwright');
const EMAIL = 'aaron@procloser.ai';
const PASSWORD = process.env.INST_PW;
const log = (...a) => console.log(...a);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  const page = await ctx.newPage();
  let capturedHeaders = null;
  page.on('request', req => {
    const u = req.url();
    if (u.includes('/backend-alt/') && !capturedHeaders) {
      const h = req.headers();
      // keep only interesting headers
      const keep = {};
      for (const k of Object.keys(h)) { if (/auth|workspace|org|x-/i.test(k)) keep[k]=h[k]; }
      if (Object.keys(keep).length) { capturedHeaders = keep; log('captured headers from', u.split('?')[0].slice(-50), JSON.stringify(keep).slice(0,300)); }
    }
  });
  try {
    await page.goto('https://app.instantly.ai/auth/login', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', PASSWORD);
    await (await page.$('button[type="submit"]')).click();
    await page.waitForTimeout(8000);
    log('URL:', page.url());

    const ls = await page.evaluate(() => ({ organizationId: localStorage.getItem('organizationId'), organizationAuth: localStorage.getItem('organizationAuth'), feNew: localStorage.getItem('fe-new-backend') }));
    log('organizationId:', ls.organizationId);
    log('organizationAuth (first 40):', (ls.organizationAuth||'').slice(0,40));

    for (const path of ['/app/settings/billing', '/app/accounts', '/app/settings/subscription']) {
      await page.goto('https://app.instantly.ai'+path, { waitUntil: 'networkidle', timeout: 45000 }).catch(()=>{});
      await page.waitForTimeout(4000);
      if (capturedHeaders) break;
    }
    log('capturedHeaders:', JSON.stringify(capturedHeaders));

    // Try fetch with captured headers, else construct from localStorage
    const data = await page.evaluate(async ({headers, ls}) => {
      const attempts = [];
      const tryFetch = async (hdrs, label) => {
        try { const r = await fetch('/backend-alt/api/v2/workspace-billing/subscription-details', { credentials:'include', headers: hdrs });
          return { label, status: r.status, body: (await r.text()).slice(0,4000) }; }
        catch(e){ return { label, error:String(e) }; }
      };
      if (headers) attempts.push(await tryFetch(headers, 'captured'));
      // construct candidates
      const orgId = ls.organizationId;
      const orgAuth = ls.organizationAuth;
      attempts.push(await tryFetch({ 'x-workspace-id': orgId, 'x-org-auth': orgAuth }, 'x-workspace-id+x-org-auth'));
      attempts.push(await tryFetch({ 'x-workspace-id': orgId }, 'x-workspace-id-only'));
      attempts.push(await tryFetch({ 'x-org-auth': orgAuth, 'x-workspace-id': orgId, 'Authorization': 'Bearer '+orgAuth }, 'bearer-orgauth'));
      return attempts;
    }, { headers: capturedHeaders, ls });
    log('=== ATTEMPTS ===');
    for (const a of data) log(JSON.stringify(a));
  } catch (e) {
    log('ERROR:', e.message, '| url:', page.url());
  } finally { await browser.close(); }
})();
