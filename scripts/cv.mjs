// Makes each client's downloadable CV (public/cv/<slug>.pdf) by printing the built
// /classic/<slug>/cv/ page; its print styles (components/ClassicCV.astro) keep only the sheet.
// Run `npm run cv` after changing a client config, and commit the PDFs.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dist, openSite, root, sleep } from './headless.mjs';

const classic = path.join(dist, 'classic');
const slugs = readdirSync(classic, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(path.join(classic, d.name, 'cv', 'index.html')))
  .map((d) => d.name);
if (slugs.length === 0) throw new Error('No /classic/<client>/cv/ pages in dist/. Run `npm run build` first.');

const { base, send, close } = await openSite();
const outs = [path.join(root, 'public', 'cv'), path.join(dist, 'cv')];
for (const out of outs) mkdirSync(out, { recursive: true });

for (const slug of slugs) {
  await send('Page.navigate', { url: `${base}/classic/${slug}/cv/` });
  await sleep(1500);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
  const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  // public/ is the copy that is kept; dist/ gets one too so this build can be deployed as it is.
  for (const out of outs) writeFileSync(path.join(out, `${slug}.pdf`), Buffer.from(data, 'base64'));
  console.log(`cv/${slug}.pdf`);
}

await close();
process.exit(0);
