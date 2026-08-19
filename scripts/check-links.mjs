#!/usr/bin/env node
/**
 * Link gate for the content cadence. Run after `npm run build`.
 *
 *   node scripts/check-links.mjs              # internal only (fast, offline, deterministic)
 *   node scripts/check-links.mjs --external   # also probe outbound links over the network
 *
 * Why this exists: `/journal` was never a route, and the post layout linked to
 * it twice on every post — 24 dead internal links across 12 posts, all of which
 * passed a clean `astro build`. A build error is not a link check. Nothing in
 * the pipeline was asserting that an href resolves to a file.
 *
 * Exits non-zero on failure so it can gate a publish step.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const args = new Set(process.argv.slice(2));
const CHECK_EXTERNAL = args.has('--external');

const ASSET_RE = /\.(png|jpe?g|webp|avif|svg|ico|css|js|mjs|woff2?|xml|txt|json|mp4|webm|pdf)$/i;

/** The site's own production hostnames. Absolute self-links come from the
 *  layout's canonical and og:url tags, so probing them over the network just
 *  asks production whether a page we have not deployed yet exists. Internal
 *  coverage is the dist-based check above, which is authoritative and offline. */
const SELF_HOSTS = new Set(['revfactor.io', 'www.revfactor.io']);

/** rel values where the href is an ORIGIN to warm up, not a document to fetch.
 *  A bare https://fonts.gstatic.com returns 404 by design, so probing these
 *  reports two permanent failures on every page of the site. */
const NON_DOCUMENT_RELS = /\b(preconnect|dns-prefetch|prefetch|preload|modulepreload)\b/i;

/** Domains that answer HTTP 200 while parked, for-sale, or otherwise not the
 *  business you think you are linking to. A status code says a server replied,
 *  not that a company is behind it — revparty.com returns 200 and serves a
 *  GoDaddy domain-sale lander. Any external check that trusts 200 alone will
 *  wave these through, which is how a dead vendor stayed linked in a listicle.
 *
 *  Note these signals are only reachable AFTER following the JS hop below.
 *  revparty.com's own HTML is 114 bytes and contains none of them. */
const PARKED_SIGNALS = [
  'forsale.godaddy.com',
  'sedoparking.com',
  'afternic.com',
  'dan.com',
  'hugedomains.com',
  'buydomains.com',
  'domainmarket.com',
  'parkingcrew.net',
  'bodis.com',
  'this domain is for sale',
  'buy this domain',
  'the domain you are looking for is for sale',
];

/** Status codes that mean "a bot was refused", not "the link is broken". LinkedIn
 *  answers every non-browser request with 999; Cloudflare/Akamai in front of news
 *  sites and academic journals answer 403. Those links work fine for a human, and
 *  failing the build on them trains everyone to ignore the gate — which is worse
 *  than not having one. Reported separately as inconclusive, never as a failure. */
const BOT_BLOCK_CODES = new Set([401, 403, 429, 999]);

/** www.example.com and example.com are the same site. Only a change of
 *  registrable domain is worth reading as a possible merger or rebrand. */
function baseHost(u) {
  try {
    return new URL(u).host.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error(`✗ ${DIST}/ not found — run \`npm run build\` first.`);
  process.exit(1);
}

const files = walk(DIST);
const pages = files.filter((f) => f.endsWith('.html'));
const present = new Set(files.map((f) => '/' + path.relative(DIST, f).split(path.sep).join('/')));

/** An extensionless route resolves if dist has its index.html (Astro's default
 *  build shape), so check both the trailing-slash and bare forms. */
function routeResolves(url) {
  if (present.has(url)) return true;
  const withIndex = url.endsWith('/') ? `${url}index.html` : `${url}/index.html`;
  return present.has(withIndex) || present.has(`${url}.html`);
}

const brokenInternal = new Map();
const externalUrls = new Map();

function record(map, key, page) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(path.relative(DIST, page));
}

let selfLinkSkipped = 0;
let relSkipped = 0;

for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  // Match whole tags rather than bare href="…" so `rel` is visible: whether a
  // URL is a document or just an origin to warm up is a property of the tag.
  for (const tagMatch of html.matchAll(/<(?:a|link|img|script|source|iframe|video|audio)\b([^>]*)>/gi)) {
    const attrs = tagMatch[1];
    const urlMatch = attrs.match(/\b(?:href|src)="([^"]+)"/i);
    if (!urlMatch) continue;
    const raw = urlMatch[1];
    if (/^(mailto:|tel:|javascript:|data:|#)/i.test(raw)) continue;

    const relMatch = attrs.match(/\brel="([^"]*)"/i);
    if (relMatch && NON_DOCUMENT_RELS.test(relMatch[1])) {
      relSkipped++;
      continue;
    }

    if (/^https?:\/\//i.test(raw)) {
      if (!CHECK_EXTERNAL) continue;
      let host = '';
      try {
        host = new URL(raw).host.toLowerCase();
      } catch {
        continue;
      }
      // Own-domain absolute URLs are the layout's canonical/og:url. dist is the
      // authority for those, and pre-deploy they always 404 in production.
      if (SELF_HOSTS.has(host)) {
        selfLinkSkipped++;
        continue;
      }
      record(externalUrls, raw.split('#')[0], page);
      continue;
    }
    if (raw.startsWith('//')) continue;
    if (!raw.startsWith('/')) continue; // relative links are rare here; skip rather than guess

    const url = raw.split('#')[0].split('?')[0];
    if (!url) continue;

    if (ASSET_RE.test(url)) {
      if (!present.has(url)) record(brokenInternal, url, page);
    } else if (!routeResolves(url)) {
      record(brokenInternal, url, page);
    }
  }
}

let failed = false;

console.log(`Scanned ${pages.length} built pages in ${DIST}/`);

if (brokenInternal.size) {
  failed = true;
  console.error(`\n✗ ${brokenInternal.size} broken internal link target(s):\n`);
  for (const [url, pageSet] of [...brokenInternal].sort()) {
    const list = [...pageSet];
    const shown = list.slice(0, 4).join(', ');
    const more = list.length > 4 ? ` (+${list.length - 4} more)` : '';
    console.error(`  ${url}`);
    console.error(`      ${pageSet.size} page(s): ${shown}${more}`);
  }
} else {
  console.log('✓ every internal href/src resolves to a built file');
}

if (CHECK_EXTERNAL) {
  console.log(
    `\nProbing ${externalUrls.size} unique external URL(s)` +
      ` (skipped ${selfLinkSkipped} own-domain absolute link(s) and ${relSkipped} preconnect/preload origin(s))…`,
  );
  const problems = [];

  const entries = [...externalUrls.keys()];
  const CONCURRENCY = 6;
  let cursor = 0;

  async function probe(url) {
    const opts = {
      redirect: 'follow',
      headers: {
        // Some vendor sites 403 a default fetch UA.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
      },
      signal: AbortSignal.timeout(20000),
    };
    try {
      // GET, not HEAD: a parked-domain lander is only visible in the body, and
      // plenty of real hosts reject HEAD outright.
      const res = await fetch(url, { ...opts, method: 'GET' });
      let body = (await res.text()).slice(0, 4000);
      let finalUrl = res.url || url;

      // Parking services commonly bounce through a JS redirect that fetch()
      // cannot execute, so the first response looks like an empty 200. That is
      // the whole reason a status-code check passes a for-sale domain: the real
      // revparty.com body is 114 bytes of `window.location.href="/lander"`.
      // Follow one hop by hand so the signals below are actually reachable.
      const jsHop = body.match(/(?:window\.)?location(?:\.href)?\s*=\s*["']([^"']+)["']|location\.replace\(\s*["']([^"']+)["']/i);
      if (jsHop && body.length < 2000) {
        const target = jsHop[1] || jsHop[2];
        try {
          const hopUrl = new URL(target, finalUrl).toString();
          const hop = await fetch(hopUrl, { ...opts, method: 'GET' });
          finalUrl = hop.url || hopUrl;
          body = (await hop.text()).slice(0, 4000);
        } catch {
          // Hop failed. Fall through — the near-empty-JS-redirect body is
          // itself reported below rather than silently passing.
        }
      }

      const bodyLc = body.toLowerCase();
      const finalLc = finalUrl.toLowerCase();
      const parked = PARKED_SIGNALS.find((s) => finalLc.includes(s) || bodyLc.includes(s));
      const botBlocked = BOT_BLOCK_CODES.has(res.status);

      if (parked) {
        // Checked before the bot-block branch: a parking host answering 403 is
        // still a parking host.
        problems.push({ url, kind: 'PARKED', detail: `HTTP ${res.status} but resolves to "${parked}" — domain-sale or parking page, not the business (final: ${finalUrl})` });
      } else if (botBlocked) {
        problems.push({ url, kind: `BOT-BLOCKED (HTTP ${res.status})`, detail: 'refused an automated fetch; verify in a browser', inconclusive: true });
      } else if (jsHop && body.length < 2000) {
        problems.push({ url, kind: 'JS-REDIRECT STUB', detail: `HTTP ${res.status} with a near-empty JS-redirect body (final: ${finalUrl}). Open it in a browser — this shape is typical of parked and expired domains.` });
      } else if (!res.ok) {
        problems.push({ url, kind: `HTTP ${res.status}`, detail: res.url && res.url !== url ? `final: ${res.url}` : '' });
      } else if (res.url && baseHost(res.url) !== baseHost(url)) {
        // Not a failure, but a listicle citing a vendor whose domain now
        // redirects elsewhere is usually reporting a merger it hasn't noticed.
        // www/non-web variants are ignored by baseHost().
        problems.push({ url, kind: 'REDIRECTS OFF-HOST', detail: `→ ${res.url}`, warn: true });
      }
    } catch (err) {
      const msg = String(err?.cause?.code || err?.message || err);
      problems.push({ url, kind: 'UNREACHABLE', detail: msg });
    }
  }

  async function worker() {
    while (cursor < entries.length) {
      const url = entries[cursor++];
      await probe(url);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const hard = problems.filter((p) => !p.warn && !p.inconclusive);
  const warns = problems.filter((p) => p.warn);
  const unknown = problems.filter((p) => p.inconclusive);

  if (hard.length) {
    failed = true;
    console.error(`\n✗ ${hard.length} external link problem(s):\n`);
    for (const p of hard) {
      console.error(`  [${p.kind}] ${p.url}`);
      if (p.detail) console.error(`      ${p.detail}`);
      console.error(`      linked from: ${[...externalUrls.get(p.url)].slice(0, 3).join(', ')}`);
    }
  } else {
    console.log('✓ no broken, dead or parked external links');
  }

  if (warns.length) {
    console.log(`\n⚠ ${warns.length} off-host redirect(s) — verify the vendor hasn't merged or rebranded:\n`);
    for (const p of warns) console.log(`  ${p.url}\n      ${p.detail}`);
  }

  if (unknown.length) {
    console.log(`\n· ${unknown.length} inconclusive (bot-blocked, not a failure) — spot-check in a browser:\n`);
    for (const p of unknown) console.log(`  [${p.kind}] ${p.url}`);
  }
}

console.log();
if (failed) {
  console.error('LINK GATE: FAIL');
  process.exit(1);
}
console.log('LINK GATE: PASS');
