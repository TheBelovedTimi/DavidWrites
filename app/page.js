import Link from 'next/link';
import { books } from './data';

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <div className="shell site-header-inner">
          <Link className="wordmark" href="/">DAVID//WRITES</Link>
          <nav className="nav"><a href="#library">Library</a><Link href="/admin">Admin</Link></nav>
        </div>
      </header>
      <section className="hero shell">
        <div className="eyebrow">Personal fiction · works in progress</div>
        <h1>Stories from other versions.</h1>
        <p>A living library of fiction, fragments and books still becoming. Read what is published, return for what changes, and follow the work as it takes shape.</p>
      </section>
      <section id="library" className="section shell">
        <div className="section-head">
          <h2>The library</h2>
          <p>Three worlds at different stages of becoming, each with its own atmosphere.</p>
        </div>
        <div className="book-grid">
          {books.map((book) => (
            <Link key={book.slug} href={`/books/${book.slug}`} className={`book-card ${book.accent}`}>
              <div className="label">{book.label}</div>
              <h3>{book.title}</h3>
              <p>{book.description}</p>
              <div className="card-foot"><span>{book.status}</span><span>{book.chapters.length} {book.chapters.length === 1 ? 'chapter' : 'chapters'} →</span></div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
