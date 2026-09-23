/**
 * Case-study imagery helpers.
 *
 * Every case study is anonymized, so the photograph attached to it is a
 * REPRESENTATIVE image of that property type and region, generated with the
 * Gemini image API by `scripts/gen-case-study-images.mjs`. It is never a
 * picture of the real listing, and every surface that renders one has to say
 * so in alt text and in a visible caption.
 *
 * Files follow the house convention: `<slug>-<width>.webp` at 1200 / 1920 /
 * 2400, in `public/photos/case-studies/`.
 */

const BASE = '/photos/case-studies';
const WIDTHS = [1200, 1920, 2400] as const;

export type StudyImage = {
  src: string;
  srcset: string;
  sizes: string;
  alt: string;
};

/** The shared caption. Stated once, used everywhere an image renders. */
export const REPRESENTATIVE_CAPTION =
  'Representative image, generated for illustration. Properties are not identified.';

function srcsetFor(slug: string): string {
  return WIDTHS.map((w) => `${BASE}/${slug}-${w}.webp ${w}w`).join(', ');
}

export const HERO_SLUG = 'index-hero';

export function heroImage(sizes = '100vw'): StudyImage {
  return {
    src: `${BASE}/${HERO_SLUG}-1920.webp`,
    srcset: srcsetFor(HERO_SLUG),
    sizes,
    alt:
      'An aerial view at dusk across a mountain ridge, an inland lake and an open coastline, ' +
      'with scattered vacation rental homes lit from within. A representative illustration of ' +
      'the US markets RevFactor manages in.',
  };
}

type StudyLike = {
  bedrooms: number;
  city: string;
  state: string;
  market?: string;
};

export function studyImageAlt(data: StudyLike): string {
  const place =
    data.market && data.market !== `${data.city}, ${data.state}`
      ? data.market
      : `${data.city}, ${data.state}`;
  return `A representative ${data.bedrooms}-bedroom short-term rental property in the ${place} area. Not the listing described in this case study.`;
}

export function studyImage(slug: string, data: StudyLike, sizes: string): StudyImage {
  return {
    src: `${BASE}/${slug}-1920.webp`,
    srcset: srcsetFor(slug),
    sizes,
    alt: studyImageAlt(data),
  };
}

/** 1200 variant, used for OG and Twitter cards. */
export function socialImage(slug: string): string {
  return `${BASE}/${slug}-1200.webp`;
}
