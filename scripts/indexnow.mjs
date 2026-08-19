#!/usr/bin/env node
/**
 * IndexNow submitter — the final step of the content cadence SOP
 * (docs/CONTENT_CADENCE_SOP.md: "push live → fire IndexNow on every
 * changed/new URL").
 *
 * Bing's IndexNow endpoint is shared with Yandex, Seznam and Naver, so one
 * POST covers all of them. Google does not participate; freshness there still
 * comes from the sitemap plus the `updatedDate` bump.
 *
 * The site verification key is read from the `<key>.txt` file in public/ so
 * there is nothing to configure and no secret to leak (the key is public by
 * design — it lives at the site root).
 *
 * Usage
 *   node scripts/indexnow.mjs --changed              # URLs from uncommitted + last-commit content changes
 *   node scripts/indexnow.mjs <slug|url> [...]       # explicit posts
 *   node scripts/indexnow.mjs --all                  # every blog post + the index
 *   node scripts/indexnow.mjs --changed --dry-run    # show what would be sent
 *
 * Slugs may be bare (`best-airbnb-revenue-management-companies-2026`), a repo
 * path (`src/content/blog/foo.mdx`), a site path (`/blog/foo/`) or a full URL.
 */

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'www.revfactor.io';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BLOG_DIR = join(ROOT, 'src/content/blog');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));

function findKey() {
  const hit = readdirSync(join(ROOT, 'public')).find((f) => /^[0-9a-f]{8,128}\.txt$/i.test(f));
  if (!hit) {
    throw new Error(
      'No IndexNow key file found in public/. Create public/<key>.txt containing the key itself.'
    );
  }
  const key = hit.replace(/\.txt$/i, '');
  const body = readFileSync(join(ROOT, 'public', hit), 'utf8').trim();
  if (body !== key) {
    throw new Error(
      `public/${hit} must contain exactly its own key. Filename says "${key}", contents say "${body}".`
    );
  }
  return key;
}

/** Normalise anything slug-shaped into a canonical absolute post URL. */
function toUrl(raw) {
  let s = String(raw).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s.replace(/\/?$/, '/');
  }
  s = s
    .replace(/^.*src\/content\/blog\//, '')
    .replace(/\.mdx?$/, '')
    .replace(/^\/+|\/+$/g, '');
  if (!s) return `${ORIGIN}/blog/`;
  if (s === 'blog') return `${ORIGIN}/blog/`;
  if (s.startsWith('blog/')) return `${ORIGIN}/${s}/`;
  return `${ORIGIN}/blog/${s}/`;
}

/** Posts touched in the working tree or the most recent commit. */
function changedUrls() {
  const seen = new Set();
  const collect = (cmd) => {
    let out = '';
    try {
      out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
      return;
    }
    for (const line of out.split('\n')) {
      const f = line.trim();
      if (f && /^src\/content\/blog\/.+\.mdx?$/.test(f)) seen.add(toUrl(f));
    }
  };
  collect('git diff --name-only HEAD');
  collect('git diff --cached --name-only');
  collect('git ls-files --others --exclude-standard');
  collect('git diff-tree --no-commit-id --name-only -r HEAD');
  return [...seen];
}

function allUrls() {
  const posts = readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => toUrl(f));
  return [`${ORIGIN}/blog/`, ...posts];
}

async function main() {
  const key = findKey();

  let urls;
  if (flags.has('--all')) urls = allUrls();
  else if (flags.has('--changed')) urls = changedUrls();
  else if (positional.length) urls = positional.map(toUrl);
  else {
    console.error(
      'Nothing to submit. Pass slugs/URLs, or --changed, or --all. See the header of this file.'
    );
    process.exit(2);
  }

  urls = [...new Set(urls)];
  if (!urls.length) {
    console.log('No changed blog posts found — nothing to submit.');
    return;
  }

  console.log(`IndexNow · host ${HOST} · key ${key.slice(0, 8)}… · ${urls.length} URL(s)`);
  for (const u of urls) console.log(`  ${u}`);

  // A 200 from IndexNow only means the payload was accepted. Any URL that
  // 404s or is noindex is silently discarded downstream, so check them first
  // rather than trusting the submit response.
  let bad = 0;
  for (const u of urls) {
    try {
      const r = await fetch(u, { method: 'HEAD', redirect: 'follow' });
      const robots = r.headers.get('x-robots-tag') || '';
      if (!r.ok) {
        console.warn(`  ! ${r.status} ${u}`);
        bad++;
      } else if (/noindex/i.test(robots)) {
        console.warn(`  ! X-Robots-Tag: ${robots} on ${u}`);
        bad++;
      }
    } catch (e) {
      console.warn(`  ! unreachable ${u} (${e.message})`);
      bad++;
    }
  }
  if (bad) {
    console.error(
      `\n${bad} URL(s) are not live-and-indexable. Deploy first, then re-run. ` +
        `Submitting a 404 to IndexNow wastes the ping.`
    );
    if (!flags.has('--force')) process.exit(1);
  }

  if (dryRun) {
    console.log('\n--dry-run: nothing submitted.');
    return;
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `${ORIGIN}/${key}.txt`,
    urlList: urls,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const text = await res.text();

  // 200 accepted · 202 accepted, key pending validation · 400/403/422/429 are real errors
  if (res.status === 200 || res.status === 202) {
    console.log(`\n✓ Submitted (HTTP ${res.status}). ${urls.length} URL(s) sent to IndexNow.`);
  } else {
    console.error(`\n✗ IndexNow returned HTTP ${res.status}. ${text || '(empty body)'}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`indexnow: ${e.message}`);
  process.exit(1);
});
