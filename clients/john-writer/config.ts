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
      // The description and excerpt are written for this demo, like the rest of the persona.
      // Character names are deliberately ordinary; no new places or institutions are named.
      page: {
        slug: 'leaving-tidewick',
        description: [
          'Leaving Tidewick follows one harbour town through a single winter, from the last ferry of ' +
            'the season to the first thaw. The fish plant has closed, the school is down to two ' +
            'classrooms, and half the houses on the hill are for sale.',
          'The people who stay keep the town running anyway: a ferry captain counting down to his ' +
            'retirement, a teenager deciding whether to go west for work, a widow who still opens the ' +
            'general store at six every morning. Told in linked stories that pass from one neighbour ' +
            'to the next, it is a quiet, closely watched book about what a place is made of once its ' +
            'people begin to leave, and what they carry with them when they go.',
        ],
        excerpt: [
          'The last ferry of the season left at four, and most of the town came down to watch it go. ' +
            'Nobody said that was why they had come. Martin had a parcel to collect, and the Doucette ' +
            'girls were only walking the dog, and Ruth from the store said she needed the air, though ' +
            'she stood the whole time with her back to the wind.',
          'From the wharf you could see the ferry turn in the channel and straighten, and then it was ' +
            'only a light, and then it was nothing you could be sure of. Someone started to talk about ' +
            'the weather. Someone else agreed. By the time the gulls had settled back on the pilings, ' +
            'people were drifting up the hill in twos and threes, the way they did after a funeral, ' +
            'nobody wanting to be the first one home.',
          'Ruth was the last to leave. She waited until the water had gone flat again, and then she ' +
            'went back up to open the store, because it was not yet five o’clock, and in Tidewick you ' +
            'kept your hours whether or not anyone came.',
        ],
        // Not connected on the sample site: the buttons show inactive, with a note.
        stores: [{ name: 'Indigo' }, { name: 'Amazon.ca' }, { name: 'Your local bookshop' }],
        praise: [],
      },
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
