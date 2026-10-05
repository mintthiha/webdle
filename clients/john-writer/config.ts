import type { Writer } from '../../src/schemas/client';

// SAMPLE CONTENT — fictional persona for demo purposes only.
// Set in Canada: place, degrees and spelling follow Canadian usage.
// The person, town, schools, publishers and titles are all invented, and written to read like a
// finished site. The invented names were searched for on 2026-10-04 and matched no real
// institution; search again before adding or changing one.
const john: Writer = {
  slug: 'john-writer',
  archetype: 'writer',
  name: 'John Writer',
  domain: 'https://john-writer.example',
  tagline: 'Author of essays and fiction about places, memory, and the people who leave them.',
  location: 'Tidewick, Nova Scotia',
  sameAs: [],
  bio:
    'John Writer writes essays and fiction about small coastal towns and the people who move away ' +
    'from them. His first book, Leaving Tidewick, follows one harbour town through a single winter. ' +
    'His shorter work has appeared in The Halvering Review and Thornwick Quarterly. He lives in ' +
    'Tidewick, a short walk from the ferry, and is at work on a second book.',
  credentials: [
    {
      year: 2014,
      degree: 'MFA in Creative Writing',
      institution: 'Halvering University',
    },
  ],
  teaching: [],
  publications: [
    {
      title: 'Leaving Tidewick',
      venue: 'Harrowgull Press',
      year: 2022,
      type: 'book',
    },
    {
      title: 'A Map of Closed Shops',
      venue: 'The Halvering Review',
      year: 2020,
      type: 'essay',
    },
    {
      title: 'Salt on the Windows',
      venue: 'Thornwick Quarterly',
      year: 2018,
      type: 'story',
    },
  ],
};

export default john;
