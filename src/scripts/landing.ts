import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startReveals, startScroll } from './page';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/*
 * Each tile on the landing page, and each card in the hero's hand, is its direction in miniature
 * (`data-dir`) and moves the way that direction does: Prestige's ridges part by depth, Calm's sun
 * rises with the scroll, and Wow's inks slip out of register. Warmth's cut-outs drift in CSS
 * (index.astro), since they follow nothing.
 */

/** How far the nearest ridge travels, as a share of the drawing's height (as in prestige.ts). */
const TRAVEL = 0.05;

/** Prestige: `data-d` (src/lib/art.ts) is a layer's depth, 0 far to 1 near; the nearest travels furthest. */
function startRidges(tile: HTMLElement) {
  const svg = tile.querySelector('svg');
  if (!svg) return;
  const reach = svg.viewBox.baseVal.height * TRAVEL;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true },
  });
  svg.querySelectorAll<SVGElement>('[data-d]').forEach((layer) => {
    const depth = Number(layer.dataset.d);
    tl.fromTo(layer, { y: depth * reach }, { y: -depth * reach }, 0);
  });
}

/** Calm: the sun comes up out of the water as the tile crosses the screen. */
function startSun(tile: HTMLElement) {
  const sun = tile.querySelector<SVGCircleElement>('.art-sun');
  if (!sun) return;
  const r = sun.r.baseVal.value;
  gsap.fromTo(
    sun,
    { y: r * 0.9 },
    { y: -r * 0.75, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

/** Where each ink sits at rest, in the drawing's units: a hand press never prints quite true. */
const REST = [
  [-2.5, 1.5],
  [2, -1.5],
  [-0.5, 2.5],
];
/** How far each ink slips when the pointer or the scroll pulls on it. */
const SLIP = [-1, 0.6, 1.25];

/**
 * Wow: each ink is a mass on a spring, pulled by the pointer over the tile and by the speed of the
 * scroll, so the three slip apart and settle back into register.
 */
function startInks(tile: HTMLElement) {
  const inks = [...tile.querySelectorAll<SVGTextElement>('.lp-art text')];
  if (!inks.length) return;
  let px = 0;
  let py = 0;
  tile.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const box = tile.getBoundingClientRect();
    px = ((e.clientX - box.left) / box.width) * 2 - 1;
    py = ((e.clientY - box.top) / box.height) * 2 - 1;
  });
  tile.addEventListener('pointerleave', () => (px = py = 0));

  const at = inks.map((_, i) => [...REST[i % REST.length]]);
  const vel = inks.map(() => [0, 0]);
  const place = () => inks.forEach((ink, i) => (ink.style.translate = `${at[i][0].toFixed(2)}px ${at[i][1].toFixed(2)}px`));
  place();

  let lastY = window.scrollY;
  let speed = 0;
  gsap.ticker.add((_time, deltaMs) => {
    const dt = clamp(deltaMs / 1000, 0.001, 0.1);
    const y = window.scrollY;
    speed += (clamp((y - lastY) / dt / 1800, -1, 1) - speed) * Math.min(1, dt * 10);
    lastY = y;
    if (!tile.classList.contains('is-live')) return;
    let moving = 0;
    inks.forEach((_, i) => {
      const rest = REST[i % REST.length];
      const slip = SLIP[i % SLIP.length];
      const want = [rest[0] + slip * px * 10, rest[1] + slip * (py * 10 + speed * 26)];
      for (let k = 0; k < 2; k++) {
        vel[i][k] += ((want[k] - at[i][k]) * 140 - vel[i][k] * 11) * dt;
        at[i][k] += vel[i][k] * dt;
        moving += Math.abs(vel[i][k]) + Math.abs(want[k] - at[i][k]);
      }
    });
    if (moving > 0.05) place();
  });
}

/**
 * The hand of cards in the hero leans with the pointer, the front card furthest, and opens a
 * little wider as the page moves on.
 */
function startFan(root: HTMLElement) {
  const hero = root.querySelector<HTMLElement>('.lp-hero');
  const cards = [...root.querySelectorAll<HTMLElement>('.lp-fan li')];
  if (!hero || !cards.length) return;
  const lean = cards.map((card) => gsap.quickTo(card, 'x', { duration: 0.9, ease: 'power3' }));
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const pull = (e.clientX / window.innerWidth) * 2 - 1;
    lean.forEach((to, i) => to(pull * (5 + i * 4)));
  });
  hero.addEventListener('pointerleave', () => lean.forEach((to) => to(0)));
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 0, end: 'bottom top', scrub: true },
  });
  cards.forEach((card, i) => tl.to(card, { y: -(16 + i * 16), rotation: (i - 1.5) * 3 }, 0));
}

/** The tiles and cards only move while they are on screen. */
function watchTiles(tiles: NodeListOf<HTMLElement>) {
  const onScreen = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
  );
  tiles.forEach((tile) => onScreen.observe(tile));
}

function init(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    startScroll(root);
    watchTiles(root.querySelectorAll<HTMLElement>('[data-dir]'));
    root.querySelectorAll<HTMLElement>("[data-dir='prestige']").forEach(startRidges);
    root.querySelectorAll<HTMLElement>("[data-dir='calm']").forEach(startSun);
    root.querySelectorAll<HTMLElement>("[data-dir='wow']").forEach(startInks);
    startFan(root);
    startReveals(root);
  }
  root.classList.add('is-ready');
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const root = document.querySelector<HTMLElement>('.lp');
if (root) init(root);
