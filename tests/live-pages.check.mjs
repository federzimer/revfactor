#!/usr/bin/env node
/**
 * Does the LIVE SITE serve every post this repo contains?
 *
 * Written 2026-08-26, after www.revfactor.io spent at least a day serving a
 * build old enough to be missing two published posts. Both answered 404, both
 * had left the sitemap (16 URLs -> 14), and both had been scanned live by the
 * weekly toolkit sweep three days earlier. Nothing anyone would check was red:
 * the commits were on main, the build passed, the Vercel deployment for main's
 * head was status SUCCESS, and requesting that deployment's own URL returned
 * all sixteen pages. The domain was simply pointed at an older build, and a
 * domain alias is not part of the repo, the build, the CI, or the host's
 * deployment record. Only a probe of the live host can see it.
 *
 * So this gate compares two things that nothing else in the pipeline compares:
 * the posts in `src/content/blog/` and the pages `www.revfactor.io` actually
 * serves. It deliberately does NOT read `dist/` — `dist/` is whatever the last
 * local build left behind, so a gate reading it compares the repo with itself
 * and passes on a stale deploy.
 *
 * Not in `npm run build`. It hits the live host, so it belongs in the publish
 * step and in a cron, not in a build that runs on every push.
 *
 *   node tests/live-pages.check.mjs
 *   node tests/live-pages.check.mjs --url https://www.revfactor.io
 *   node tests/live-pages.check.mjs --selftest
 */

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_HOST = 'https://www.revfactor.io';
const BRAND = /\bRevFactor\b/i;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Accept `--flag value` AND `--flag=value`, and REFUSE a flag with no value.
 * The obvious one-liner — find(a => a.startsWith('--url')).replace(/^--url=?/, '')
 * — yields '' on the space-separated form and then falls back to the default,
 * so the gate measures a different target and prints a green run about it.
 */
function flag(name) {
  const argv = process.argv.slice(2);
  const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (i === -1) return null;
  const value = argv[i].includes('=') ? argv[i].split('=').slice(1).join('=') : argv[i + 1];
  if (!value || value.startsWith('--') || !/^https?:\/\//.test(value)) {
    console.error(`--${name} needs an absolute URL. Got: ${value ?? '(nothing)'}`);
    process.exit(1);
  }
  return value.replace(/\/+$/, '');
}

const SELFTEST = process.argv.includes('--selftest');
const HOST = flag('url') ?? DEFAULT_HOST;

const rows = [];
const record = (ok, msg) => { rows.push({ ok, msg }); console.log(`${ok ? '  ok  ' : '  FAIL'}  ${msg}`); };

/**
 * PATH only, never origin. A deployment's sitemap emits the canonical
 * `site` host (www.revfactor.io) whatever URL you fetched it from, so
 * comparing origins reports every page as missing when the gate is aimed at a
 * preview or at a deployment URL — which is exactly when you most need it, and
 * a wall of red on a healthy build is how a gate gets deleted. Which HOST is
 * being measured is settled by the brand guard above, not here.
 */
const norm = (u) => {
  try { return new URL(u, 'https://x.invalid').pathname.replace(/\/+$/, '') || '/'; }
  catch { return u; }
};

async function get(url) {
  // GET, not HEAD: they hit different CDN cache entries and can disagree.
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': UA, 'Cache-Control': 'no-cache' },
  });
  return { status: res.status, url: res.url, text: await res.text() };
}

/** Every post slug in the repo. Drafts excluded, and a draft flag is READ
 *  rather than assumed absent — a post held back on purpose must not read as
 *  a missing page, which is the same failure with the blame reversed. */
async function repoPosts() {
  const dir = join(ROOT, 'src', 'content', 'blog');
  const files = (await readdir(dir)).filter((f) => /\.mdx?$/.test(f));
  const out = [];
  for (const f of files) {
    const src = await readFile(join(dir, f), 'utf8');
    const fm = src.slice(0, src.indexOf('---', 3));
    if (/^draft:\s*true\s*$/m.test(fm)) continue;
    out.push(f.replace(/\.mdx?$/, ''));
  }
  return out.sort();
}

async function sitemapUrls(host) {
  const index = await get(`${host}/sitemap-index.xml`);
  if (index.status !== 200) throw new Error(`sitemap-index.xml -> ${index.status}`);
  const children = [...index.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (!/<sitemapindex/.test(index.text)) return children;
  const out = [];
  for (const child of children) {
    // Re-host the child onto the host under test. A sitemap index emits the
    // CANONICAL host in every child <loc> whatever URL you fetched it from, so
    // following it verbatim silently leaves the host you were told to measure
    // and reads the live site instead — which, aimed at a preview or at a
    // deployment URL, is a gate reporting on production and calling it the
    // preview. Measured 2026-08-26: the deployment URL's index pointed at
    // https://www.revfactor.io/sitemap-0.xml.
    const url = new URL(new URL(child).pathname, host).toString();
    const r = await get(url);
    if (r.status !== 200) throw new Error(`${url} -> ${r.status}`);
    out.push(...[...r.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
  }
  return out;
}

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'")
                       .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function main() {
  console.log(`live-pages gate -> ${HOST}${SELFTEST ? '  [SELFTEST]' : ''}\n`);

  // 0. Is this even the right site? A gate that measured somebody else's host
  //    and passed is worse than no gate. Entities decoded: the built markup
  //    holds &amp; while a rendered title does not, and a guard that exits 1
  //    on the CORRECT page is the one that gets deleted.
  const home = await get(`${HOST}/`);
  const title = decode((home.text.match(/<title[^>]*>([^<]*)<\/title>/i) || [, ''])[1]);
  record(home.status === 200 && BRAND.test(title),
         `the host is RevFactor's (title: ${JSON.stringify(title.slice(0, 60))})`);
  if (!BRAND.test(title)) {
    console.error('\nRefusing to measure a host that is not this site.');
    process.exit(1);
  }

  const posts = await repoPosts();
  console.log(`\n  premise: ${posts.length} non-draft post(s) in src/content/blog/\n`);
  if (posts.length === 0) {
    console.error('No posts found — this gate has nothing to assert and must not pass.');
    process.exit(1);
  }

  let live;
  try {
    live = await sitemapUrls(HOST);
  } catch (e) {
    console.error(`\nCould not read the live sitemap (${e.message}). That is not an ` +
                  'all-clear, so this exits 1 rather than skipping.');
    process.exit(1);
  }
  const inSitemap = new Set(live.map(norm));
  console.log(`  premise: ${inSitemap.size} URL(s) in the live sitemap\n`);

  // 1. Every post in the repo is served, and is in the sitemap. Two claims,
  //    reported separately: a page missing from the sitemap while still
  //    answering 200 is the first symptom of the deploy that will 404 it.
  for (const slug of posts) {
    const url = `${HOST}/blog/${SELFTEST && slug === posts[0] ? `${slug}-selftest` : slug}/`;
    const r = await get(url);
    record(r.status === 200, `/blog/${slug}/ is served (${r.status})`);
    record(inSitemap.has(norm(url)) || (SELFTEST && slug === posts[0]),
           `/blog/${slug}/ is in the live sitemap`);
  }

  // 2. The reverse: a post the live site serves that the repo no longer has.
  //    A deleted post still being served is the same stale-deploy symptom
  //    pointing the other way, and no build can see it either.
  const repoPaths = new Set(posts.map((s) => norm(`${HOST}/blog/${s}/`)));
  const orphans = [...inSitemap].filter(
    (u) => /\/blog\/[^/]+$/.test(u) && !repoPaths.has(u));
  record(orphans.length === 0,
         `no post is served that the repo does not have${orphans.length ? `: ${orphans.join(', ')}` : ''}`);

  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} checks passed`);
  if (failed.length) {
    console.log(
      '\nA post in the repo that 404s on the live host usually means the DOMAIN is\n' +
      'pointed at an older deployment — not that the build is broken. Check the\n' +
      "host's current production deployment and request its own URL directly: if\n" +
      'that serves the page and the domain does not, re-point the domain.');
  }
  if (SELFTEST) {
    const armed = failed.length >= 2;
    console.log(armed
      ? '\nselftest: ARMED — the injected missing post turned rows red.'
      : '\nselftest: NOTHING WENT RED — this gate cannot fail, which is worse than no gate.');
    process.exit(armed ? 0 : 1);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
