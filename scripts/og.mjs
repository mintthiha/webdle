// Makes the link-preview images (public/og/*.jpg) by photographing the top of each built page:
// the landing page, and every /<direction>/<client>/. Run after a build: `npm run og`.
import { mkdirSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dist, openSite, root, sleep } from './headless.mjs';

/** Photographed at desktop width, saved at the 1200x630 that link previews expect. */
const VIEW = { width: 1440, height: 756 };
const SCALE = 1200 / VIEW.width;
/** Long enough for each page's arrival animation to finish. */
const SETTLE_MS = 4500;

/** Every /<direction>/<client>/ in the build, named <direction>-<client>, plus the landing page. */
const shots = [{ url: '/', name: 'home' }];
for (const dir of readdirSync(dist, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === '_astro' || dir.name === 'og') continue;
  for (const sub of readdirSync(path.join(dist, dir.name), { withFileTypes: true })) {
    if (sub.isDirectory() && existsSync(path.join(dist, dir.name, sub.name, 'index.html'))) {
      shots.push({ url: `/${dir.name}/${sub.name}/`, name: `${dir.name}-${sub.name}` });
    }
  }
}

const { base, send, close } = await openSite();
await send('Emulation.setDeviceMetricsOverride', { ...VIEW, deviceScaleFactor: 1, mobile: false });
// The demo switcher and the scrollbar belong to the browser window, not to the picture.
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `addEventListener('DOMContentLoaded', () => document.head.insertAdjacentHTML('beforeend', '<style>.demo-bar{display:none!important}html{scrollbar-width:none}</style>'))`,
});

for (const out of [path.join(root, 'public', 'og'), path.join(dist, 'og')]) mkdirSync(out, { recursive: true });
for (const shot of shots) {
  await send('Page.navigate', { url: base + shot.url });
  await sleep(SETTLE_MS);
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, clip: { x: 0, y: 0, ...VIEW, scale: SCALE } });
  // public/ is the copy that is kept; dist/ gets one too so this build can be deployed as it is.
  for (const out of [path.join(root, 'public', 'og'), path.join(dist, 'og')]) {
    writeFileSync(path.join(out, `${shot.name}.jpg`), Buffer.from(data, 'base64'));
  }
  console.log(`og/${shot.name}.jpg`);
}

await close();
process.exit(0);
