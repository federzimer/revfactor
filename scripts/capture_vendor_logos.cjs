// Pull a high-resolution logo for each vendor via Google's free favicon
// service (sz=256). Clearbit's logo API was deprecated in 2025, but Google
// keeps a 256-px favicon cache that works for ~every vendor with a real
// favicon. Some vendors will return a generic globe — those need manual
// extraction. Idempotent.
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const LOGO_DIR = path.join(ROOT, 'public/photos/blog/vendor-logos');
fs.mkdirSync(LOGO_DIR, { recursive: true });

const VENDORS = [
  // PM listicle
  { slug: 'vacasa',          domain: 'vacasa.com' },
  { slug: 'avantstay',       domain: 'avantstay.com' },
  { slug: 'evolve',          domain: 'evolve.com' },
  { slug: 'awning',          domain: 'awning.com' },
  { slug: 'itrip',           domain: 'itrip.net' },
  { slug: 'roami',           domain: 'roami.com' },
  // STR RM cos
  { slug: 'pacer',           domain: 'pacerrev.com' },
  { slug: 'revparty',        domain: 'revparty.com' },
  { slug: 'str-consulting',  domain: 'strconsulting.io' },
  { slug: 'hostlyft',        domain: 'hostlyft.com' },
  { slug: 'pricing-by-mira', domain: 'pricingbymira.com' },
  { slug: 'rented',          domain: 'rented.com' },
  { slug: 'dosbnb',          domain: 'dosbnb.com' },
  { slug: 'beyond-pricing',  domain: 'beyondpricing.com' },
  { slug: 'maverick-str',    domain: 'maverickstr.co' },
  // Dynamic pricing software compared in the Airbnb RM listicle.
  // NOTE: pricelabs.co returns a generic placeholder mark from the favicon
  // service, not the PriceLabs brand logo — verified 2026-07-30. Left out
  // deliberately; it needs manual extraction before any post uses it, since
  // shipping the wrong mark for a named vendor is an accuracy problem.
  { slug: 'wheelhouse',      domain: 'usewheelhouse.com' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve({ ok: true })));
      } else if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        file.close();
        download(res.headers.location, dest).then(resolve, reject);
      } else {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        resolve({ ok: false, status: res.statusCode });
      }
    }).on('error', (e) => { file.close(); try { fs.unlinkSync(dest); } catch {}; reject(e); });
  });
}

(async () => {
  for (const v of VENDORS) {
    const out = path.join(LOGO_DIR, `${v.slug}.png`);
    if (fs.existsSync(out) && fs.statSync(out).size > 500) {
      console.log(`  ✓ ${v.slug} (cached, ${fs.statSync(out).size}B)`);
      continue;
    }
    const url = `https://www.google.com/s2/favicons?domain=${v.domain}&sz=256`;
    try {
      const r = await download(url, out);
      const size = fs.existsSync(out) ? fs.statSync(out).size : 0;
      console.log(`  ${r.ok ? '✓' : '✗'} ${v.slug} ← ${v.domain} (${size}B)`);
    } catch (e) {
      console.log(`  ✗ ${v.slug}: ${e.message}`);
    }
  }
})();
