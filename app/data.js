export const books = [
  {
    slug: 'unwritten-versions',
    title: 'UNWRITTEN VERSIONS',
    label: 'ONGOING · PERSONAL FICTION',
    status: 'Ongoing',
    description: 'A life explored through the versions that were lived, written, and left unwritten.',
    accent: 'violet',
    chapters: [
      {
        slug: 'the-night-it-returned',
        title: 'The Night It Returned',
        type: 'Episode One',
        status: 'Published',
        read: '5 min read',
        blocks: [
          { type: 'paragraph', text: 'The room was quiet enough for hope to sound convincing.' },
          { type: 'paragraph', text: 'I was texting Rhythm that night. Nothing dramatic. Nothing that should have become a landmark in memory. Just words passing between two people while the rest of the world seemed willing to leave me alone.' },
          { type: 'paragraph', text: 'For the first time in a while, something felt possible. I had received my first paycheck. It was not everything, but it was proof that perhaps life had begun moving again.' },
          { type: 'divider' },
          { type: 'paragraph', text: 'Then it returned.' },
          { type: 'quote', text: 'Not loudly. That would have been easier. It returned with the familiarity of something that already knew where I lived.' }
        ]
      },
      {
        slug: 'therapy-session-how-it-began',
        title: 'Therapy Session: How It Began',
        type: 'Episode Two',
        status: 'Draft',
        read: '7 min read',
        blocks: [
          { type: 'paragraph', text: 'She did not ask me whether I was ready.' },
          { type: 'quote', text: 'Start with the first time, she said.' },
          { type: 'paragraph', text: 'I looked at the space between us, hoping it might contain an easier answer. It did not.' },
          { type: 'paragraph', text: 'The house came back first. The wooden decking. The lantern. The strange certainty that something had begun long before I had words for it.' }
        ]
      }
    ]
  },
  {
    slug: 'occupants',
    title: 'OCCUPANTS',
    label: 'FICTION · HORROR / MYSTERY',
    status: 'In Development',
    description: 'Some spaces do not become empty simply because everyone has left.',
    accent: 'cyan',
    chapters: [
      {
        slug: 'scene-one',
        title: 'Scene One',
        type: 'Opening Scene',
        status: 'Draft',
        read: '4 min read',
        blocks: [
          { type: 'paragraph', text: 'The apartment did not look haunted. That was the problem.' },
          { type: 'paragraph', text: 'It sat in the quiet seam between the city and its outskirts, where traffic became a distant pulse and neighbours still knew which cars belonged on the street.' },
          { type: 'paragraph', text: 'Nothing about the building asked to be feared.' }
        ]
      }
    ]
  },
  {
    slug: 'weight-of-tomorrow',
    title: 'THE WEIGHT OF TOMORROW',
    label: 'IN DEVELOPMENT',
    status: 'In Development',
    description: 'A new work currently taking shape.',
    accent: 'amber',
    chapters: []
  }
];

export function getBook(slug) {
  return books.find((book) => book.slug === slug);
}

export function getChapter(bookSlug, chapterSlug) {
  const book = getBook(bookSlug);
  if (!book) return {};
  const chapter = book.chapters.find((item) => item.slug === chapterSlug);
  return { book, chapter };
}
