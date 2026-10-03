import type { Writer } from '../../src/schemas/client';

// SAMPLE CONTENT — fictional persona for demo purposes only.
const john: Writer = {
  slug: 'john-writer',
  archetype: 'writer',
  name: 'John Writer',
  domain: 'https://john-writer.example',
  tagline: 'Author of essays and fiction about places, memory, and the people who leave them.',
  location: 'Sample Town',
  sameAs: [],
  bio:
    'John Writer is a sample author persona. This paragraph shows how a real client bio would ' +
    'read: who they are, what they write, and what readers can expect. On a live site this ' +
    'text is written with the client and approved by them, and every credit and publication ' +
    'listed is verified before launch.',
  credentials: [
    {
      year: 2014,
      degree: 'MFA in Creative Writing',
      institution: 'Sample University',
    },
  ],
  teaching: [],
  publications: [
    {
      title: 'The Example Harbor',
      venue: 'Placeholder Press',
      year: 2022,
      type: 'book',
    },
    {
      title: 'A Sample Essay on Leaving',
      venue: 'The Sample Review',
      year: 2020,
      type: 'essay',
    },
    {
      title: 'Short Story Placeholder',
      venue: 'Example Quarterly',
      year: 2018,
      type: 'story',
    },
  ],
};

export default john;
