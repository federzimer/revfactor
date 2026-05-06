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
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
