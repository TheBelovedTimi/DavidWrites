export const books = [];

export function getBook(slug) {
  return books.find((book) => book.slug === slug);
}

export function getChapter(bookSlug, chapterSlug) {
  const book = getBook(bookSlug);
  if (!book) return {};
  const chapter = book.chapters.find((item) => item.slug === chapterSlug);
  return { book, chapter };
}
