import type { Client, Publication } from '../schemas/client';
import { toView } from './view';
import { strings, type Lang } from './i18n';

/**
 * What a client's site tells search engines about them, in one place: the page head prints it as
 * JSON-LD (layouts/Base.astro) and the "How it looks in Google" panel (components/SearchPreview.astro)
 * reads it back in plain words, so the two cannot disagree. Everything here comes from the client
 * config; nothing is inferred beyond the archetype's own role word.
 */

const workType = {
  book: 'Book',
  article: 'Article',
  essay: 'Article',
  story: 'ShortStory',
  chapter: 'Chapter',
} as const;

/** Where a piece appeared: a book's venue is its publisher, a chapter's is the book, the rest are periodicals. */
function venue(p: Publication) {
  if (p.type === 'book') return { publisher: { '@type': 'Organization', name: p.venue } };
  if (p.type === 'chapter') return { isPartOf: { '@type': 'Book', name: p.venue } };
  return { isPartOf: { '@type': 'Periodical', name: p.venue } };
}

/** `client` should already be in `lang` (i18n.ts `localize`). */
export function searchData(client: Client, lang: Lang = 'en') {
  const v = toView(client, lang);
  const site = client.domain.replace(/\/$/, '');
  const personId = `${site}/#person`;
  /** The site's home in this language: the French one is under /fr/. */
  const home = lang === 'fr' ? `${site}/fr/` : `${site}/`;
  const jobTitle = v.current?.role ?? v.role;
  const alumniOf = [...new Set(v.education.map((c) => c.institution))];

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: client.name,
    description: client.tagline,
    url: client.domain,
    jobTitle,
    ...(v.current && { worksFor: { '@type': 'EducationalOrganization', name: v.current.institution } }),
    ...(client.location && { homeLocation: { '@type': 'Place', name: client.location } }),
    ...(alumniOf.length > 0 && {
      alumniOf: alumniOf.map((name) => ({ '@type': 'EducationalOrganization', name })),
    }),
    ...(v.education.length > 0 && {
      hasCredential: v.education.map((c) => ({
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'degree',
        name: c.degree,
        recognizedBy: { '@type': 'EducationalOrganization', name: c.institution },
      })),
    }),
    ...(client.sameAs.length > 0 && { sameAs: client.sameAs }),
  };

  const works = v.publications.map((p) => ({
    '@type': workType[p.type],
    name: p.title,
    author: { '@id': personId },
    datePublished: String(p.year),
    ...venue(p),
    ...(p.page && { description: p.page.description[0], url: `${site}/books/${p.page.slug}/` }),
    ...(!p.page && p.url && { url: p.url }),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${home}#page`,
        url: home,
        name: client.name,
        inLanguage: strings[lang].htmlLang,
        mainEntity: { '@id': personId },
      },
      person,
      ...works,
    ],
  };

  /** The same facts, worded for a person. `prop` is the JSON-LD property each one comes from. */
  const facts: { label: string; prop: string; value: string[] }[] = [
    { label: 'Name', prop: 'name', value: [client.name] },
    { label: 'Profession', prop: 'jobTitle', value: [jobTitle] },
    ...(v.current ? [{ label: 'Works at', prop: 'worksFor', value: [v.current.institution] }] : []),
    ...(client.location ? [{ label: 'Based in', prop: 'homeLocation', value: [client.location] }] : []),
    ...(v.education.length > 0
      ? [{ label: 'Studied', prop: 'hasCredential', value: v.education.map((c) => `${c.degree}, ${c.institution}`) }]
      : []),
    ...(v.publications.length > 0
      ? [{ label: 'Published', prop: 'author', value: v.publications.map((p) => `${p.title} (${p.venue}, ${p.year})`) }]
      : []),
    {
      label: 'Official profiles',
      prop: 'sameAs',
      value: client.sameAs.length > 0 ? client.sameAs : [],
    },
  ];

  return { jsonLd, facts, host: new URL(client.domain).host };
}
