/**
 * The press. Every `[data-sheet]` section is a sheet of paper, and every `[data-ink]` element on
 * it is wood type locked into one or more of three plates: yellow, pink, blue. The DOM stays the
 * layout engine (and the accessible text); this file measures those elements, draws each plate as
 * a mask, and lets one shared WebGL2 context print the sheet with grain, salt and overprint.
 *
 * Nothing here animates on its own. The caller moves `front`, `reg`, `zoom` and `flood`, marks the
 * sheet dirty, and calls `draw`.
 */

const PLATES = ['y', 'p', 'b'] as const;
/** Device pixels a single sheet may cost, so a tall sheet on a retina screen stays affordable. */
const BUDGET = 4.5e6;

export interface Sheet {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: WebGLTexture;
  /** Size in CSS px, and the device px per CSS px the sheet is printed at. */
  w: number;
  h: number;
  scale: number;
  /** How far down the sheet each plate's roller has travelled, in CSS px from the top. */
  front: [number, number, number];
  /** Tilt of the rollers: 0 rolls straight down the sheet. */
  slope: number;
  /** Camera: 1 shows the whole sheet, larger pushes into `fx, fy`. */
  zoom: number;
  fx: number;
  fy: number;
  /** 0..1, how much of the view is given over to one plate's solid ink. */
  flood: number;
  floodPlate: number;
  seed: number;
  /** Pointer position on the sheet (CSS px) and the strength of its pull, 0..1. */
  ptr: [number, number, number];
  visible: boolean;
  /** Something changed since the last draw. */
  dirty: boolean;
  /** Only part of the sheet was redrawn last time; the rest still shows an older state. */
  stale: boolean;
}

interface Shape {
  ink: string;
  knock: string;
  rect?: [number, number, number, number];
  font?: string;
  base?: number;
  glyphs?: [string, number][];
}

const VERT = `#version 300 es
out vec2 v_uv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  v_uv = vec2(p.x, 1. - p.y);
  gl_Position = vec4(p * 2. - 1., 0., 1.);
}`;

const FRAG = `#version 300 es
precision highp float;

uniform sampler2D u_mask;   // r, g, b = yellow, pink, blue plate
uniform sampler2D u_noise;  // 256px of random values, four independent channels
uniform vec2 u_size;        // sheet size, css px
uniform vec2 u_reg[3];      // registration of each plate, css px
uniform vec3 u_front;       // how far each roller has travelled
uniform float u_slope;
uniform float u_zoom;
uniform vec2 u_focus;
uniform float u_flood;
uniform int u_floodPlate;
uniform vec3 u_ink[8];      // paper, y, p, yp, b, yb, pb, ypb
uniform float u_seed;
uniform vec3 u_ptr;         // pointer on the sheet (css px), and how hard it is pulling
uniform float u_lens;       // radius of that pull

in vec2 v_uv;
out vec4 o;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
// Smooth value noise, four channels a fetch: cheap enough for a phone to print a whole sheet.
vec4 nz(vec2 x) {
  vec2 i = floor(x), f = fract(x);
  f = f * f * (3. - 2. * f);
  return texture(u_noise, (i + f + .5) / 256.);
}

void main() {
  vec2 p = v_uv * u_size;                       // this pixel on screen
  vec2 q = u_focus + (p - u_focus) / u_zoom;    // the point of the sheet underneath it
  float deep = smoothstep(1.5, 9., u_zoom);     // how far into the ink the camera is
  vec2 t = mix(q, p, deep) + u_seed;            // texture rides the sheet, then settles on screen

  vec4 fine = nz(t * vec2(.55, .9));            // a: paper fibre
  vec4 mid = nz(t * .06);                       // rgb: mottle, also the rollers' ragged edges
  vec4 mid2 = nz(t * .19 + 40.);
  vec4 slow = nz(t * .013);                     // rgb: starved patches, a: pressure
  vec4 wood = nz(vec2(t.x * .007, t.y * .75));  // rgb: grain along each block
  vec2 nick = (nz(q * .8).rg - .5) * .9 / sqrt(u_zoom);

  vec3 paper = u_ink[0] * (1. - .034 * (fine.a - .5) - .014 * (hash(floor(t * 2.3)) - .5));

  // Under the pointer the three plates are dragged apart, each its own way.
  vec2 away = q - u_ptr.xy;
  float lens = u_ptr.z * exp(-dot(away, away) / (u_lens * u_lens));

  float c[3];
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float turn = 2.094 * fi + 3.67;
    vec2 s = (q + nick - u_reg[i] - vec2(cos(turn), sin(turn)) * lens * u_lens * .2) / u_size;
    float m = texture(u_mask, s)[i];
    float soft = textureLod(u_mask, s, 3.)[i];
    float w = clamp(fwidth(m) * .75, .002, .5);
    float a = smoothstep(.5 - w, .5 + w, m);
    a = mix(a, i == u_floodPlate ? 1. : 0., u_flood);

    // Wood grain runs the length of the block, a little differently on every plate.
    float grain = smoothstep(.66, .95, wood[i]);
    // Salt: specks of bare paper where the ink never reached the bottom of the tooth. It gathers
    // in patches where the block was starved, and leaves the rest of the letter solid.
    float starved = smoothstep(.45, .75, slow[i]);
    float salt = smoothstep(.8, 1., hash(floor(t * 1.9) + fi * 57.)) * mix(.2, 1., starved);
    float mottle = (mid[i] + .5 * mid2[i]) / 1.5 - .5;
    // Ink squeezes to the edge of the block and prints a touch heavier there.
    float rim = smoothstep(.97, .5, soft) * (1. - deep);
    float density = .9 + .06 * (slow.a - .5) + .1 * mottle + .1 * rim - .1 * grain - .6 * salt;

    // The roller: a ragged leading edge, with the ink behind it still wet.
    float along = q.y + q.x * u_slope;
    float d = u_front[i] - along + (mid[(i + 1) % 3] - .5) * 34.;
    float laid = smoothstep(0., 9., d);
    float wet = .2 * exp(-max(d, 0.) / 70.);

    c[i] = a * laid * clamp(density + wet + .1 * lens, 0., 1.);
  }

  vec3 col = mix(
    mix(mix(paper, u_ink[1], c[0]), mix(u_ink[2], u_ink[3], c[0]), c[1]),
    mix(mix(u_ink[4], u_ink[5], c[0]), mix(u_ink[6], u_ink[7], c[0]), c[1]),
    c[2]);
  // Transparent ink: the paper's own tone shows through whatever is printed on it.
  col *= mix(vec3(1.), paper / u_ink[0], .7);
  o = vec4(col, 1.);
}`;

const hex = (v: string): [number, number, number] => {
  const n = parseInt(v.trim().slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

export class Press {
  readonly sheets: Sheet[] = [];
  private gl: WebGL2RenderingContext;
  private glc: HTMLCanvasElement;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private mask = document.createElement('canvas');
  private tmp = document.createElement('canvas');

  /** Returns null when WebGL2 is unavailable; the page then keeps its flat CSS inks. */
  static create(root: HTMLElement): Press | null {
    const glc = document.createElement('canvas');
    const gl = glc.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false });
    if (!gl) {
      console.warn('[wow] WebGL2 is unavailable; showing flat inks.');
      return null;
    }
    try {
      return new Press(root, glc, gl);
    } catch (error) {
      console.warn('[wow] the press failed to start; showing flat inks.', error);
      return null;
    }
  }

  private constructor(root: HTMLElement, glc: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.glc = glc;
    this.gl = gl;
    const prog = gl.createProgram()!;
    for (const [type, src] of [
      [gl.VERTEX_SHADER, VERT],
      [gl.FRAGMENT_SHADER, FRAG],
    ] as const) {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader');
      gl.attachShader(prog, sh);
    }
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
    gl.useProgram(prog);
    for (const name of ['u_mask', 'u_noise', 'u_size', 'u_reg', 'u_front', 'u_slope', 'u_zoom', 'u_focus', 'u_flood', 'u_floodPlate', 'u_ink', 'u_seed', 'u_ptr', 'u_lens']) {
      this.u[name] = gl.getUniformLocation(prog, name);
    }
    // The eight colours a three-ink job can make, indexed y + 2p + 4b. CSS owns the values.
    const cs = getComputedStyle(root);
    const inks = ['paper', 'y', 'p', 'yp', 'b', 'yb', 'pb', 'ypb'].flatMap((n) => hex(cs.getPropertyValue(`--${n}`)));
    gl.uniform3fv(this.u.u_ink, inks);
    gl.uniform1i(this.u.u_mask, 0);

    // One small tile of random values feeds every texture in the shader. Seeded, so the same
    // sheet prints the same way on every visit.
    const tile = new Uint8Array(256 * 256 * 4);
    let seed = 0x2f6e2b1;
    for (let i = 0; i < tile.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      tile[i] = seed >>> 24;
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, tile);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(this.u.u_noise, 1);
    gl.activeTexture(gl.TEXTURE0);
  }

  add(el: HTMLElement, canvas: HTMLCanvasElement): Sheet {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const sheet: Sheet = {
      el,
      canvas,
      ctx: canvas.getContext('2d')!,
      tex,
      w: 0,
      h: 0,
      scale: 1,
      front: [1e6, 1e6, 1e6],
      slope: 0,
      zoom: 1,
      fx: 0,
      fy: 0,
      flood: 0,
      floodPlate: 1,
      seed: this.sheets.length * 37.7 + 3.1,
      ptr: [0, 0, 0],
      visible: false,
      dirty: true,
      stale: false,
    };
    this.sheets.push(sheet);
    return sheet;
  }

  /** Measures the sheet's ink elements where the browser laid them out and cuts the three plates. */
  rasterize(s: Sheet) {
    const box = s.el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    s.w = box.width;
    s.h = box.height;
    s.scale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(BUDGET / (s.w * s.h)));
    const pw = Math.max(1, Math.round(s.w * s.scale));
    const ph = Math.max(1, Math.round(s.h * s.scale));
    if (s.canvas.width !== pw || s.canvas.height !== ph) {
      s.canvas.width = pw;
      s.canvas.height = ph;
    }

    const shapes: Shape[] = [];
    s.el.querySelectorAll<HTMLElement>('[data-ink], [data-knock]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!el.getClientRects().length) return;
      const shape: Shape = { ink: el.dataset.ink ?? '', knock: el.dataset.knock ?? '' };
      if ('rect' in el.dataset) {
        shape.rect = [r.left - box.left, r.top - box.top, r.width, r.height];
      } else {
        const probe = el.querySelector('.wo-bl');
        if (!probe) return;
        const cs = getComputedStyle(el);
        shape.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        shape.base = probe.getBoundingClientRect().top - box.top;
        shape.glyphs = [];
        // One range per character, so kerning and tracking land exactly where the DOM put them.
        const range = document.createRange();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent ?? '';
          let i = 0;
          for (const ch of text) {
            if (ch.trim()) {
              range.setStart(node, i);
              range.setEnd(node, i + ch.length);
              shape.glyphs.push([ch, range.getBoundingClientRect().left - box.left]);
            }
            i += ch.length;
          }
        }
      }
      shapes.push(shape);
    });

    const { mask, tmp } = this;
    mask.width = tmp.width = pw;
    mask.height = tmp.height = ph;
    const mc = mask.getContext('2d')!;
    const tc = tmp.getContext('2d')!;
    mc.fillStyle = '#000';
    mc.fillRect(0, 0, pw, ph);
    const paint = (sh: Shape) => {
      if (sh.rect) return tc.fillRect(...sh.rect);
      tc.font = sh.font!;
      for (const [ch, x] of sh.glyphs!) tc.fillText(ch, x, sh.base!);
    };
    PLATES.forEach((plate, i) => {
      tc.setTransform(1, 0, 0, 1, 0, 0);
      tc.globalCompositeOperation = 'source-over';
      tc.clearRect(0, 0, pw, ph);
      tc.setTransform(s.scale, 0, 0, s.scale, 0, 0);
      tc.fillStyle = '#fff';
      tc.textBaseline = 'alphabetic';
      for (const sh of shapes) if (sh.ink.includes(plate)) paint(sh);
      tc.globalCompositeOperation = 'destination-out';
      for (const sh of shapes) if (sh.knock.includes(plate)) paint(sh);
      // Tint the plate into its own colour channel and add it to the opaque mask.
      tc.setTransform(1, 0, 0, 1, 0, 0);
      tc.globalCompositeOperation = 'source-in';
      tc.fillStyle = ['#f00', '#0f0', '#00f'][i];
      tc.fillRect(0, 0, pw, ph);
      mc.globalCompositeOperation = 'lighter';
      mc.drawImage(tmp, 0, 0);
    });

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, s.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.generateMipmap(gl.TEXTURE_2D);
    s.dirty = true;
  }

  /**
   * The spot on the sheet that sits deepest inside one plate's ink with no other ink over it, and
   * how far it is from any edge. Call straight after `rasterize(s)`, while the mask is that sheet's.
   */
  deepest(s: Sheet, plate: number): { x: number; y: number; r: number } {
    const fw = 240;
    const fh = Math.max(1, Math.round((fw * s.h) / s.w));
    const c = document.createElement('canvas');
    c.width = fw;
    c.height = fh;
    const cx = c.getContext('2d', { willReadFrequently: true })!;
    cx.drawImage(this.mask, 0, 0, fw, fh);
    const px = cx.getImageData(0, 0, fw, fh).data;
    // Two-pass chamfer distance to the nearest pixel that is not this plate's ink alone.
    const d = new Float32Array(fw * fh);
    for (let i = 0; i < d.length; i++) {
      const own = px[i * 4 + plate] > 200;
      const others = px[i * 4 + ((plate + 1) % 3)] + px[i * 4 + ((plate + 2) % 3)] < 40;
      d[i] = own && others ? 1e4 : 0;
    }
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= fw || y >= fh ? 0 : d[y * fw + x]);
    for (let y = 0; y < fh; y++) {
      for (let x = 0; x < fw; x++) {
        const i = y * fw + x;
        d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
      }
    }
    let best = 0;
    for (let y = fh - 1; y >= 0; y--) {
      for (let x = fw - 1; x >= 0; x--) {
        const i = y * fw + x;
        d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
        if (d[i] > d[best]) best = i;
      }
    }
    const k = s.w / fw;
    return { x: ((best % fw) + 0.5) * k, y: (Math.floor(best / fw) + 0.5) * k, r: d[best] * k };
  }

  /** Prints the sheet, or just the rows between `top` and `bottom` (CSS px) when only those are on screen. */
  draw(s: Sheet, reg: Float32Array, top = 0, bottom = Infinity) {
    const { gl, glc, u } = this;
    const pw = s.canvas.width;
    const ph = s.canvas.height;
    if (!s.w || gl.isContextLost()) return;
    const y0 = Math.max(0, Math.floor(top * s.scale));
    const y1 = Math.min(ph, Math.ceil(bottom * s.scale));
    if (y1 <= y0) return;
    if (glc.width < pw || glc.height < ph) {
      glc.width = Math.max(glc.width, pw);
      glc.height = Math.max(glc.height, ph);
    }
    gl.viewport(0, 0, pw, ph);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, ph - y1, pw, y1 - y0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, s.tex);
    gl.uniform2f(u.u_size, s.w, s.h);
    gl.uniform2fv(u.u_reg, reg);
    gl.uniform3f(u.u_front, s.front[0], s.front[1], s.front[2]);
    gl.uniform1f(u.u_slope, s.slope);
    gl.uniform1f(u.u_zoom, s.zoom);
    gl.uniform2f(u.u_focus, s.fx, s.fy);
    gl.uniform1f(u.u_flood, s.flood);
    gl.uniform1i(u.u_floodPlate, s.floodPlate);
    gl.uniform1f(u.u_seed, s.seed);
    gl.uniform3f(u.u_ptr, s.ptr[0], s.ptr[1], s.ptr[2]);
    gl.uniform1f(u.u_lens, Math.min(190, Math.max(110, s.w * 0.11)));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // The drawing buffer's origin is bottom-left; the sheet was drawn into its lower-left corner.
    s.ctx.drawImage(glc, 0, glc.height - ph + y0, pw, y1 - y0, 0, y0, pw, y1 - y0);
    s.dirty = false;
    s.stale = y0 > 0 || y1 < ph;
  }
}
