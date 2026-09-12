import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookBySlug } from '../../lib/db';

export const dynamic='force-dynamic';

export async function generateMetadata({params}){
  const {slug}=await params;
  const book=await getBookBySlug(slug);
  if(!book) return {title:'Story not found'};
  const image=book.coverImage?`/api/media/book/${book.id}`:undefined;
  const description=book.description || book.teaser || `Read ${book.title} on Ghost Stories Society.`;
  return {
    title:book.title,
    description,
    alternates:{canonical:`/books/${book.slug}`},
    openGraph:{title:book.title,description,type:'article',url:`/books/${book.slug}`,images:image?[{url:image,alt:`${book.title} cover`}]:undefined},
    twitter:{card:image?'summary_large_image':'summary',title:book.title,description,images:image?[image]:undefined}
  };
}

export default async function BookPage({ params }) {
  const { slug } = await params;
  const book = await getBookBySlug(slug);
  if (!book) notFound();
  return <main>
    <header className="site-header"><div className="shell site-header-inner"><Link className="wordmark ghost-wordmark" href="/">GHOST STORIES SOCIETY</Link><nav className="nav"><Link href="/#stories">Stories</Link><Link href="/#about">Doctor</Link></nav></div></header>
    <section className="book-hero shell">{book.coverImage?<div style={{display:'grid',gridTemplateColumns:'minmax(150px,220px) 1fr',gap:34,alignItems:'center'}}><img src={book.coverImage} alt={`${book.title} cover`} style={{width:'100%',aspectRatio:'2 / 3',objectFit:'cover',borderRadius:4}}/><div><div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'STORY')}</div><h1>{book.title}</h1><p>{book.description}</p><div className="muted" style={{marginTop:14}}>by Doctor</div>{book.status==='Coming Soon'?<div className="notice" style={{marginTop:24}}><strong>Coming Soon</strong><br/>{book.teaser || 'This story is still being prepared. The first chapter will appear when the door opens.'}</div>:null}</div></div>:<><div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'STORY')}</div><h1>{book.title}</h1><p>{book.description}</p><div className="muted" style={{marginTop:14}}>by Doctor</div>{book.status==='Coming Soon'?<div className="notice" style={{marginTop:24}}><strong>Coming Soon</strong><br/>{book.teaser || 'This story is still being prepared. The first chapter will appear when the door opens.'}</div>:null}</>}
    </section>
    <section className="shell chapter-list">{book.chapters.length ? book.chapters.map((chapter,index)=> chapter.status==='Coming Soon' ? <div className="chapter-row" key={chapter.slug} style={{cursor:'default'}}><div className="chapter-index">{String(index+1).padStart(2,'0')}</div><div><div className="chapter-title">{chapter.title}</div><div className="muted">{chapter.type}{chapter.excerpt?` · ${chapter.excerpt}`:''}</div></div><div className="chapter-meta">Coming Soon</div></div> : <Link className="chapter-row" href={`/books/${book.slug}/${chapter.slug}`} key={chapter.slug}><div className="chapter-index">{String(index+1).padStart(2,'0')}</div><div><div className="chapter-title">{chapter.title}</div><div className="muted">{chapter.type}</div></div><div className="chapter-meta">Read · {chapter.read}</div></Link>) : <p className="muted">No chapter has surfaced yet.</p>}</section>
  </main>;
}
