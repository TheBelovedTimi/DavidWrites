import Link from 'next/link';
import { listBooks } from './lib/db';
import LibraryBrowser from './components/LibraryBrowser';

export const dynamic='force-dynamic';

export default async function HomePage() {
  const books=await listBooks();
  const published=books.filter(book=>book.status==='Published');
  const featured=published[0] || books[0] || null;
  return (
    <main>
      <header className="site-header"><div className="shell site-header-inner"><Link className="wordmark ghost-wordmark" href="/">GHOST STORIES SOCIETY</Link><nav className="nav"><a href="#stories">Stories</a><a href="#genres">Genres</a><a href="#about">About</a><a href="#contact">Contact</a></nav></div></header>

      <section className="ghost-hero shell">
        <div className="ghost-mark">GSS · EST. IN THE MARGINS</div>
        <div className="ghost-hero-grid">
          <div><div className="eyebrow">Fiction by Doctor</div><h1>Some stories knock.<br/>Others wait inside.</h1><p>Ghost Stories Society is a private corner for mystery, romance, horror, suspense and strange fiction — stories built to make you ask one more question before you leave.</p><a className="button primary ghost-cta" href="#stories">Enter the library →</a></div>
          <aside className="ghost-note"><span>01</span><p>Quietly unsettling.<br/>Emotionally sharp.<br/>Impossible to leave alone.</p></aside>
        </div>
      </section>

      {featured?<section className="section shell ghost-feature"><div className="ghost-feature-copy"><div className="eyebrow">Featured story</div><h2>{featured.title}</h2><p>{featured.description}</p><div className="muted">{featured.label || 'FICTION'} · {featured.status}</div><Link className="button" href={`/books/${featured.slug}`}>Discover this story →</Link></div>{featured.coverImage?<Link href={`/books/${featured.slug}`} className="ghost-feature-cover"><img src={featured.coverImage} alt={`${featured.title} cover`}/></Link>:<div className="ghost-feature-placeholder">?</div>}</section>:null}

      <section id="stories" className="section shell"><div className="section-head"><div><div className="eyebrow">The collection</div><h2>Stories worth getting lost in.</h2></div><p>Browse everything Doctor has released or is preparing. Follow the question that bothers you most.</p></div><LibraryBrowser books={books}/></section>

      <section id="genres" className="section shell ghost-genres"><div><div className="eyebrow">No single shelf</div><h2>Horror is only one door.</h2></div><div className="genre-cloud"><span>Horror</span><span>Mystery</span><span>Romance</span><span>Dark Romance</span><span>Thriller</span><span>Supernatural</span><span>Psychological</span><span>Suspense</span></div></section>

      <section id="about" className="section shell ghost-about"><div className="ghost-about-number">D.</div><div><div className="eyebrow">About the author</div><h2>Doctor writes toward the strange part of ordinary things.</h2><div className="ghost-copy"><p>Doctor is a fiction writer drawn to stories that begin with curiosity and slowly become difficult to put down. Mystery, romance, horror, psychological tension, suspense and unusual situations often meet in the same room.</p><p>The aim is not to be dramatic for the sake of it. The stories here are written to feel natural and immersive — to let atmosphere build quietly, to let characters make complicated choices, and to leave enough unanswered that the reader wants to keep going.</p><p>Ghost Stories Society is the home for that work. The name carries a darker edge, but the library is not restricted to horror. It is a place for any story with a pulse, a secret, a question or a little danger in it.</p></div></div></section>

      <section id="contact" className="section shell ghost-contact"><div className="eyebrow">Reader correspondence</div><h2>Found something that stayed with you?</h2><p className="muted">Contact and social links will live here when Doctor is ready to share them.</p></section>

      <footer className="site-footer ghost-footer"><div className="shell footer-inner"><div><div className="wordmark ghost-wordmark">GHOST STORIES SOCIETY</div><p className="muted">Mystery, romance, horror and other beautiful problems.</p></div><div className="footer-links"><a href="#stories">Stories</a><a href="#genres">Genres</a><a href="#about">Doctor</a><a href="#contact">Contact</a></div><div className="footer-copy">© {new Date().getFullYear()} Ghost Stories Society.<br/>Written by Doctor.</div></div></footer>
    </main>
  );
}
