import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// [TODO: site] set to the real deployed URL; required for sitemap, canonical URLs and link previews.
// Until it is written here, SITE_URL=https://... in the build environment does the same.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  vite: { plugins: [tailwindcss()] },
});
