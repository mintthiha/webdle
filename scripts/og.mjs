// Makes the link-preview images (public/og/*.jpg) by photographing the top of each built page:
// the landing page, and every /<direction>/<client>/. Run after a build: `npm run og`.
// Needs Edge or Chrome installed; set BROWSER_PATH if it is somewhere unusual.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
/** Photographed at desktop width, saved at the 1200x630 that link previews expect. */
const VIEW = { width: 1440, height: 756 };
const SCALE = 1200 / VIEW.width;
/** Long enough for each page's arrival animation to finish. */
const SETTLE_MS = 4500;

const browser = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p));
if (!browser) throw new Error('No Edge or Chrome found. Set BROWSER_PATH to a Chromium browser.');
if (!existsSync(path.join(dist, 'index.html'))) throw new Error('No dist/. Run `npm run build` first.');

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

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg' };
const server = createServer((req, res) => {
  let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (file.startsWith(dist) && existsSync(file) && !path.extname(file)) file = path.join(file, 'index.html');
  if (!file.startsWith(dist) || !existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(path.join(tmpdir(), 'webdle-og-'));
const debugPort = 9300 + Math.floor(Math.random() * 600);
const proc = spawn(browser, ['--headless=new', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--no-first-run', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });

let page;
for (let i = 0; i < 60 && !page; i++) {
  await sleep(250);
  try {
    page = (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()).find((t) => t.type === 'page');
  } catch {}
}
if (!page) throw new Error('The browser did not start.');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  pending.get(msg.id)?.(msg.result);
  pending.delete(msg.id);
};
const send = (method, params = {}) =>
  new Promise((res) => {
    pending.set(++id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send('Page.enable');
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

ws.close();
proc.kill();
server.close();
await sleep(500);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {}
process.exit(0);
