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
