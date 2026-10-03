import type { Client } from '../schemas/client';
import type { Motif } from './art';

export const directions = [
  {
    slug: 'prestige',
    name: 'Prestige',
    feeling: 'Credibility and gravitas',
    blurb: 'Oxblood, engraved line work and a high-contrast serif. Reads like a university press jacket.',
  },
  {
    slug: 'warmth',
    name: 'Warmth',
    feeling: 'Warmth and personality',
    blurb: 'Sunny colour, paper-cut collage and a friendly voice. Feels like meeting the person.',
  },
  {
    slug: 'wow',
    name: 'Wow',
    feeling: 'Cutting-edge and bold',
    blurb: 'Ultramarine, kinetic type and pinned scroll sequences. The one people screenshot.',
  },
  {
    slug: 'calm',
    name: 'Calm',
    feeling: 'Calm and focused',
    blurb: 'Quiet horizons, generous space and slow fades. Lets the writing and teaching do the talking.',
  },
] as const;

export type DirectionSlug = (typeof directions)[number]['slug'];

export function toView(client: Client) {
  const motif: Motif = client.archetype;
  const firstName = client.name.split(' ')[0];
  const lastName = client.name.split(' ').slice(1).join(' ');
  const roles = [...client.teaching].sort((a, b) => b.startYear - a.startYear);
  const education = [...client.credentials].sort((a, b) => b.year - a.year);
  const publications = [...client.publications].sort((a, b) => b.year - a.year);
  const current = roles.find((r) => r.endYear === null);
  const courses = roles.flatMap((r) => r.courses.map((course) => ({ course, institution: r.institution })));
  const latest = publications[0];
  const since = roles.length ? Math.min(...roles.map((r) => r.startYear)) : undefined;
  const typeLabel = { book: 'Book', article: 'Article', essay: 'Essay', story: 'Story', chapter: 'Chapter' } as const;
  const period = (start: number, end: number | null) => `${start}–${end ?? 'Present'}`;
  /** The one factual line used for "now" moments: current role, or latest publication. */
  const nowLine = current
    ? `${current.role}, ${current.institution}`
    : latest
      ? `${latest.title}, ${latest.venue}, ${latest.year}`
      : client.tagline;
  const nowLabel = current ? 'Currently' : 'Latest';
  const workLabel = client.archetype === 'teacher' ? 'Teaching' : 'Writing';
  const role = client.archetype === 'teacher' ? 'Educator' : 'Author';
  return {
    motif,
    firstName,
    lastName,
    roles,
    education,
    publications,
    current,
    courses,
    latest,
    since,
    typeLabel,
    period,
    nowLine,
    nowLabel,
    workLabel,
    role,
  };
}

export type View = ReturnType<typeof toView>;
