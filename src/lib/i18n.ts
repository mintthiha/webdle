import type { Client } from '../schemas/client';

/**
 * Languages for the Classic site. English is the client's config as written; French merges the
 * config's `translations.fr` over it (`localize`) and swaps the interface words (`strings`).
 * Canadian French: Ontario's school terms, no space before ? and !, a non-breaking one before : and
 * inside « ».
 */
export const langs = ['en', 'fr'] as const;
export type Lang = (typeof langs)[number];

/** Each page's folder in each language; Home is the site's root. */
const slugs = {
  en: { home: '', about: 'about', work: 'work', speaking: 'speaking', contact: 'contact', cv: 'cv' },
  fr: { home: '', about: 'a-propos', work: 'enseignement', speaking: 'conferences', contact: 'contact', cv: 'cv' },
} as const;
export type LocalPage = keyof (typeof slugs)['en'];

/** A writer's French "work" page is about writing, not teaching. */
function slug(lang: Lang, page: LocalPage, client: Client) {
  return lang === 'fr' && page === 'work' && client.archetype === 'writer' ? 'ecrits' : slugs[lang][page];
}

/** The page's address on the sample: /classic/<client>/ in English, /classic/<client>/fr/ in French. */
export function classicHref(client: Client, lang: Lang, page: LocalPage) {
  const s = slug(lang, page, client);
  return `/classic/${client.slug}/${lang === 'fr' ? 'fr/' : ''}${s ? `${s}/` : ''}`;
}

/** The folder name a French route uses for a page (the reverse of `classicHref`). */
export function frenchSlug(client: Client, page: LocalPage) {
  return slug('fr', page, client);
}

/** Which languages a client's site is in. */
export function clientLangs(client: Client): Lang[] {
  return client.translations?.fr ? ['en', 'fr'] : ['en'];
}

/**
 * The client in `lang`: their own words replaced by the translation, everything else (names, years,
 * schools, published titles) kept. A part of the site with no translation stops the build rather
 * than showing English on a French page.
 */
export function localize(client: Client, lang: Lang): Client {
  if (lang === 'en') return client;
  const fr = client.translations?.fr;
  if (!fr) throw new Error(`${client.slug} has no translations.fr`);
  const missing = (what: string) => new Error(`${client.slug}: translations.fr needs ${what}, or the French site would show it in English`);
  function pair<T, U>(en: T[], tr: U[] | undefined, what: string): (T & U)[] {
    if (en.length === 0) return [];
    if (!tr) throw missing(what);
    if (tr.length !== en.length) throw new Error(`${client.slug}: translations.fr.${what} has ${tr.length} entries; the English has ${en.length}`);
    return en.map((e, i) => ({ ...e, ...tr[i] }));
  }
  if (client.speaking && !fr.speaking) throw missing('speaking');
  if (client.newsletter && !fr.newsletter) throw missing('newsletter');
  if (client.location && !fr.location) throw missing('location');

  return {
    ...client,
    tagline: fr.tagline,
    bio: fr.bio,
    location: fr.location,
    credentials: pair(client.credentials, fr.credentials, 'credentials'),
    teaching: pair(client.teaching, fr.teaching, 'teaching'),
    ...(client.speaking && fr.speaking && {
      speaking: { intro: fr.speaking.intro, talks: pair(client.speaking.talks, fr.speaking.talks, 'speaking.talks') },
    }),
    ...(client.newsletter && fr.newsletter && { newsletter: { ...client.newsletter, ...fr.newsletter } }),
  } as Client;
}

const en = {
  htmlLang: 'en-CA',
  langName: 'English',
  langLabel: 'Language',
  role: { teacher: 'Educator', writer: 'Author' },
  workLabel: { teacher: 'Teaching', writer: 'Writing' },
  now: { current: 'Currently', latest: 'Latest' },
  present: 'Present',
  type: { book: 'Book', article: 'Article', essay: 'Essay', story: 'Story', chapter: 'Chapter' },
  nav: { home: 'Home', about: 'About', speaking: 'Speaking', contact: 'Contact', cv: 'CV', main: 'Main', footer: 'Footer' },
  home: {
    more: (first: string) => `More about ${first}`,
    touch: 'Get in touch',
    teach: ['What ', 'I teach'],
    selected: ['Selected ', 'writing'],
    all: (work: string) => `All ${work.toLowerCase()}`,
  },
  about: {
    title: ['Bio ', 'and credentials'],
    cv: 'View and download CV',
    both: ['Education ', 'and teaching'],
    education: 'Education',
    teaching: 'Teaching',
  },
  work: {
    teacherTitle: ['Teaching ', 'and courses'],
    aboutBook: 'About the book',
    read: 'Read it',
    teaching: 'Teaching',
    published: ['Published ', 'writing'],
    also: ['Also ', 'published'],
  },
  contact: {
    title: ['Get ', 'in touch'],
    teacher: 'For speaking, consulting and collaboration, write here.',
    writer: 'For press, events and rights enquiries, write here.',
    name: 'Name',
    email: 'Email',
    message: 'Message',
    send: 'Send message',
    demo: 'Demo only. The form is not connected on sample sites.',
  },
  footer: 'Sample site with fictional content, a demo by webdle.',
  cv: {
    title: ['Curriculum ', 'vitae'],
    intro: { teacher: 'Teaching, education and writing on one page, ready to download or print.', writer: 'Writing and education on one page, ready to download or print.' },
    download: 'Download PDF',
    print: 'Print',
    label: (name: string) => `CV of ${name}`,
    file: (name: string) => `${name} CV.pdf`,
    teaching: 'Teaching experience',
    education: 'Education',
    publications: 'Publications',
    courses: 'Courses: ',
    quote: ['“', '.”'],
    foot: 'Sample CV with fictional content, a demo by webdle.',
  },
  speaking: {
    title: ['Speaking ', 'and workshops'],
    for: 'For',
    format: 'Format',
    ask: ['Planning ', 'an event?'],
    askBody: 'Write with the date, who will be in the room, and what you hope they leave with.',
    button: 'Ask about a talk',
  },
  book: {
    back: 'All writing',
    buy: 'Buy the book',
    storesDemo: 'Demo only. Store links are not connected on sample sites.',
    excerpt: ['From ', 'the book'],
    praise: 'Praise',
    praiseEmpty: 'Praise goes here.',
    praiseEmptyBody: 'Quotes from reviews and other writers are added once each one is checked against its source, so nothing on the page is made up.',
  },
  news: {
    kicker: 'Newsletter',
    email: 'Email address',
    subscribe: 'Subscribe',
    demo: 'Demo only. Nothing is sent from sample sites.',
    invalid: 'Please enter an email address, like name@example.com.',
    thanks: (first: string) => `Thank you. On ${first}'s real site, this would add you to the list. This is a demo, so nothing was sent.`,
  },
};

export type Strings = typeof en;

const fr: Strings = {
  htmlLang: 'fr-CA',
  langName: 'Français',
  langLabel: 'Langue',
  // Epicene on purpose: the site never has to guess at the client's gender.
  role: { teacher: 'Pédagogue', writer: 'Plume' },
  workLabel: { teacher: 'Enseignement', writer: 'Écrits' },
  now: { current: 'Actuellement', latest: 'Dernière parution' },
  present: 'aujourd’hui',
  type: { book: 'Livre', article: 'Article', essay: 'Essai', story: 'Nouvelle', chapter: 'Chapitre' },
  nav: { home: 'Accueil', about: 'À propos', speaking: 'Conférences', contact: 'Contact', cv: 'CV', main: 'Menu principal', footer: 'Pied de page' },
  home: {
    more: (first: string) => `En savoir plus sur ${first}`,
    touch: 'Prendre contact',
    teach: ['Ce que ', 'j’enseigne'],
    selected: ['Écrits ', 'choisis'],
    all: (work: string) => (work === 'Écrits' ? 'Tous les écrits' : 'Tout l’enseignement'),
  },
  about: {
    title: ['Parcours ', 'et diplômes'],
    cv: 'Consulter et télécharger le CV',
    both: ['Formation ', 'et enseignement'],
    education: 'Formation',
    teaching: 'Enseignement',
  },
  work: {
    teacherTitle: ['Enseignement ', 'et cours'],
    aboutBook: 'À propos du livre',
    read: 'Lire',
    teaching: 'Enseignement',
    published: ['Écrits ', 'publiés'],
    also: ['Autres ', 'publications'],
  },
  contact: {
    title: ['Prendre ', 'contact'],
    teacher: 'Pour une conférence, une consultation ou une collaboration, écrivez ici.',
    writer: 'Pour la presse, les événements et les droits, écrivez ici.',
    name: 'Nom',
    email: 'Courriel',
    message: 'Message',
    send: 'Envoyer le message',
    demo: 'Démo seulement. Le formulaire n’est pas relié sur les sites exemples.',
  },
  footer: 'Site exemple au contenu fictif, une démo de webdle.',
  cv: {
    title: ['Curriculum ', 'vitæ'],
    intro: {
      teacher: 'Enseignement, formation et écrits sur une page, à télécharger ou à imprimer.',
      writer: 'Écrits et formation sur une page, à télécharger ou à imprimer.',
    },
    download: 'Télécharger le PDF',
    print: 'Imprimer',
    label: (name: string) => `CV de ${name}`,
    file: (name: string) => `${name} CV (FR).pdf`,
    teaching: 'Expérience en enseignement',
    education: 'Formation',
    publications: 'Publications',
    courses: 'Cours : ',
    quote: ['« ', ' ».'],
    foot: 'CV exemple au contenu fictif, une démo de webdle.',
  },
  speaking: {
    title: ['Conférences ', 'et ateliers'],
    for: 'Pour',
    format: 'Format',
    ask: ['Vous organisez ', 'un événement?'],
    askBody: 'Écrivez en précisant la date, le public attendu et ce que vous souhaitez qu’il en retienne.',
    button: 'Demander une conférence',
  },
  book: {
    back: 'Tous les écrits',
    buy: 'Acheter le livre',
    storesDemo: 'Démo seulement. Les liens vers les librairies ne sont pas reliés sur les sites exemples.',
    excerpt: ['Extrait ', 'du livre'],
    praise: 'Critiques',
    praiseEmpty: 'Les critiques viendront ici.',
    praiseEmptyBody: 'Chaque citation de critique ou d’auteur est ajoutée une fois vérifiée auprès de sa source; rien n’est inventé.',
  },
  news: {
    kicker: 'Infolettre',
    email: 'Adresse courriel',
    subscribe: 'S’abonner',
    demo: 'Démo seulement. Rien n’est envoyé depuis les sites exemples.',
    invalid: 'Veuillez entrer une adresse courriel, par exemple nom@exemple.ca.',
    thanks: (first: string) => `Merci. Sur le vrai site de ${first}, cette inscription vous ajouterait à la liste. Comme il s’agit d’une démo, rien n’a été envoyé.`,
  },
};

export const strings: Record<Lang, Strings> = { en, fr };
