import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChapterBySlug } from '../../../lib/db';
import ReaderProgress from '../../../components/ReaderProgress';
import ReaderTools from '../../../components/ReaderTools';

export const dynamic='force-dynamic';

export async function generateMetadata({params}){
  const {slug,chapter:chapterSlug}=await params;
  const {book,chapter}=await getChapterBySlug(slug,chapterSlug);
  if(!book||!chapter||chapter.status!=='Published') return {title:'Chapter not found'};
  const image=chapter.dividerImage?`/api/media/chapter/${chapter.id}`:(book.coverImage?`/api/media/book/${book.id}`:undefined);
  const description=chapter.excerpt || `Read ${chapter.title} from ${book.title} on David Writes.`;
  return {
    title:`${chapter.title} — ${book.title}`,
    description,
    alternates:{canonical:`/books/${book.slug}/${chapter.slug}`},
    openGraph:{title:chapter.title,description,type:'article',url:`/books/${book.slug}/${chapter.slug}`,images:image?[{url:image,alt:chapter.dividerImage?`${chapter.title} divider`:`${book.title} cover`}]:undefined},
    twitter:{card:image?'summary_large_image':'summary',title:chapter.title,description,images:image?[image]:undefined}
  };
}

function RichContent({block}){ if(block.html) return <span dangerouslySetInnerHTML={{__html:block.html}}/>; return <span>{block.text}</span>; }
function Block({ block }) {
  if (!block) return null; const style={textAlign:block.align || 'left'};
  if (block.type === 'divider') return <div className="ornament">···</div>;
  if (block.type === 'heading_1') return <h1 style={style}><RichContent block={block}/></h1>;
  if (block.type === 'heading_2') return <h2 style={style}><RichContent block={block}/></h2>;
  if (block.type === 'heading_3') return <h3 style={style}><RichContent block={block}/></h3>;
  if (block.type === 'quote') return <blockquote style={style}><RichContent block={block}/></blockquote>;
  if (block.type === 'bulleted_list_item') return <ul style={style}><li><RichContent block={block}/></li></ul>;
  if (block.type === 'numbered_list_item') return <ol style={style}><li><RichContent block={block}/></li></ol>;
  if (block.type === 'toggle') return <details className="toggle"><summary>{block.text || 'Open'}</summary>{block.children?.map((child, i) => <Block key={i} block={child} />)}</details>;
  if (block.type === 'image' && block.url) return <figure className="notion-image"><img src={block.url} alt={block.caption || ''} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
  return <p style={style}><RichContent block={block}/></p>;
}

function Nav({ book, index, bottom = false }) {
  const readable=book.chapters.filter(c=>c.status==='Published'); const prev=index>0?readable[index-1]:null; const next=index<readable.length-1?readable[index+1]:null;
  return <div className={`reader-nav ${bottom?'bottom':''}`}>
    <div>{prev?<Link href={`/books/${book.slug}/${prev.slug}`}><small>Previous · {prev.type}</small>← {prev.title}</Link>:<Link href={`/books/${book.slug}`}><small>Back to</small>← {book.title}</Link>}</div>
    <div className="next">{next?<Link href={`/books/${book.slug}/${next.slug}`}><small>Next · {next.type}</small>{next.title} →</Link>:<Link href={`/books/${book.slug}`}><small>End of chapter</small>{book.title} →</Link>}</div>
  </div>;
}

export default async function ChapterPage({ params }) {
  const { slug, chapter: chapterSlug } = await params; const { book, chapter } = await getChapterBySlug(slug, chapterSlug);
  if (!book || !chapter || chapter.status !== 'Published') notFound();
  const readable=book.chapters.filter(c=>c.status==='Published'); const index=readable.findIndex(item=>item.slug===chapter.slug);
  return <main>
    <header className="reader-header"><div className="shell reader-head-inner"><Link aria-label="Home" href="/">⌂</Link><Link className="reader-book" href={`/books/${book.slug}`}>{book.title}</Link><span aria-hidden="true">✦</span><ReaderProgress /></div></header>
    <article className="reader-wrap"><Nav book={book} index={index}/><h1 className="reader-title">{chapter.title}</h1><div className="reader-meta">{book.title} · {chapter.type} · {chapter.read}</div><ReaderTools chapterId={chapter.id} readMinutes={chapter.readMinutes} title={`${chapter.title} — ${book.title}`} bookTitle={book.title} chapterTitle={chapter.title} bookSlug={book.slug} chapterSlug={chapter.slug}/>{chapter.dividerImage?<figure style={{margin:'26px 0 34px'}}><img src={chapter.dividerImage} alt={`${chapter.title} divider`} style={{width:'100%',maxHeight:420,objectFit:'cover',borderRadius:12,display:'block'}}/></figure>:<div className="ornament">···</div>}<div className="prose">{chapter.blocks.map((block,i)=><Block key={i} block={block}/>)}</div><Nav book={book} index={index} bottom/></article>
  </main>;
}
