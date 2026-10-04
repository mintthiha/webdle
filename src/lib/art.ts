/**
 * Generative vector art. Everything here is deterministic (seeded) and original,
 * so the demo needs no stock photos or real people's likenesses. Colours come from
 * CSS custom properties (--art-1..5, --art-sky, --art-sun, --cv-bg, --cv-ink) so each
 * design direction re-skins the same shapes.
 */

export type Motif = 'teacher' | 'writer';

const f = (n: number) => Math.round(n * 10) / 10;

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: string | number) {
  let a = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 2D value noise in [0,1]. */
export function noise2(seed: number) {
  const lat = (x: number, y: number) => {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = lat(xi, yi);
    const b = lat(xi + 1, yi);
    const c = lat(xi, yi + 1);
    const d = lat(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

type Pt = [number, number];

/** Catmull-Rom spline through points as an SVG path. */
function spline(pts: Pt[], closed: boolean): string {
  const n = pts.length;
  const get = (i: number): Pt => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

function blob(cx: number, cy: number, radius: number, wobble: number, rnd: () => number, points = 8): string {
  const pts: Pt[] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (1 - wobble + rnd() * wobble * 2);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return spline(pts, true);
}

const mix = (a: string, b: string, t: number) =>
  `color-mix(in oklab, var(${a}) ${f((1 - t) * 100)}%, var(${b}) ${f(t * 100)}%)`;

const svg = (w: number, h: number, inner: string, aspect = 'xMidYMid slice') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="${aspect}" aria-hidden="true" focusable="false">${inner}</svg>`;

/* ------------------------------------------------------------------ */
/* Landscapes: layered ridges (teacher) or sea (writer)                */
/* ------------------------------------------------------------------ */

/** `data-d` on the sun and on each layer is its depth, 0 (far) to 1 (near), for scroll parallax. */
export function landscape(opts: {
  seed: string;
  motif: Motif;
  w?: number;
  h?: number;
  layers?: number;
  amp?: number;
  sunSize?: number;
}) {
  const W = opts.w ?? 800;
  const H = opts.h ?? 1000;
  const layers = opts.layers ?? 8;
  const ampScale = opts.amp ?? 1;
  const r = rng(opts.seed);
  const n = noise2(hashString(opts.seed));
  let out = `<rect width="${W}" height="${H}" style="fill:var(--art-sky)"/>`;
  const sx = W * (0.28 + r() * 0.44);
  const sy = H * 0.3;
  const sr = H * (opts.sunSize ?? 0.1);
  out += `<circle data-d="0.12" cx="${f(sx)}" cy="${f(sy)}" r="${f(sr)}" style="fill:var(--art-sun)"/>`;
  if (opts.motif === 'writer') {
    out += `<circle data-d="0.12" cx="${f(sx + sr * 0.35)}" cy="${f(sy - sr * 0.1)}" r="${f(sr * 0.86)}" style="fill:var(--art-sky)"/>`;
  }
  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1);
    const base = H * (0.4 + i * (0.56 / layers));
    const amp = H * (0.17 - t * 0.12) * ampScale;
    const fill = mix('--art-far', '--art-near', t);
    let d = `M0,${H}`;
    const step = 16;
    for (let x = 0; x <= W + step; x += step) {
      let y: number;
      if (opts.motif === 'teacher') {
        y = base - n(x * 0.004 + i * 7.3, i * 3.1) * amp;
      } else {
        y =
          base -
          amp * 0.45 +
          Math.sin(x * (0.012 + t * 0.01) + i * 1.7) * amp * 0.28 +
          (n(x * 0.006, i * 2.2) - 0.5) * amp * 0.3;
      }
      d += `L${x},${f(y)}`;
    }
    d += `L${W + step},${H}Z`;
    out += `<path data-d="${f(t)}" d="${d}" style="fill:${fill}"/>`;
    if (opts.motif === 'writer' && i === Math.floor(layers * 0.45)) {
      const bx = W * (0.55 + r() * 0.25);
      const by = base - amp * 0.45;
      out += `<path class="art-boat" data-d="${f(t)}" d="M${f(bx)},${f(by - 70)} L${f(bx + 34)},${f(by - 8)} L${f(bx)},${f(by - 8)}Z M${f(bx - 6)},${f(by - 58)} L${f(bx - 6)},${f(by - 8)} L${f(bx - 36)},${f(by - 8)}Z" style="fill:var(--art-sun)"/>`;
    }
  }
  return svg(W, H, out);
}

/* ------------------------------------------------------------------ */
/* Rosette: engraved seal from rotated ellipses                        */
/* ------------------------------------------------------------------ */

export function rosette(opts: { seed: string; rings?: number }) {
  const r = rng(opts.seed);
  const N = opts.rings ?? 40;
  const R = 190;
  const ratio = 0.3 + r() * 0.12;
  let out = '';
  for (let k = 0; k < N; k++) {
    out += `<ellipse pathLength="1" style="--n:${k}" cx="200" cy="200" rx="${R}" ry="${f(R * ratio)}" transform="rotate(${f((k * 180) / N)} 200 200)"/>`;
  }
  out += [1, 0.62, 0.2].map((k, i) => `<circle pathLength="1" style="--n:${N + i * 4}" cx="200" cy="200" r="${R * k}"/>`).join('');
  return svg(400, 400, `<g fill="none" stroke="currentColor" stroke-width="0.8">${out}</g>`, 'xMidYMid meet');
}

/* ------------------------------------------------------------------ */
/* Generated book / course covers                                      */
/* ------------------------------------------------------------------ */

function wrapWords(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = (line + ' ' + word).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function cover(opts: { title: string; sub?: string; seed?: string; kind?: number }) {
  const seed = opts.seed ?? opts.title;
  const r = rng(seed);
  const kind = opts.kind ?? hashString(seed) % 4;
  const cid = `c${hashString(seed).toString(36)}`;
  const W = 300;
  const H = 420;
  const pick = () => `var(--art-${1 + Math.floor(r() * 5)})`;
  let art = '';
  if (kind === 0) {
    // concentric arches
    const cx = W / 2;
    for (let i = 6; i >= 1; i--) {
      const rad = i * 22;
      art += `<path d="M${cx - rad},275 L${cx - rad},${275 - rad} A${rad},${rad} 0 0 1 ${cx + rad},${275 - rad} L${cx + rad},275Z" style="fill:${i % 2 ? pick() : 'var(--cv-bg)'}"/>`;
    }
  } else if (kind === 1) {
    // sun over banded horizon
    art += `<circle cx="${f(W * (0.3 + r() * 0.4))}" cy="150" r="80" style="fill:${pick()}"/>`;
    for (let i = 0; i < 6; i++) {
      art += `<rect x="0" y="${172 + i * 20}" width="${W}" height="${5 + i * 3}" style="fill:${pick()}"/>`;
    }
  } else if (kind === 2) {
    // overlapping circles
    for (let i = 0; i < 5; i++) {
      art += `<circle cx="${f(60 + r() * 180)}" cy="${f(90 + r() * 170)}" r="${f(40 + r() * 50)}" style="fill:${pick()};mix-blend-mode:multiply"/>`;
    }
  } else {
    // diagonal stripes
    for (let i = 0; i < 9; i++) {
      art += `<rect x="${i * 44 - 120}" y="0" width="${14 + (i % 3) * 8}" height="${H}" transform="rotate(24 150 210)" style="fill:${pick()}"/>`;
    }
  }
  const lines = wrapWords(opts.title, 11).slice(0, 3);
  const size = lines.length > 2 ? 25 : 30;
  const text = lines
    .map((ln, i) => `<tspan x="22" dy="${i === 0 ? 0 : f(size * 1.08)}">${esc(ln)}</tspan>`)
    .join('');
  const ty = 303 + size;
  const sub = opts.sub
    ? `<text x="22" y="${H - 16}" style="fill:var(--cv-ink)" font-size="12" opacity=".8">${esc(opts.sub)}</text>`
    : '';
  const inner =
    `<rect width="${W}" height="${H}" style="fill:var(--cv-bg)"/>` +
    `<defs><clipPath id="${cid}"><rect width="${W}" height="285"/></clipPath></defs><g clip-path="url(#${cid})">${art}</g>` +
    `<text x="22" y="${f(ty)}" font-size="${size}" style="fill:var(--cv-ink);font-family:var(--cv-font,inherit);font-weight:var(--cv-weight,600)">${text}</text>` +
    sub;
  return svg(W, H, inner, 'xMidYMid meet');
}

/* ------------------------------------------------------------------ */
/* Collage: soft organic shapes with a paper grain                     */
/* ------------------------------------------------------------------ */

/** Each shape sits in its own `g.art-piece`, numbered in `--n`, so a direction can move the pieces. */
export function collage(opts: { seed: string; w?: number; h?: number }) {
  const W = opts.w ?? 800;
  const H = opts.h ?? 800;
  const r = rng(opts.seed);
  const id = `g${hashString(opts.seed).toString(36)}`;
  const col = () => `var(--art-${1 + Math.floor(r() * 5)})`;
  const cells: Pt[] = [];
  const cols = 3;
  const rows = 3;
  for (let cx = 0; cx < cols; cx++) for (let cy = 0; cy < rows; cy++) cells.push([cx, cy]);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  let out = `<rect width="${W}" height="${H}" style="fill:var(--art-bg)"/>`;
  const cw = W / cols;
  const ch = H / rows;
  const kinds = ['blob', 'circle', 'half', 'ring', 'squiggle', 'spark', 'pill', 'blob', 'circle'];
  cells.forEach(([gx, gy], i) => {
    const cx = gx * cw + cw / 2 + (r() - 0.5) * cw * 0.3;
    const cy = gy * ch + ch / 2 + (r() - 0.5) * ch * 0.3;
    const size = Math.min(cw, ch) * (0.38 + r() * 0.22);
    const k = kinds[i % kinds.length];
    let shape: string;
    if (k === 'blob') {
      shape = `<path d="${blob(cx, cy, size, 0.28, r)}" style="fill:${col()}"/>`;
    } else if (k === 'circle') {
      shape = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(size * 0.85)}" style="fill:${col()}"/>`;
    } else if (k === 'half') {
      shape = `<path d="M${f(cx - size)},${f(cy)} A${f(size)},${f(size)} 0 0 1 ${f(cx + size)},${f(cy)}Z" transform="rotate(${f(r() * 360)} ${f(cx)} ${f(cy)})" style="fill:${col()}"/>`;
    } else if (k === 'ring') {
      shape = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(size * 0.7)}" fill="none" stroke-width="${f(size * 0.22)}" style="stroke:${col()}"/>`;
    } else if (k === 'squiggle') {
      const pts: Pt[] = [];
      for (let s = 0; s < 6; s++) pts.push([cx - size + (s * size * 2) / 5, cy + (s % 2 ? -1 : 1) * size * 0.35]);
      shape = `<path d="${spline(pts, false)}" fill="none" stroke-width="${f(size * 0.2)}" stroke-linecap="round" style="stroke:${col()}"/>`;
    } else if (k === 'spark') {
      const pts: string[] = [];
      for (let s = 0; s < 16; s++) {
        const a = (s / 16) * Math.PI * 2;
        const rr = s % 2 ? size * 0.28 : size * 0.95;
        pts.push(`${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`);
      }
      shape = `<polygon points="${pts.join(' ')}" style="fill:${col()}"/>`;
    } else {
      shape = `<rect x="${f(cx - size)}" y="${f(cy - size * 0.38)}" width="${f(size * 2)}" height="${f(size * 0.76)}" rx="${f(size * 0.38)}" transform="rotate(${f(r() * 60 - 30)} ${f(cx)} ${f(cy)})" style="fill:${col()}"/>`;
    }
    out += `<g class="art-piece" style="--n:${i}">${shape}</g>`;
  });
  const defs = `<defs><filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${hashString(opts.seed) % 100}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter></defs>`;
  out += `<rect width="${W}" height="${H}" filter="url(#${id})" opacity="0.35" style="mix-blend-mode:multiply"/>`;
  return svg(W, H, defs + out);
}

/* ------------------------------------------------------------------ */
/* Overprint: wood type in three transparent inks                      */
/* ------------------------------------------------------------------ */

/**
 * A few fat letters, each printed in its own ink and lapped over its neighbour so the overlaps
 * mix. `advance` is each letter's width in ems, since SVG cannot measure the face for us.
 */
export function overprint(opts: { letters: { ch: string; advance: number }[]; w?: number; h?: number }) {
  const W = opts.w ?? 900;
  const H = opts.h ?? 600;
  const lap = 0.1;
  const span = opts.letters.reduce((sum, l) => sum + l.advance - lap, lap);
  const size = Math.min((W * 0.86) / span, H * 1.05);
  let x = (W - span * size) / 2;
  let out = '';
  opts.letters.forEach((l, i) => {
    out += `<text x="${f(x)}" y="${f(H / 2 + size * 0.3)}" style="fill:var(--art-${(i % 3) + 1});mix-blend-mode:multiply">${esc(l.ch)}</text>`;
    x += (l.advance - lap) * size;
  });
  return svg(W, H, `<g font-size="${f(size)}" style="font-family:var(--cv-font,serif);font-weight:900">${out}</g>`);
}

/* ------------------------------------------------------------------ */
/* Marble: the combed endpaper of a bound book                         */
/* ------------------------------------------------------------------ */

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

/**
 * Colours combed into each other. The noise is cut into bands, each band takes a colour, and a
 * second noise drags the bands out of line. A ground colour takes a run of bands and lies wide; a
 * vein takes one and runs thin. Colours are #rrggbb, since an SVG filter cannot read CSS custom
 * properties. The noise keeps to the middle of its range, so the colours are dealt across it many
 * times over.
 */
export function marble(opts: { seed: string; grounds: string[]; veins: string[]; w?: number; h?: number }) {
  const W = opts.w ?? 1600;
  const H = opts.h ?? 640;
  const r = rng(opts.seed);
  const id = `m${hashString(opts.seed).toString(36)}`;
  const seed = hashString(opts.seed) % 997;
  const bands: string[] = [];
  while (bands.length < 60) {
    const vein = r() < 0.36;
    const pool = vein ? opts.veins : opts.grounds;
    const c = pool[Math.floor(r() * pool.length)];
    if (c === bands[bands.length - 1]) continue;
    const run = vein ? 1 : 2 + Math.floor(r() * 3);
    for (let k = 0; k < run; k++) bands.push(c);
  }
  const table = (k: number) => bands.map((c) => channels(c)[k].toFixed(3)).join(' ');
  const pad = 140;
  const filter =
    `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0075" numOctaves="3" seed="${seed}"/>` +
    `<feColorMatrix values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1"/>` +
    `<feComponentTransfer result="bands"><feFuncR type="discrete" tableValues="${table(0)}"/><feFuncG type="discrete" tableValues="${table(1)}"/><feFuncB type="discrete" tableValues="${table(2)}"/></feComponentTransfer>` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="${seed + 11}" result="comb"/>` +
    `<feDisplacementMap in="bands" in2="comb" scale="90" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feGaussianBlur stdDeviation="0.85"/>` +
    `</filter>`;
  return svg(
    W,
    H,
    `<defs>${filter}</defs><rect x="${-pad}" y="${-pad}" width="${W + pad * 2}" height="${H + pad * 2}" filter="url(#${id})"/>`,
  );
}

/* ------------------------------------------------------------------ */
/* Horizon: still sun/moon over water (quiet)                          */
/* ------------------------------------------------------------------ */

/** The sun is `.art-sun` and each line of its path on the water an `.art-glint`, numbered in `--n`. */
export function horizon(opts: { seed: string; motif: Motif; w?: number; h?: number }) {
  const W = opts.w ?? 1200;
  const H = opts.h ?? 600;
  const r = rng(opts.seed);
  const id = `h${hashString(opts.seed).toString(36)}`;
  const hy = H * 0.62;
  const sx = W * (0.3 + r() * 0.4);
  const sr = H * (opts.motif === 'teacher' ? 0.2 : 0.13);
  let out = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--art-1)"/><stop offset="1" style="stop-color:var(--art-2)"/></linearGradient></defs>`;
  out += `<rect width="${W}" height="${f(hy)}" fill="url(#${id})"/>`;
  out += `<circle class="art-sun" cx="${f(sx)}" cy="${f(hy - sr * 0.55)}" r="${f(sr)}" style="fill:var(--art-sun)"/>`;
  out += `<rect y="${f(hy)}" width="${W}" height="${f(H - hy)}" style="fill:var(--art-3)"/>`;
  for (let i = 0; i < 14; i++) {
    const y = hy + 6 + i * i * 1.6 + i * 3;
    if (y > H - 2) break;
    const w = sr * (1.6 - i * 0.07) * (0.6 + r() * 0.8);
    out += `<rect class="art-glint" x="${f(sx - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(1.5 + i * 0.25)}" rx="1" style="fill:var(--art-sun);opacity:${f(0.75 - i * 0.045)};--n:${i}"/>`;
  }
  out += `<rect y="${f(hy - 1)}" width="${W}" height="1.5" style="fill:var(--art-4)"/>`;
  return svg(W, H, out);
}
