import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { navState, startReveals, startScroll } from './page';

gsap.registerPlugin(ScrollTrigger);

/*
 * Each plate is a stack of ridges or waves, and they part as the plate crosses the screen: the
 * nearest layer travels furthest. `data-d` (src/lib/art.ts) is a layer's depth, 0 far to 1 near.
 * TRAVEL is the nearest layer's reach as a share of the drawing's height; the plate is drawn a
 * little oversize (see `.pr-arch svg`), which is what keeps a lifted layer's foot out of sight.
 */
const TRAVEL = 0.045;

function startPlates(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('.pr-par').forEach((plate) => {
    const svg = plate.querySelector('svg');
    if (!svg) return;
    const reach = svg.viewBox.baseVal.height * TRAVEL;
    // The hero plate is in place on arrival and only leaves; the others pass right through.
    const hero = !!plate.closest('.pr-hero');
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero ? '.pr-hero' : plate,
        start: hero ? 'top top' : 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
    svg.querySelectorAll<SVGElement>('[data-d]').forEach((layer) => {
      const depth = Number(layer.dataset.d);
      tl.fromTo(layer, { y: hero ? 0 : depth * reach }, { y: -depth * reach }, 0);
    });
  });
}

/** The engraved seals turn with the page, like the lathe that cut them. */
function startSeals(root: HTMLElement) {
  gsap.to(root.querySelectorAll('.pr-seal'), {
    rotation: 200,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: true },
  });
}

function init(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  navState(root, 'pr', true);
  if (!reduce) {
    startScroll(root);
    startPlates(root);
    startSeals(root);
    startReveals(root);
  }
  // is-ready: the script is running, so the header may travel with the page.
  root.classList.add('is-ready');
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const root = document.querySelector<HTMLElement>('.pr');
if (root) init(root);
