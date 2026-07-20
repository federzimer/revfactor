import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Production serves on www.revfactor.io (revfactor.io 307s to www).
  // Canonical + sitemap + OG URLs must match the served host or Google
  // sees a self-referential redirect loop on canonicalization.
  site: 'https://www.revfactor.io',
  integrations: [
    react(),
    mdx(),
    // Keep noindex PPC landing pages out of the sitemap. Listing a
    // `noindex,nofollow` URL in the sitemap sends Google a mixed signal
    // ("index me" vs the page's "don't"). These three are paid-traffic LPs.
    // Legal/utility pages stay indexable but are excluded too — the sitemap
    // should spend Google's attention on money and blog pages.
    sitemap({
      filter: (page) =>
        ![
          'https://www.revfactor.io/short-term-rental-consultant/',
          'https://www.revfactor.io/vs/pricelabs/',
          'https://www.revfactor.io/airbnb-pricing-strategy/',
          'https://www.revfactor.io/cookies/',
          'https://www.revfactor.io/privacy/',
          'https://www.revfactor.io/terms/',
          'https://www.revfactor.io/feedback/',
          'https://www.revfactor.io/review/',
        ].includes(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
