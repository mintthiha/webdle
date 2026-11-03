// Makes each client's downloadable CV (public/cv/<slug>.pdf) by printing the built
// /classic/<slug>/cv/ page; its print styles (components/ClassicCV.astro) keep only the sheet.
// Run `npm run cv` after changing a client config, and commit the PDFs.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { dist, openSite, root, sleep } from './headless.mjs';

const classic = path.join(dist, 'classic');
/** Every built CV page: /classic/<slug>/cv/ makes <slug>.pdf, and a French /fr/cv/ makes <slug>-fr.pdf. */
const prints = readdirSync(classic, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .flatMap((d) => [
    { url: `/classic/${d.name}/cv/`, file: `${d.name}.pdf` },
    { url: `/classic/${d.name}/fr/cv/`, file: `${d.name}-fr.pdf` },
  ])
  .filter((p) => existsSync(path.join(dist, p.url, 'index.html')));
if (prints.length === 0) throw new Error('No /classic/<client>/cv/ pages in dist/. Run `npm run build` first.');

const { base, send, close } = await openSite();
const outs = [path.join(root, 'public', 'cv'), path.join(dist, 'cv')];
for (const out of outs) mkdirSync(out, { recursive: true });

for (const { url, file } of prints) {
  await send('Page.navigate', { url: base + url });
  await sleep(1500);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true });
  const { data } = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
  // public/ is the copy that is kept; dist/ gets one too so this build can be deployed as it is.
  for (const out of outs) writeFileSync(path.join(out, file), Buffer.from(data, 'base64'));
  console.log(`cv/${file}`);
}

await close();
process.exit(0);
