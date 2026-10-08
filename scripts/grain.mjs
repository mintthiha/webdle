// Makes public/grain.png: a seamless tile of film grain, black at varying opacity.
// The Warmth artwork (src/lib/art.ts, `collage`) lays it over its drawing with `multiply`. It used to
// be an SVG feTurbulence filter, which the browser re-ran every frame while the cut-outs drifted.
// Run only if the grain should change: `node scripts/grain.mjs`. The result is committed.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SIZE = 128;
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'grain.png');

// mulberry32, so the same file comes out every run.
let a = 0x9e3779b9;
const rand = () => {
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Noise, then one soften pass that wraps at the edges so the tile joins up.
const noise = Float32Array.from({ length: SIZE * SIZE }, () => (rand() + rand()) / 2);
const at = (x, y) => noise[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];

// Opacity as the old filter made it: about 0.55 x a noise of mean 0.5.
const raw = Buffer.alloc(SIZE * (SIZE * 2 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 2 + 1)] = 0; // filter type: none
  for (let x = 0; x < SIZE; x++) {
    const soft = at(x, y) * 0.6 + (at(x + 1, y) + at(x - 1, y) + at(x, y + 1) + at(x, y - 1)) * 0.1;
    const alpha = Math.min(1, Math.max(0, 0.55 * (0.5 + (soft - 0.5) * 2.2)));
    const o = y * (SIZE * 2 + 1) + 1 + x * 2;
    raw[o] = 0;
    raw[o + 1] = Math.round(alpha * 255);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const head = Buffer.alloc(13);
head.writeUInt32BE(SIZE, 0);
head.writeUInt32BE(SIZE, 4);
head[8] = 8; // bit depth
head[9] = 4; // grey + alpha

writeFileSync(
  out,
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);
console.log(`wrote ${out}`);
