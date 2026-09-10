import Link from 'next/link';
import { listBooks } from './lib/db';

export const dynamic='force-dynamic';

export default async function HomePage() {
  const books=await listBooks();
  return (
    <main>
      <header className="site-header"><div className="shell site-header-inner"><Link className="wordmark" href="/">DAVID//WRITES</Link><nav className="nav"><a href="#library">Library</a></nav></div></header>
      <section className="hero shell"><div className="eyebrow">Personal fiction · works in progress</div><h1>Stories from other versions.</h1><p>A living library of fiction, fragments and books still becoming. Read what is published, return for what changes, and follow the work as it takes shape.</p></section>
      <section id="library" className="section shell"><div className="section-head"><h2>The library</h2><p>Stories at different stages of becoming.</p></div><div className="book-grid">
        {books.map(book=><Link key={book.slug} href={`/books/${book.slug}`} className={`book-card ${book.accent}`} style={{overflow:'hidden'}}>{book.coverImage?<img src={book.coverImage} alt={`${book.title} cover`} style={{width:'100%',aspectRatio:'2 / 3',objectFit:'cover',display:'block',marginBottom:18,borderRadius:10}}/>:null}<div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'BOOK')}</div><h3>{book.title}</h3><p>{book.description}</p><div className="card-foot"><span>{book.status}</span><span>{book.chapters.length} {book.chapters.length===1?'chapter':'chapters'} →</span></div></Link>)}
      </div></section>
    </main>
  );
}
