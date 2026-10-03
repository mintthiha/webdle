import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Press, type Sheet } from './wow-press';

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Plate registration at rest, in units of `unit()`: the three inks never sit quite true. */
const REST = [-0.9, 0.6, 1.0, -0.45, -0.15, 1.0];
/** How far each plate slips when the pointer or the scroll pulls on it. */
const SLIP = [-1, 0.6, 1.25];
/** How quickly each plate's roller catches up with the scroll: yellow first, blue last. */
const ROLL = [9, 7, 5.5];
/** Left alone, a roller still creeps on (px/s) until everything on screen is printed. */
const CREEP = 320;
const unit = () => clamp(window.innerWidth * 0.0026, 1.2, 4.5);

/**
 * Fits every poster line to its measure. `--k` is font-size per unit of measure, so once it is
 * known the line stays fitted at any width with no further script. The other three values trim
 * the line box to the ink.
 */
function fitLines(root: HTMLElement) {
  const ctx = document.createElement('canvas').getContext('2d')!;
  root.querySelectorAll<HTMLElement>('.wo-fit').forEach((line) => {
    const inner = line.firstElementChild as HTMLElement;
    const probe = inner.querySelector('.wo-bl');
    if (!probe) return;
    line.style.fontSize = '100px';
    const cs = getComputedStyle(inner);
    const box = inner.getBoundingClientRect();
    const base = probe.getBoundingClientRect().top - box.top;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} 100px ${cs.fontFamily}`;
    const ink = ctx.measureText(inner.textContent ?? '');
    line.style.fontSize = '';
    if (!box.width) return;
    line.style.setProperty('--k', (100 / box.width).toFixed(5));
    line.style.setProperty('--asc', (ink.actualBoundingBoxAscent / 100).toFixed(4));
    line.style.setProperty('--desc', (Math.max(0, ink.actualBoundingBoxDescent) / 100).toFixed(4));
    line.style.setProperty('--base', (base / 100).toFixed(4));
  });
}

/**
 * Sizes the hero poster to the viewport. On wide screens both name lines share one size and the
 * copy sits in the notch beside the shorter word. Failing that, each line fills the measure and
 * the copy goes beside the poster if the screen is short and wide, or underneath it.
 */
function heroLayout(root: HTMLElement) {
  const pin = root.querySelector<HTMLElement>('.wo-pin')!;
  const body = root.querySelector<HTMLElement>('.wo-hero-body')!;
  const poster = body.querySelector<HTMLElement>('.wo-poster')!;
  const lede = poster.querySelector<HTMLElement>('.wo-lede')!;
  const tag = lede.querySelector<HTMLElement>('.wo-tag')!;
  const actions = lede.querySelector<HTMLElement>('.wo-actions')!;
  const nav = root.querySelector<HTMLElement>('.wo-nav')!;
  const top = body.querySelector<HTMLElement>('.wo-top')!;
  const cue = body.querySelector<HTMLElement>('.wo-cue')!;
  const lines = [...poster.querySelectorAll<HTMLElement>('.wo-name .wo-fit')];
  const px = (el: Element, prop: string) => parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;

  return () => {
    const cw = body.clientWidth - px(body, 'padding-left') - px(body, 'padding-right');
    const height = root.classList.contains('is-live') ? pin.clientHeight : window.innerHeight;
    const room =
      height -
      px(body, 'padding-top') -
      px(body, 'padding-bottom') -
      top.offsetHeight -
      px(top, 'margin-top') -
      cue.offsetHeight;
    const ks = lines.map((line) => px(line, '--k'));
    const kmin = Math.min(...ks);
    const short = ks.indexOf(Math.max(...ks));
    const free = 1 - kmin / ks[short] - 0.035;

    const set = (mode: 'notch' | 'beside' | 'stack') => {
      const notch = mode === 'notch';
      poster.toggleAttribute('data-beside', mode === 'beside');
      if (notch) {
        poster.dataset.notch = String(short + 1);
        poster.style.setProperty('--kname', String(kmin));
        poster.style.setProperty('--nw', free.toFixed(4));
      } else {
        delete poster.dataset.notch;
      }
      // Everything in the poster scales with the measure except its padding and the copy below it.
      poster.style.setProperty('--m', `${cw}px`);
      const fixed =
        px(poster, 'padding-top') +
        px(poster, 'padding-bottom') +
        (mode === 'stack' ? lede.offsetHeight + px(lede, 'margin-top') : 0);
      const m = clamp(((room - fixed) * cw) / (poster.offsetHeight - fixed), cw * 0.4, cw);
      poster.style.setProperty('--m', `${m.toFixed(1)}px`);
      if (mode === 'stack') return true;
      if (mode === 'beside') {
        const gap = clamp(cw * 0.04, 28, 56);
        poster.style.setProperty('--bg', `${gap.toFixed(1)}px`);
        poster.style.setProperty('--bw', `${Math.min(cw - m - gap, 520).toFixed(1)}px`);
        return cw - m - gap >= 260 && lede.offsetHeight <= poster.offsetHeight;
      }
      const line = lines[short];
      poster.style.setProperty('--nt', (line.offsetTop / m).toFixed(4));
      poster.style.setProperty('--nh', (line.offsetHeight / m).toFixed(4));
      // The copy is bottom-aligned in the notch and may rise above it, but not into the nav.
      const need = tag.offsetHeight + actions.offsetHeight + px(actions, 'margin-top');
      const headroom = poster.offsetTop + lede.offsetTop - (nav.offsetTop + nav.offsetHeight) - 12;
      return need <= lede.clientHeight - px(lede, 'padding-bottom') + Math.max(0, headroom);
    };
    // Prefer the notch; set the copy smaller if that is what it takes; then beside; then underneath.
    const notch = (tight: boolean) => {
      poster.toggleAttribute('data-tight', tight);
      return set('notch');
    };
    const wide = window.innerWidth >= 960;
    const notchable = wide && lines.length === 2 && free * cw >= 300;
    if (notchable && (notch(false) || notch(true))) return;
    poster.removeAttribute('data-tight');
    if (!wide || !set('beside')) set('stack');
  };
}

/**
 * A new lockup for the name: the same inks, dealt to different letters, with no two neighbours
 * alike. Works on the flat CSS fallback too, since the colour hangs off `data-ink`.
 */
function shuffleInks(root: HTMLElement) {
  const letters = [...root.querySelectorAll<HTMLElement>('.wo-name [data-ink]')];
  const before = letters.map((l) => l.dataset.ink ?? '');
  const inks = [...before];
  for (let tries = 0; tries < 40; tries++) {
    for (let i = inks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [inks[i], inks[j]] = [inks[j], inks[i]];
    }
    const fresh = inks.some((ink, i) => ink !== before[i]);
    if (fresh && inks.every((ink, i) => ink !== inks[i - 1])) break;
  }
  letters.forEach((l, i) => (l.dataset.ink = inks[i]));
}

/** Marks the nav ticket for the section in view, and shows the name ticket once the hero is gone. */
function navState(root: HTMLElement) {
  root.querySelectorAll<HTMLAnchorElement>('.wo-nav ul a').forEach((a) => {
    ScrollTrigger.create({
      trigger: a.hash,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (st) => (st.isActive ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')),
    });
  });
  ScrollTrigger.create({
    trigger: '#about',
    start: 'top 85%',
    onEnter: () => root.classList.add('is-past'),
    onLeaveBack: () => root.classList.remove('is-past'),
  });
}

/**
 * Everything that moves without the press: smooth scrolling, travelling to anchors, the statement
 * taking ink word by word, blocks arriving as they come into view, and the tape. It runs whether
 * or not WebGL is available, so the flat-ink fallback is still a moving page.
 */
function startMotion(root: HTMLElement, beforeTravel?: () => void) {
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector<HTMLElement>(a.hash);
      if (!target) return;
      e.preventDefault();
      beforeTravel?.();
      // Travel there: ease away, cross the page, ease in. Longer trips take a little longer.
      const to = a.hash === '#top' ? 0 : target.getBoundingClientRect().top + window.scrollY;
      const trip = Math.abs(to - window.scrollY);
      lenis.scrollTo(to, {
        duration: clamp(trip / 2400, 1.2, 2.6),
        easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
      });
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    });
  });

  // The statement starts as a blind impression and takes ink word by word.
  const words = [...root.querySelectorAll<HTMLElement>('.wo-w')];
  let inked = 0;
  const ink = (n: number) => {
    for (let i = Math.min(n, inked); i < Math.max(n, inked); i++) words[i].classList.toggle('is-inked', i < n);
    inked = n;
  };
  ScrollTrigger.create({
    trigger: '.wo-statement',
    start: 'top 85%',
    end: 'center 52%',
    scrub: true,
    onUpdate: (st) => ink(Math.round(st.progress * words.length)),
    onRefresh: (st) => ink(Math.round(st.progress * words.length)),
  });

  // Type, rules and form fields arrive a block at a time. With flat inks, so does the big type.
  const arrive = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting && entry.boundingClientRect.top > 0) continue;
        entry.target.classList.add('is-in');
        arrive.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -14% 0px' },
  );
  const flat = root.classList.contains('is-flat') ? ', .wo-fit, .wo-num, .wo-band-ink' : '';
  root.querySelectorAll(`[data-rv]${flat}`).forEach((el) => arrive.observe(el));

  // The tape between sheets runs sideways as the page moves down.
  const run = root.querySelector<HTMLElement>('.wo-tape-run');
  if (run) {
    gsap.to(run, {
      xPercent: -25,
      ease: 'none',
      scrollTrigger: { trigger: '.wo-tape', start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  }
}

async function init(root: HTMLElement) {
  const html = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The poster is measured in real glyphs, so the two faces have to be in before anything is fitted.
  await Promise.race([
    Promise.all([
      document.fonts.load('900 64px "Besley Variable"', 'Aa1’'),
      document.fonts.load('64px "League Gothic"', 'A1'),
    ]),
    new Promise((done) => setTimeout(done, 3000)),
  ]);

  // is-motion: the visitor has not asked for reduced motion. is-live: motion, and the press runs.
  const press = Press.create(root);
  const motion = !reduce;
  const live = !!press && motion;
  root.classList.toggle('is-motion', motion);
  root.classList.toggle('is-live', live);
  root.classList.toggle('is-flat', !press);

  fitLines(root);
  const layoutHero = heroLayout(root);
  layoutHero();

  const pull = root.querySelector<HTMLButtonElement>('.wo-pull');
  if (pull) pull.hidden = false;

  if (!press) {
    // No WebGL2: hand the page back to its flat CSS inks.
    html.classList.remove('wo-js');
    pull?.addEventListener('click', () => shuffleInks(root));
    if (motion) startMotion(root);
    navState(root);
    ScrollTrigger.refresh();
    return;
  }

  const body = root.querySelector<HTMLElement>('.wo-hero-body')!;
  const sheets = [...root.querySelectorAll<HTMLElement>('[data-sheet]')].map((el) =>
    press.add(el, el.querySelector<HTMLCanvasElement>('.wo-ink')!),
  );
  const hero = sheets.find((s) => s.el.dataset.sheet === 'hero')!;
  const about = sheets.find((s) => s.el.dataset.sheet === 'about')!;
  const rollers = live ? sheets.filter((s) => s !== hero && s !== about) : [];
  const reg = new Float32Array(6);
  const vel = new Float32Array(6);
  const rest = [...REST];
  rest.forEach((v, i) => (reg[i] = v * unit()));

  /* ---- cutting the plates ---- */
  let depth = 30; // how far the camera must push into the hero's pink before it fills the screen
  let stageAt = 0;
  const ready = new Set<Sheet>();
  const cut = (s: Sheet) => {
    ready.add(s);
    if (s !== hero) return press.rasterize(s);
    // Measure the hero as laid out, not as the camera currently has it.
    body.style.transform = 'none';
    press.rasterize(s);
    const spot = press.deepest(s, 1);
    s.fx = spot.x + rest[2] * unit();
    s.fy = spot.y + rest[3] * unit();
    const far = Math.max(
      Math.hypot(s.fx, s.fy),
      Math.hypot(s.w - s.fx, s.fy),
      Math.hypot(s.fx, s.h - s.fy),
      Math.hypot(s.w - s.fx, s.h - s.fy),
    );
    depth = clamp(far / Math.max(spot.r * 0.8, 4), 6, 140);
    body.style.transformOrigin = `${s.fx.toFixed(1)}px ${s.fy.toFixed(1)}px`;
    applyStage(stageAt);
  };

  /* ---- the camera: scroll pushes into the pink until it floods the screen ---- */
  const applyStage = (t: number) => {
    stageAt = t;
    if (!live) return;
    const zt = clamp(t * 1.6); // the push takes the first 100svh of the stage's 160
    const eased = zt * zt * (3 - 2 * zt);
    hero.zoom = Math.pow(depth, eased);
    hero.flood = clamp((zt - 0.7) / 0.3);
    hero.dirty = true;
    const gone = clamp((hero.zoom - 1) / 0.8);
    body.style.transform = hero.zoom > 1.001 ? `scale(${hero.zoom.toFixed(4)})` : '';
    body.style.opacity = String(1 - gone);
    body.style.visibility = gone >= 1 ? 'hidden' : '';
  };

  /* ---- pulling the hero: three rollers cross the sheet one after another ---- */
  const heroRollers = hero.front.map(() => ({ at: 1e6 }));
  const pullHero = () => {
    heroRollers.forEach((roller, i) => {
      gsap.killTweensOf(roller);
      roller.at = hero.front[i] = -80;
      gsap.to(roller, {
        at: hero.h + 120,
        duration: 1.5,
        delay: 0.1 + i * 0.42,
        ease: 'power2.inOut',
        onUpdate: () => {
          hero.front[i] = roller.at;
          hero.dirty = true;
        },
        onComplete: () => (hero.front[i] = 1e6),
      });
    });
  };

  // Only the hero is cut up front. The other sheets are cut as they come near the viewport, or
  // one at a time while the browser is idle, so the first pull never has to wait for them.
  cut(hero);
  hero.visible = true;
  if (live) {
    rollers.forEach((s) => (s.front = [-60, -60, -60]));
    if (window.scrollY < 8) {
      hero.front = [-80, -80, -80];
      requestAnimationFrame(pullHero);
    }
  }
  press.draw(hero, reg);
  root.classList.add('is-press');
  const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 250));
  const warm = () => {
    const next = sheets.find((s) => !ready.has(s));
    if (!next) return;
    cut(next);
    idle(warm);
  };
  window.setTimeout(() => idle(warm), 2800);

  // "Print it again": deal the inks to different letters and knock the plates slightly out of
  // true, the way no two pulls from a hand press ever match.
  pull?.addEventListener('click', () => {
    shuffleInks(root);
    rest.forEach((_, i) => (rest[i] = REST[i] * (0.5 + Math.random()) + (Math.random() - 0.5) * 0.7));
    cut(hero);
    if (live) pullHero();
    else {
      rest.forEach((v, i) => (reg[i] = v * unit()));
      press.draw(hero, reg);
    }
  });

  /* ---- scroll ---- */
  if (live) {
    // Cut every sheet on the way before travelling to an anchor, so no slow frame interrupts it.
    startMotion(root, () => sheets.forEach((s) => ready.has(s) || cut(s)));
    ScrollTrigger.create({
      trigger: '.wo-stage',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (st) => applyStage(st.progress),
      onRefresh: (st) => applyStage(st.progress),
    });
  }
  navState(root);

  /* ---- the press loop: only sheets on screen, only when something moved ---- */
  const seen = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const s = sheets.find((sheet) => sheet.el === entry.target);
        if (s) s.visible = entry.isIntersecting;
      }
    },
    { rootMargin: '25% 0px' },
  );
  sheets.forEach((s) => seen.observe(s.el));

  let pointerX = 0;
  let pointerY = 0;
  let clientX = 0;
  let clientY = 0;
  let movedAt = -1e9;
  const lens = live && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (lens) {
    window.addEventListener(
      'pointermove',
      (e) => {
        if (e.pointerType !== 'mouse') return;
        clientX = e.clientX;
        clientY = e.clientY;
        movedAt = performance.now();
        pointerX = (clientX / window.innerWidth) * 2 - 1;
        pointerY = (clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );
    document.documentElement.addEventListener('pointerleave', () => (movedAt = -1e9));
  }

  let lastY = window.scrollY;
  let speed = 0;
  const quiet = new Map<Sheet, number>();
  const span = new Map<Sheet, [number, number]>();
  gsap.ticker.add((_time, deltaMs) => {
    const dt = clamp(deltaMs / 1000, 0.001, 0.1);
    const vh = window.innerHeight;

    if (live) {
      // Registration: each plate is a mass on a spring, pulled by the pointer and by scroll speed,
      // so the inks slip apart and settle back into register with a little overshoot.
      const y = window.scrollY;
      speed += (clamp((y - lastY) / dt / 2200, -1, 1) - speed) * Math.min(1, dt * 10);
      lastY = y;
      const u = unit();
      let moving = 0;
      for (let i = 0; i < 6; i++) {
        const slip = SLIP[i >> 1];
        const tug = i & 1 ? pointerY * 1.5 + speed * 2.6 : pointerX * 1.5;
        const target = u * (rest[i] + slip * tug);
        vel[i] += ((target - reg[i]) * 140 - vel[i] * 11) * dt;
        reg[i] += vel[i] * dt;
        moving += Math.abs(vel[i]) + Math.abs(target - reg[i]);
      }
      if (moving > 0.05) for (const s of sheets) if (s !== hero || s.flood < 1) s.dirty = true;

      // Rollers: ink follows the scroll down each sheet, one plate after another.
      for (const s of rollers) {
        if (s.front[2] > s.h + 80) continue;
        const r = s.el.getBoundingClientRect();
        if (r.bottom < 0) {
          // Passed while off screen: it is simply printed.
          s.front = [1e6, 1e6, 1e6];
          s.dirty = true;
        } else if (r.top < vh) {
          // Each roller trails the one before it up the screen, so the colours build as the
          // sheet rises. Left alone they creep on to the bottom of the screen, and no further.
          const edge = vh + 90 - r.top;
          s.front.forEach((f, i) => {
            if (f >= edge) return;
            const follow = vh * (0.95 - 0.12 * i) - r.top;
            const chased = f + (follow - f) * (1 - Math.exp(-dt * ROLL[i]));
            s.front[i] = Math.min(edge, Math.max(chased, f + CREEP * dt));
            s.dirty = true;
          });
        }
      }
    }

    for (const s of sheets) {
      if (!s.visible) continue;
      if (!ready.has(s)) cut(s);
      const r = s.el.getBoundingClientRect();
      const top = -r.top - 160;
      const bottom = vh - r.top + 160;
      if (lens) {
        // The lens follows the pointer with a little lag, and lets go when the pointer rests.
        const over = clientY >= r.top && clientY <= r.bottom && performance.now() - movedAt < 1800;
        const want = over && !(s === hero && s.zoom > 1.02) ? 1 : 0;
        const [x, y, pull] = s.ptr;
        const tx = clientX - r.left;
        const ty = clientY - r.top;
        if (pull < 0.01) s.ptr = [tx, ty, pull];
        else {
          const k = 1 - Math.exp(-dt * 13);
          s.ptr[0] = x + (tx - x) * k;
          s.ptr[1] = y + (ty - y) * k;
        }
        s.ptr[2] = pull + (want - pull) * (1 - Math.exp(-dt * (want ? 8 : 3)));
        if (!want && s.ptr[2] < 0.004) s.ptr[2] = 0;
        if (s.ptr[2] !== pull || (pull > 0 && Math.abs(tx - x) + Math.abs(ty - y) > 0.3)) s.dirty = true;
      }
      if (s.dirty) {
        press.draw(s, reg, top, bottom);
        span.set(s, [top, bottom]);
        quiet.set(s, 0);
      } else if (s.stale) {
        // Part of the sheet still shows an older state. Keep what scrolls into view current, and
        // once things have been still for a moment pull the whole sheet again.
        const still = (quiet.get(s) ?? 0) + dt;
        quiet.set(s, still);
        const [a, b] = span.get(s) ?? [0, 0];
        if (still > 0.3) press.draw(s, reg);
        else if (top < a || bottom > b) {
          press.draw(s, reg, top, bottom);
          span.set(s, [top, bottom]);
        }
      }
    }
  });

  /* ---- resize: lay out again, cut the plates again ---- */
  let size = [root.offsetWidth, root.offsetHeight];
  let timer = 0;
  new ResizeObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (Math.abs(root.offsetWidth - size[0]) < 1 && Math.abs(root.offsetHeight - size[1]) < 1) return;
      layoutHero();
      for (const s of ready) {
        cut(s);
        press.draw(s, reg);
      }
      size = [root.offsetWidth, root.offsetHeight];
      ScrollTrigger.refresh();
    }, 160);
  }).observe(root);

  ScrollTrigger.refresh();
}

const root = document.querySelector<HTMLElement>('.wo');
if (root) init(root);
