// A headless Edge or Chrome looking at the built site, for scripts that photograph or print pages
// (og.mjs, cv.mjs). It serves dist/ on a local port and drives the browser over the DevTools protocol.
// Needs Edge or Chrome installed; set BROWSER_PATH if it is somewhere unusual.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dist = path.join(root, 'dist');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browserPath = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => p && existsSync(p));

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.jpg': 'image/jpeg', '.pdf': 'application/pdf' };

/** Starts the server and the browser. Returns the site's local address, `send` (a DevTools call) and `close`. */
export async function openSite() {
  if (!browserPath) throw new Error('No Edge or Chrome found. Set BROWSER_PATH to a Chromium browser.');
  if (!existsSync(path.join(dist, 'index.html'))) throw new Error('No dist/. Run `npm run build` first.');

  const server = createServer((req, res) => {
    let file = path.join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (file.startsWith(dist) && existsSync(file) && !path.extname(file)) file = path.join(file, 'index.html');
    if (!file.startsWith(dist) || !existsSync(file)) return res.writeHead(404).end();
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const profile = mkdtempSync(path.join(tmpdir(), 'webdle-headless-'));
  const debugPort = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(browserPath, ['--headless=new', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, '--no-first-run', '--enable-unsafe-swiftshader', 'about:blank'], { stdio: 'ignore' });

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

  async function close() {
    ws.close();
    proc.kill();
    server.close();
    await sleep(500);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }
  return { base, send, close };
}
