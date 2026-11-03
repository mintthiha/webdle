import type { Teacher } from '../../src/schemas/client';

// SAMPLE CONTENT — fictional persona for demo purposes only.
// Set in Canada: school names, degrees, grades and spelling follow Canadian usage.
// The person, town, schools, publishers and titles are all invented, and written to read like a
// finished site. The invented names were searched for on 2026-10-04 and matched no real
// institution; search again before adding or changing one.
const jane: Teacher = {
  slug: 'jane-teacher',
  archetype: 'teacher',
  name: 'Jane Teacher',
  domain: 'https://jane-teacher.example',
  tagline: 'Secondary English educator helping students find their voice through writing.',
  location: 'Larkmere, Ontario',
  sameAs: [],
  // The French site (/fr/). Written for this demo in Canadian French, using Ontario's school terms.
  // School, university and journal names, and the article title, stay as they are.
  translations: {
    fr: {
      tagline: 'Enseignante d’anglais au secondaire qui aide les élèves à trouver leur voix par l’écriture.',
      location: 'Larkmere (Ontario)',
      bio:
        'Jane Teacher enseigne l’anglais au secondaire depuis 2010. Dans sa classe, tout passe par le ' +
        'brouillon : les élèves écrivent souvent, se lisent les uns les autres et révisent jusqu’à ce ' +
        'que le texte dise ce qu’ils voulaient dire. Cheffe de section d’anglais à Larkmere Secondary ' +
        'School, elle y enseigne l’anglais de 12e année, l’écriture créative et l’art oratoire, et elle ' +
        'écrit pour ses collègues sur la façon d’enseigner la révision.',
      credentials: [
        { degree: 'M. Éd. en études des programmes', location: 'Ontario' },
        { degree: 'B. Éd., cycles intermédiaire et supérieur' },
        { degree: 'B.A. spécialisé en littérature anglaise' },
      ],
      teaching: [
        {
          role: 'Cheffe de section d’anglais',
          department: 'Section d’anglais',
          courses: ['Anglais de 12e année', 'Écriture créative', 'Anglais de 10e année', 'Art oratoire'],
        },
        { role: 'Enseignante d’anglais', courses: ['Langue anglaise de 8e année', 'Langue anglaise de 7e année'] },
      ],
      speaking: {
        intro:
          'Jane s’adresse au personnel enseignant, aux sections d’anglais et aux élèves : elle parle ' +
          'd’enseigner l’écriture par la révision et de prendre la parole en public. Les séances ont ' +
          'lieu en personne ou en ligne.',
        talks: [
          {
            title: 'Plaidoyer pour le deuxième jet',
            audience: 'Personnel enseignant d’anglais au secondaire et chefs de section',
            format: 'Atelier, 90 minutes',
            summary:
              'Comment bâtir une unité d’écriture autour de la révision plutôt que de la reléguer à la ' +
              'fin : calendrier des brouillons, lecture entre pairs structurée et rétroaction que les ' +
              'élèves utilisent vraiment. On repart avec un plan d’unité à adapter dès la semaine suivante.',
          },
          {
            title: 'Une lecture entre pairs qui fonctionne',
            audience: 'Personnel enseignant, de la 7e à la 12e année',
            format: 'Séance, 60 minutes',
            summary:
              'Lire le brouillon d’un ou d’une camarade peut être l’heure la plus utile de la semaine, ' +
              'ou la moins utile. Un regard pratique sur les routines, les consignes et les rôles qui ' +
              'rendent la rétroaction entre pairs précise, bienveillante et utile.',
          },
          {
            title: 'Dire ce qu’on veut dire',
            audience: 'Élèves de la 9e à la 12e année',
            format: 'Conférence en assemblée ou visite en classe, 45 minutes',
            summary:
              'Une conférence pour les élèves sur la prise de parole devant les autres : se préparer, ' +
              'gérer le trac et aller droit au but. Tirée de nombreuses années d’enseignement de l’art ' +
              'oratoire, avec une période de questions à la fin.',
          },
        ],
      },
    },
  },
  // Talks drawn from the bio (revision, peer reading, public speaking); written for this demo.
  speaking: {
    intro:
      'Jane speaks to teachers, English departments and students about teaching writing through ' +
      'revision, and about speaking in front of others. Sessions run in person or online.',
    talks: [
      {
        title: 'The Case for the Second Draft',
        audience: 'Secondary English teachers and department heads',
        format: 'Workshop, 90 minutes',
        summary:
          'How to build a writing unit around revision instead of ending it there: drafting ' +
          'schedules, structured peer reading, and feedback students actually use. Teachers leave ' +
          'with a unit outline they can adapt the following week.',
      },
      {
        title: 'Peer Reading That Works',
        audience: 'Teachers, Grades 7 to 12',
        format: 'Session, 60 minutes',
        summary:
          "Students reading each other's drafts can be the most useful hour of the week, or the " +
          'least. A practical look at the routines, prompts and roles that make peer feedback ' +
          'specific, kind and worth acting on.',
      },
      {
        title: 'Saying What You Mean',
        audience: 'Students, Grades 9 to 12',
        format: 'Assembly talk or class visit, 45 minutes',
        summary:
          'A talk for students about speaking in front of others: preparing, handling nerves, and ' +
          'getting to the point. Drawn from years of teaching public speaking, with time for ' +
          'questions at the end.',
      },
    ],
  },
  bio:
    'Jane Teacher has taught secondary English since 2010. Her classroom runs on drafts: students ' +
    "write often, read each other's work, and revise until the piece says what they meant. She " +
    'is Head of English at Larkmere Secondary School, where she teaches Grade 12 English, creative ' +
    'writing and public speaking, and she writes for other teachers about how revision is taught.',
  credentials: [
    {
      year: 2012,
      degree: 'M.Ed. in Curriculum Studies',
      institution: 'Brackwell University',
      location: 'Ontario',
    },
    {
      year: 2009,
      degree: 'B.Ed., Intermediate and Senior Divisions',
      institution: 'Brackwell University',
    },
    {
      year: 2008,
      degree: 'B.A. (Hons) in English Literature',
      institution: 'Halvering University',
    },
  ],
  teaching: [
    {
      startYear: 2016,
      endYear: null,
      role: 'Head of English',
      institution: 'Larkmere Secondary School',
      department: 'English Department',
      courses: ['Grade 12 English', 'Creative Writing', 'Grade 10 English', 'Public Speaking'],
    },
    {
      startYear: 2010,
      endYear: 2016,
      role: 'English Teacher',
      institution: 'Wrenfield Public School',
      courses: ['Grade 8 Language Arts', 'Grade 7 Language Arts'],
    },
  ],
  publications: [
    {
      title: 'The Case for the Second Draft',
      venue: 'Brackwell Education Review',
      year: 2019,
      type: 'article',
    },
  ],
};

export default jane;
