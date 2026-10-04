import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/*
 * The day passes as the page is read. Each scene's sun follows the scroll: it rises behind the
 * name, stands high over the first band, sets in the second, and the moon comes up at the foot of
 * the page. `rise` is the share of the disc standing above the horizon (past 1 it has lifted
 * clear), `spread` how far its path reaches down the water, and `glow` how brightly that path
 * shows. The values at rest, with no script or with reduced motion, are in Calm.astro.
 */
type Span = [from: number, to: number];
const DAY: Record<string, { rise: Span; spread: Span; glow: Span; start: string; end: string }> = {
  dawn: { rise: [0.5, 1.4], spread: [0.72, 1.12], glow: [1, 1], start: 'top top', end: 'bottom top' },
  noon: { rise: [1.3, 1.75], spread: [0.95, 1.1], glow: [1, 1], start: 'top bottom', end: 'bottom top' },
  evening: { rise: [1.1, 0.25], spread: [1.1, 0.7], glow: [1, 0.5], start: 'top bottom', end: 'bottom top' },
  dusk: { rise: [0, 1.3], spread: [0.6, 1], glow: [0, 1], start: 'top bottom', end: 'bottom bottom' },
};

/** Marks the nav link for the section in view, and gives the header its ground once the hero is gone. */
function navState(root: HTMLElement) {
  const header = root.querySelector<HTMLElement>('.ca-top')!;
  root.querySelectorAll<HTMLAnchorElement>('.ca-top nav a').forEach((a) => {
    ScrollTrigger.create({
      trigger: a.hash,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (st) => (st.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')),
    });
  });
  ScrollTrigger.create({
    trigger: '.ca-hero',
    start: () => `bottom top+=${header.offsetHeight}`,
    onEnter: () => root.classList.add('is-past'),
    onLeaveBack: () => root.classList.remove('is-past'),
  });
  gsap.to('.ca-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });
}

/** Smooth scrolling, and a slow crossing to each anchor. */
function startScroll(root: HTMLElement) {
  const lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector<HTMLElement>(a.hash);
      if (!target) return;
      e.preventDefault();
      const to = a.hash === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY;
      lenis.scrollTo(to, {
        duration: clamp(Math.abs(to - window.scrollY) / 2200, 1.3, 2.8),
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
  });
}

/** Ties each scene's sun and its path on the water to the scroll. */
function startDay(root: HTMLElement) {
  // The water only shimmers while its scene is on screen.
  const onScreen = new IntersectionObserver((entries) =>
    entries.forEach((e) => e.target.classList.toggle('is-live', e.isIntersecting)),
  );
  root.querySelectorAll<HTMLElement>('.ca-scene').forEach((scene) => {
    const day = DAY[scene.dataset.scene ?? ''];
    if (!day) return;
    onScreen.observe(scene);
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: scene, start: day.start, end: day.end, scrub: true },
    });
    tl.fromTo(scene.querySelector('.ca-sun'), { '--rise': day.rise[0] }, { '--rise': day.rise[1] }, 0);
    tl.fromTo(
      scene.querySelector('.ca-glints'),
      { '--spread': day.spread[0], opacity: day.glow[0] },
      { '--spread': day.spread[1], opacity: day.glow[1] },
      0,
    );
    const boat = scene.querySelector<HTMLElement>('.ca-boat');
    if (boat) tl.fromTo(boat, { x: () => scene.offsetWidth * 0.07 }, { x: () => scene.offsetWidth * -0.07 }, 0);
  });

  // The name and its lines lift away as the sun clears the horizon.
  gsap.to('.ca-hero-copy', {
    y: () => window.innerHeight * -0.1,
    autoAlpha: 0,
    ease: 'power1.in',
    scrollTrigger: { trigger: '.ca-hero', start: 'top top', end: '82% top', scrub: true, invalidateOnRefresh: true },
  });
}

/** Lets each waiting block in as it comes into view; neighbours that arrive together follow in turn. */
function startReveals(root: HTMLElement) {
  ScrollTrigger.batch(root.querySelectorAll('[data-rv]'), {
    start: 'top 86%',
    once: true,
    onEnter: (els) =>
      els.forEach((el, i) => {
        (el as HTMLElement).style.setProperty('--d', String(i));
        el.classList.add('is-in');
      }),
  });
}

function init(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  navState(root);
  if (!reduce) {
    startScroll(root);
    startDay(root);
    startReveals(root);
  }
  // is-ready: the script is running, so the header may travel with the page.
  root.classList.add('is-ready');
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const root = document.querySelector<HTMLElement>('.ca');
if (root) init(root);
