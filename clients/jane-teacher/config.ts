import type { Teacher } from '../../src/schemas/client';

// SAMPLE CONTENT — fictional persona for demo purposes only.
const jane: Teacher = {
  slug: 'jane-teacher',
  archetype: 'teacher',
  name: 'Jane Teacher',
  domain: 'https://jane-teacher.example',
  tagline: 'Secondary English educator helping students find their voice through writing.',
  location: 'Sample City',
  sameAs: [],
  bio:
    'Jane Teacher is a sample secondary English teacher persona. This paragraph shows how a real ' +
    'client bio would read: a short narrative about who they are, what they teach, and what ' +
    'they care about in the classroom. Every line of a live client site is supplied and approved ' +
    'by the client, never invented.',
  credentials: [
    {
      year: 2012,
      degree: 'M.Ed. in Curriculum and Instruction',
      institution: 'Sample State University',
      location: 'Sample City',
    },
    {
      year: 2008,
      degree: 'B.A. in English Literature',
      institution: 'Example College',
    },
  ],
  teaching: [
    {
      startYear: 2016,
      endYear: null,
      role: 'Lead English Teacher',
      institution: 'Example High School',
      department: 'English Department',
      courses: ['AP Literature', 'Creative Writing', 'English 10', 'Public Speaking'],
    },
    {
      startYear: 2010,
      endYear: 2016,
      role: 'English Teacher',
      institution: 'Placeholder Middle School',
      courses: ['English 8', 'Journalism'],
    },
  ],
  publications: [
    {
      title: 'Sample Article on Teaching Writing',
      venue: 'Example Educators Journal',
      year: 2019,
      type: 'article',
    },
  ],
};

export default jane;
