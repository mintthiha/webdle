import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const root = document.querySelector<HTMLElement>('.wo');
if (root) init(root);

function init(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Interactions that are not "motion": hover previews and the hero spotlight.
  root.querySelectorAll<HTMLElement>('.wo-row').forEach((row) => {
    row.addEventListener('pointermove', (e) => {
      const r = row.getBoundingClientRect();
      row.style.setProperty('--mx', `${e.clientX - r.left}px`);
      row.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
  const hero = root.querySelector<HTMLElement>('.wo-hero');
  hero?.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--sx', `${((e.clientX - r.left) / r.width) * 100}%`);
    hero.style.setProperty('--sy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });

  if (reduce) return;

  /* ---- smooth scroll, wired into ScrollTrigger ---- */
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id && id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.4 });
      }
    });
  });

  /* ---- progress ---- */
  gsap.to('.wo-progress', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: true },
  });

  /* ---- hero ---- */
  gsap.from('.wo-char', { yPercent: 115, rotate: 5, duration: 1.2, ease: 'expo.out', stagger: 0.04 });
  gsap.from('.wo-hero-fade', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.55 });
  gsap.to('.wo-name', {
    fontStretch: '125%',
    ease: 'none',
    scrollTrigger: { trigger: '.wo-hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.wo-hero-art', {
    yPercent: -12,
    rotate: 12,
    ease: 'none',
    scrollTrigger: { trigger: '.wo-hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.wo-outline-a', {
    xPercent: -18,
    ease: 'none',
    scrollTrigger: { trigger: '.wo-hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.wo-outline-b', {
    xPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: '.wo-hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  const art = root.querySelector<HTMLElement>('.wo-hero-parallax');
  if (hero && art) {
    const xTo = gsap.quickTo(art, 'x', { duration: 0.9, ease: 'power3' });
    const yTo = gsap.quickTo(art, 'y', { duration: 0.9, ease: 'power3' });
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      xTo(((e.clientX - r.left) / r.width - 0.5) * -48);
      yTo(((e.clientY - r.top) / r.height - 0.5) * -48);
    });
  }

  /* ---- statement: words light up as you read ---- */
  gsap.fromTo(
    '.wo-word',
    { opacity: 0.16 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: '.wo-statement p', start: 'top 82%', end: 'bottom 48%', scrub: true },
    },
  );

  /* ---- pinned horizontal record ---- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const sec = root.querySelector<HTMLElement>('.wo-hscroll');
    const track = sec?.querySelector<HTMLElement>('.wo-htrack');
    if (!sec || !track) return;
    sec.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
    gsap.to(track, {
      x: () => -dist(),
      ease: 'none',
      scrollTrigger: {
        trigger: sec,
        start: 'top top',
        end: () => `+=${dist()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    return () => sec.classList.remove('is-pinned');
  });

  /* ---- work rows ---- */
  gsap.utils.toArray<HTMLElement>('.wo-row').forEach((row) => {
    gsap.from(row, {
      opacity: 0,
      y: 40,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 90%', once: true },
    });
  });

  /* ---- reel: plates open like shutters ---- */
  gsap.utils.toArray<HTMLElement>('.wo-plate').forEach((plate) => {
    gsap.fromTo(
      plate,
      { clipPath: 'inset(14% 20% 14% 20% round 2.5rem)' },
      {
        clipPath: 'inset(0% 0% 0% 0% round 0rem)',
        ease: 'none',
        scrollTrigger: { trigger: plate, start: 'top 90%', end: 'top 20%', scrub: true },
      },
    );
    gsap.fromTo(
      plate.querySelector('svg'),
      { scale: 1.25 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: plate, start: 'top 90%', end: 'bottom 20%', scrub: true } },
    );
  });

  /* ---- magnetic buttons ---- */
  root.querySelectorAll<HTMLElement>('.wo-mag').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
