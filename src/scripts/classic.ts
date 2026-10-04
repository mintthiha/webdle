import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { startReveals, startScroll } from './page';

/*
 * Classic is a set of pages, so most of what moves is between them (the view transition in
 * templates/Classic.astro). On a page, this only smooths the scroll and lets each block in as it
 * comes into view.
 */
function init(root: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    startScroll(root);
    startReveals(root);
  }
  root.classList.add('is-ready');
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

const root = document.querySelector<HTMLElement>('.cl');
if (root) init(root);
