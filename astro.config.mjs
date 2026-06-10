import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Production serves on www.revfactor.io (revfactor.io 307s to www).
  // Canonical + sitemap + OG URLs must match the served host or Google
  // sees a self-referential redirect loop on canonicalization.
  site: 'https://www.revfactor.io',
  // Static by default (pages prerender); the `*-local` API routes opt out via
  // `prerender = false` and ship as serverless functions on Vercel. Adapter added
  // on the staging branch so the AirROI/lead endpoints work on a deployed URL.
  adapter: vercel(),
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
