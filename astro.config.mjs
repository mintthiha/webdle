import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The deployed URL: canonical links and link previews are built from it. SITE_URL=https://... in the
// build environment overrides it, for a staging or preview deploy at another address.
export default defineConfig({
  site: process.env.SITE_URL || 'https://webdle.ca',
  vite: { plugins: [tailwindcss()] },
});
