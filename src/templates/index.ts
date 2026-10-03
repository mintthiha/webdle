import Prestige from './Prestige.astro';
import Warmth from './Warmth.astro';
import Wow from './Wow.astro';
import Calm from './Calm.astro';

/** One template per design direction. Add new directions here and in src/lib/view.ts. */
export const templates = {
  prestige: Prestige,
  warmth: Warmth,
  wow: Wow,
  calm: Calm,
} as const;
