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
