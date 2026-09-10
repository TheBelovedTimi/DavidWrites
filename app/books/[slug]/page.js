import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBook } from '../../data';

export default async function BookPage({ params }) {
  const { slug } = await params;
  const book = getBook(slug);
  if (!book) notFound();

  return (
    <main>
      <header className="site-header">
        <div className="shell site-header-inner">
          <Link className="wordmark" href="/">DAVID//WRITES</Link>
          <nav className="nav"><Link href="/">Home</Link><Link href="/admin">Admin</Link></nav>
        </div>
      </header>
      <section className="book-hero shell">
        <div className="label">{book.label}</div>
        <h1>{book.title}</h1>
        <p>{book.description}</p>
      </section>
      <section className="shell chapter-list">
        {book.chapters.length ? book.chapters.map((chapter, index) => (
          <Link className="chapter-row" href={`/books/${book.slug}/${chapter.slug}`} key={chapter.slug}>
            <div className="chapter-index">{String(index + 1).padStart(2, '0')}</div>
            <div>
              <div className="chapter-title">{chapter.title}</div>
              <div className="muted">{chapter.type}</div>
            </div>
            <div className="chapter-meta">{chapter.status} · {chapter.read}</div>
          </Link>
        )) : <p className="muted">This work is still taking shape. Chapters will appear here when they are ready.</p>}
      </section>
    </main>
  );
}
