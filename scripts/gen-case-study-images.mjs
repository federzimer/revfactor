#!/usr/bin/env node
/**
 * Generate case-study imagery via the Gemini image API and export the
 * house-convention WebP set (1200 / 1920 / 2400) into
 * public/photos/case-studies/.
 *
 * All images are AI-generated. They are REPRESENTATIVE of the property type
 * and region only. The case studies are anonymized, so nothing here depicts a
 * real listing, and every consumer of these files must caption them as such.
 *
 * Credentials
 *   Reads the key from the REVFACTOR_GEMINI_API_KEY environment variable.
 *   Never commit the key. Export it at runtime from the secret store:
 *     export REVFACTOR_GEMINI_API_KEY="..."
 *
 * Usage
 *   node scripts/gen-case-study-images.mjs                # every slug in the manifest
 *   node scripts/gen-case-study-images.mjs 6br-gatlinburg-cabin index-hero
 *   node scripts/gen-case-study-images.mjs --slug my-slug --prompt "a cabin at dusk"
 *   node scripts/gen-case-study-images.mjs --force        # overwrite existing files
 *
 * Env knobs
 *   RF_IMAGE_MODEL   default gemini-3-pro-image
 *   RF_IMAGE_SIZE    default 4K  (Gemini 3 image sizes: 1K / 2K / 4K)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'photos', 'case-studies');
/* Raw 4K PNGs are cached here (gitignored) so the WebP set can be re-encoded
   at a different quality without paying for another generation. */
const CACHE_DIR = path.join(ROOT, '.image-cache', 'case-studies');
const WIDTHS = [2400, 1920, 1200];
const MODEL = process.env.RF_IMAGE_MODEL || 'gemini-3-pro-image';
const IMAGE_SIZE = process.env.RF_IMAGE_SIZE || '4K';

/* Shared grade. Every prompt ends with this so the eight studies plus the
   index hero read as one photographic system rather than nine stock picks. */
const HOUSE_GRADE =
  ' Style: photorealistic architectural and landscape photography, shot on a Sony A7R V' +
  ' with a 35mm prime at f/4, natural unfiltered light at golden hour or blue hour, gentle' +
  ' atmospheric haze, real material texture, warm cedar and moss and sandstone palette with' +
  ' deep cool shadows, restrained saturation, calm luxury-hospitality mood, wide cinematic' +
  ' 16:9 framing. Absolutely no people, no faces, no text, no lettering, no signage, no' +
  ' watermarks, no logos, no house numbers, no illustration, no painterly rendering,' +
  ' no HDR halos, no oversaturation.';

/* Darkening clause for images that sit under the fixed cream navbar: the top
   band of the frame has to stay dark or the nav links wash out. */
const DARK_TOP =
  ' The entire upper third of the frame is a deep dark dusk sky, near-black at the very top' +
  ' edge, with no bright highlights, no sun disc and no blown-out clouds in that band.';

const MANIFEST = [
  {
    slug: 'index-hero',
    prompt:
      'A wide cinematic aerial establishing shot at dusk looking across a vast American' +
      ' landscape where several distinct vacation-rental regions meet in one sweeping view:' +
      ' a forested mountain ridge on the left, a broad inland lake in the middle distance,' +
      ' and a flat coastline catching the last light on the right. Scattered single-family' +
      ' homes and cabins glow with small warm interior lights, each one a lit window in the' +
      ' blue hour. The land reads as documented, measured, quiet.' + DARK_TOP,
  },
  {
    slug: '2br-albion-mi-waterfront',
    prompt:
      'A small two-bedroom Midwestern waterfront cottage in southern Michigan, white clapboard' +
      ' and cedar shingle, sitting a few steps above a calm inland lake with reeds at the' +
      ' waterline and a short wooden dock. Late-summer maples and oaks behind it. Warm light' +
      ' in two windows at dusk, still water holding the reflection.' + DARK_TOP,
  },
  {
    slug: '2br-glenwood-springs-co-cabin',
    prompt:
      'A compact two-bedroom timber cabin in a Colorado Rocky Mountain river valley near' +
      ' Glenwood Springs, dark stained wood and a low stone base, set among aspens and' +
      ' ponderosa pine with steep canyon walls rising behind it. A narrow river below catches' +
      ' the last alpenglow. Two windows lit warm at blue hour.' + DARK_TOP,
  },
  {
    slug: '3br-norton-shores-mi-lake-home',
    prompt:
      'A three-bedroom Michigan lake home near the Lake Michigan shoreline, pale grey siding' +
      ' with a screened porch and a deck facing the water, dune grass and birch at the edge of' +
      ' the lot, a wooden stair path down toward the shore. Flat open water, wide horizon,' +
      ' warm interior light at dusk.' + DARK_TOP,
  },
  {
    slug: '4br-minneapolis-metro-home',
    prompt:
      'A four-bedroom two-storey suburban home in the Minneapolis metro, dark brick and light' +
      ' horizontal siding with a deep front gable, a mature boulevard of elms and maples along' +
      ' the quiet residential street, clipped lawn and a concrete drive. Early-autumn Midwest' +
      ' light, windows warm, the street empty at dusk.' + DARK_TOP,
  },
  {
    slug: '4br-norfolk-va-home',
    prompt:
      'A four-bedroom coastal Virginia home in Norfolk, brick and white trim with a covered' +
      ' front porch and dormer windows, crepe myrtles and live oaks in the yard, a tidewater' +
      ' inlet visible at the end of the block. Humid Atlantic air, soft haze, warm porch and' +
      ' window light at dusk.' + DARK_TOP,
  },
  {
    slug: '4br-san-diego-ca-rental',
    prompt:
      'A four-bedroom Southern California beach rental in San Diego, low-slung stucco and' +
      ' bleached wood with a roof deck and sliding glass, agave and bird of paradise in the' +
      ' front yard, a palm-lined street sloping toward the Pacific. Onshore marine layer' +
      ' softening the last light, interior lights warm at blue hour.' + DARK_TOP,
  },
  {
    slug: '5br-north-myrtle-beach-sc-home',
    prompt:
      'A five-bedroom South Carolina beach house near North Myrtle Beach, raised on pilings' +
      ' with double stacked porches, pale blue siding and white rails, sea oats and a boardwalk' +
      ' crossing the dune to the Atlantic. Wide flat beach, long shoreline, warm porch lights' +
      ' at dusk.' + DARK_TOP,
  },
  {
    slug: '6br-gatlinburg-cabin',
    prompt:
      'A large six-bedroom timber and stone cabin high on a ridge in the Smoky Mountains near' +
      ' Gatlinburg, Tennessee, heavy log walls, a deep wraparound deck and a stone chimney,' +
      ' layered blue ridgelines receding into mist behind it. Hardwood forest all around,' +
      ' several windows glowing warm at dusk.' + DARK_TOP,
  },
];

function apiKey() {
  const k = process.env.REVFACTOR_GEMINI_API_KEY;
  if (!k) {
    console.error(
      'REVFACTOR_GEMINI_API_KEY is not set. Export the RevFactor Gemini key first.'
    );
    process.exit(1);
  }
  return k;
}

async function generate(prompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
    `?key=${apiKey()}`;
  const body = {
    contents: [{ parts: [{ text: prompt + HOUSE_GRADE }] }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '16:9', imageSize: IMAGE_SIZE },
    },
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 600)}`);
  const json = JSON.parse(text);
  const parts = json?.candidates?.[0]?.content?.parts ?? [];
  const inline = parts.find((p) => p.inlineData?.data);
  if (!inline) {
    throw new Error(
      'no image part returned: ' + JSON.stringify(json).slice(0, 600)
    );
  }
  return Buffer.from(inline.inlineData.data, 'base64');
}

async function writeSet(slug, raw) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(path.join(CACHE_DIR, `${slug}.png`), raw);
  const meta = await sharp(raw).metadata();
  const written = [];
  for (const w of WIDTHS) {
    const out = path.join(OUT_DIR, `${slug}-${w}.webp`);
    // Quality steps down as the file gets bigger so the 2400 variant stays
    // under the ~400KB budget the case-study pages are built to.
    // Step quality down until the file clears the per-width byte budget, so a
    // busy frame (lots of foliage) can never ship a 600KB hero.
    const budget = w >= 2400 ? 400 * 1024 : w >= 1920 ? 340 * 1024 : 200 * 1024;
    let q = w >= 2400 ? 82 : w >= 1920 ? 85 : 87;
    let size = Infinity;
    while (true) {
      await sharp(raw).resize({ width: w, withoutEnlargement: false }).webp({ quality: q, effort: 6 }).toFile(out);
      ({ size } = await fs.stat(out));
      if (size <= budget || q <= 60) break;
      q -= 4;
    }
    written.push(`${path.basename(out)} ${(size / 1024).toFixed(0)}KB q${q}`);
  }
  return { source: `${meta.width}x${meta.height}`, written };
}

async function main() {
  const argv = process.argv.slice(2);
  const force = argv.includes('--force');
  const rest = argv.filter((a) => a !== '--force');

  let jobs;
  const slugFlag = rest.indexOf('--slug');
  const promptFlag = rest.indexOf('--prompt');
  if (slugFlag !== -1 && promptFlag !== -1) {
    jobs = [{ slug: rest[slugFlag + 1], prompt: rest[promptFlag + 1] }];
  } else if (rest.length) {
    jobs = MANIFEST.filter((m) => rest.includes(m.slug));
    const missing = rest.filter((s) => !MANIFEST.some((m) => m.slug === s));
    if (missing.length) {
      console.error('unknown slug(s): ' + missing.join(', '));
      process.exit(1);
    }
  } else {
    jobs = MANIFEST;
  }

  let failed = 0;
  for (const job of jobs) {
    const marker = path.join(OUT_DIR, `${job.slug}-2400.webp`);
    if (!force) {
      try {
        await fs.stat(marker);
        console.log(`= ${job.slug}: exists, skipping (use --force to regenerate)`);
        continue;
      } catch { /* not generated yet */ }
    }
    process.stdout.write(`> ${job.slug}: `);
    try {
      let raw = null;
      if (!process.env.RF_IGNORE_CACHE) {
        try {
          raw = await fs.readFile(path.join(CACHE_DIR, `${job.slug}.png`));
          process.stdout.write('re-encoding from raw cache ... ');
        } catch { /* no cached raw yet */ }
      }
      if (!raw) {
        process.stdout.write(`generating via ${MODEL} @ ${IMAGE_SIZE} ... `);
        raw = await generate(job.prompt);
      }
      const { source, written } = await writeSet(job.slug, raw);
      console.log(`ok (source ${source})`);
      written.forEach((w) => console.log(`    ${w}`));
    } catch (err) {
      failed += 1;
      console.log('FAILED');
      console.error(`    ${err.message}`);
    }
  }
  if (failed) process.exit(2);
}

main();
