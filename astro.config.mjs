import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// [TODO: site] set to the real deployed URL; required for sitemap + canonical URLs
export default defineConfig({
  vite: { plugins: [tailwindcss()] },
});
