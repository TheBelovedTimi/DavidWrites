import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookBySlug } from '../../lib/db';

export const dynamic='force-dynamic';

export default async function BookPage({ params }) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  return (
    <main>
      <header className="site-header"><div className="shell site-header-inner"><Link className="wordmark" href="/">DAVID//WRITES</Link><nav className="nav"><Link href="/">Home</Link></nav></div></header>
      <section className="book-hero shell">{book.coverImage?<div style={{display:'grid',gridTemplateColumns:'minmax(150px,220px) 1fr',gap:28,alignItems:'center'}}><img src={book.coverImage} alt={`${book.title} cover`} style={{width:'100%',aspectRatio:'2 / 3',objectFit:'cover',borderRadius:12}}/><div><div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'BOOK')}</div><h1>{book.title}</h1><p>{book.description}</p>{book.status==='Coming Soon'?<div className="notice" style={{marginTop:24}}><strong>Coming Soon</strong><br/>{book.teaser || 'This book is still taking shape. Check back for its first published chapter.'}</div>:null}</div></div>:<><div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'BOOK')}</div><h1>{book.title}</h1><p>{book.description}</p>{book.status==='Coming Soon'?<div className="notice" style={{marginTop:24}}><strong>Coming Soon</strong><br/>{book.teaser || 'This book is still taking shape. Check back for its first published chapter.'}</div>:null}</>}
      </section>
      <section className="shell chapter-list">
        {book.chapters.length ? book.chapters.map((chapter,index)=> chapter.status==='Coming Soon' ? (
          <div className="chapter-row" key={chapter.slug} style={{cursor:'default'}}><div className="chapter-index">{String(index+1).padStart(2,'0')}</div><div><div className="chapter-title">{chapter.title}</div><div className="muted">{chapter.type}{chapter.excerpt?` · ${chapter.excerpt}`:''}</div></div><div className="chapter-meta">Coming Soon</div></div>
        ) : (
          <Link className="chapter-row" href={`/books/${book.slug}/${chapter.slug}`} key={chapter.slug}><div className="chapter-index">{String(index+1).padStart(2,'0')}</div><div><div className="chapter-title">{chapter.title}</div><div className="muted">{chapter.type}</div></div><div className="chapter-meta">Published · {chapter.read}</div></Link>
        )) : <p className="muted">This work is still taking shape. Chapters will appear here when they are ready.</p>}
      </section>
    </main>
  );
}
