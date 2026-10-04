import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/*
 * Scroll behaviour shared by Calm, Prestige, Warmth and the landing page. Each template names its
 * parts with its own prefix (`ca`, `pr`, `wm`), so the helpers take that prefix.
 */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Marks the nav link for the section in view, and gives the header its ground (`is-past`) once the
 * hero is gone, or with `early` as soon as the page moves, for a hero the header would run across.
 */
export function navState(root: HTMLElement, prefix: string, early = false) {
  const header = root.querySelector<HTMLElement>(`.${prefix}-top`)!;
  header.querySelectorAll<HTMLAnchorElement>('nav a').forEach((a) => {
    ScrollTrigger.create({
      trigger: a.hash,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (st) => (st.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')),
    });
  });
  ScrollTrigger.create({
    trigger: `.${prefix}-hero`,
    start: () => (early ? 'top top-=24' : `bottom top+=${header.offsetHeight}`),
    onEnter: () => root.classList.add('is-past'),
    onLeaveBack: () => root.classList.remove('is-past'),
  });
}

/** Smooth scrolling, and a slow crossing to each anchor. */
export function startScroll(root: HTMLElement) {
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

/**
 * Lets each waiting `[data-rv]` block in as it comes into view. Neighbours that arrive together
 * get `--d` (0, 1, 2…) so the template's CSS can let them follow in turn.
 */
export function startReveals(root: HTMLElement) {
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
