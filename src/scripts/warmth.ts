import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { navState, startReveals, startScroll } from './page';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Seconds the tape takes to run one full set of titles when the page is still. */
const LAP = 36;
/** Scroll speed (px/s) that doubles the tape's own. */
const PUSH = 420;

/**
 * The tape of titles runs on its own, and the scroll pulls it along: faster the faster the page
 * moves, and backwards when the page goes back up. A mouse resting on it holds it still.
 */
function startTape(root: HTMLElement) {
  const tape = root.querySelector<HTMLElement>('.wm-marquee');
  const track = tape?.querySelector<HTMLElement>('.wm-track');
  if (!tape || !track) return;
  let half = track.offsetWidth / 2;
  ScrollTrigger.addEventListener('refresh', () => (half = track.offsetWidth / 2));
  let held = false;
  tape.addEventListener('pointerenter', (e) => (held = e.pointerType === 'mouse'));
  tape.addEventListener('pointerleave', () => (held = false));

  let x = 0;
  let pace = 1;
  let way = 1;
  let lastY = window.scrollY;
  gsap.ticker.add((_time, deltaMs) => {
    const dt = clamp(deltaMs / 1000, 0.001, 0.1);
    const y = window.scrollY;
    const push = clamp((y - lastY) / dt / PUSH, -5, 5);
    lastY = y;
    if (!half || !tape.classList.contains('is-live')) return;
    if (Math.abs(push) > 0.15) way = Math.sign(push);
    const want = held ? 0 : way + push;
    pace += (want - pace) * (1 - Math.exp(-dt * 5));
    x = (x - (pace * half * dt) / LAP) % half;
    if (x > 0) x -= half;
    track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
  });
}

/** The collage has depth: as the hero leaves, the blob hangs back and the sticker runs ahead. */
function startHero(root: HTMLElement) {
  const hero = root.querySelector<HTMLElement>('.wm-hero');
  if (!hero) return;
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: hero, start: 0, end: 'bottom top', scrub: true },
  });
  tl.to(hero.querySelector('.wm-blob'), { y: 64 }, 0);
  tl.to(hero.querySelector('.wm-sticker-a'), { y: -56 }, 0);
}

/** The strip of cut-outs slides sideways as the page moves down, each tile bobbing against its neighbour. */
function startStrip(root: HTMLElement) {
  const strip = root.querySelector<HTMLElement>('.wm-gallery ul');
  const last = strip?.lastElementChild;
  if (!strip || !last) return;
  // How far the strip has to travel for its last tile to come fully into view.
  const reach = () => {
    const pad = parseFloat(getComputedStyle(strip).paddingRight) || 0;
    const width = last.getBoundingClientRect().right - strip.getBoundingClientRect().left + pad;
    return Math.max(0, width - strip.clientWidth);
  };
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.wm-gallery', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
  });
  tl.fromTo(strip, { x: 0 }, { x: () => -reach() }, 0);
  strip.querySelectorAll<HTMLElement>('li > div').forEach((tile, i) => {
    const low = i % 2 === 1;
    tl.fromTo(tile, { y: low ? 48 : 32, rotation: low ? 2 : -2 }, { y: low ? -8 : -24, rotation: low ? -2 : 2 }, 0);
  });
}

/** The loops (the blob, the badge, the tape, the star) only run while they are on screen. */
function watchLoops(root: HTMLElement) {
  const onScreen = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
  );
  root.querySelectorAll('.wm-hero-art, .wm-marquee, .wm-hello-copy').forEach((el) => onScreen.observe(el));
}

function init(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  navState(root, 'wm');
  if (!reduce) {
    // is-motion: the script is moving the page, so the CSS stand-ins for the tape and the strip step aside.
    root.classList.add('is-motion');
    startScroll(root);
    watchLoops(root);
    startTape(root);
    startHero(root);
    startStrip(root);
    startReveals(root);
  }
  root.classList.add('is-ready');
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const root = document.querySelector<HTMLElement>('.wm');
if (root) init(root);
