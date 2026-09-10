import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getChapter } from '../../../data';
import ReaderProgress from '../../../components/ReaderProgress';

function Block({ block }) {
  if (!block) return null;
  if (block.type === 'divider') return <div className="ornament">···</div>;
  if (block.type === 'heading_1') return <h1>{block.text}</h1>;
  if (block.type === 'heading_2') return <h2>{block.text}</h2>;
  if (block.type === 'heading_3') return <h3>{block.text}</h3>;
  if (block.type === 'quote') return <blockquote>{block.text}</blockquote>;
  if (block.type === 'bulleted_list_item') return <ul><li>{block.text}</li></ul>;
  if (block.type === 'numbered_list_item') return <ol><li>{block.text}</li></ol>;
  if (block.type === 'toggle') return <details className="toggle"><summary>{block.text || 'Open'}</summary>{block.children?.map((child, i) => <Block key={i} block={child} />)}</details>;
  if (block.type === 'image' && block.url) return <figure className="notion-image"><img src={block.url} alt={block.caption || ''} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
  return <p>{block.text}</p>;
}

function Nav({ book, index, bottom = false }) {
  const prev = index > 0 ? book.chapters[index - 1] : null;
  const next = index < book.chapters.length - 1 ? book.chapters[index + 1] : null;
  return <div className={`reader-nav ${bottom ? 'bottom' : ''}`}>
    <span>{prev ? <Link href={`/books/${book.slug}/${prev.slug}`}>← {prev.title}</Link> : <Link href={`/books/${book.slug}`}>← Book</Link>}</span>
    <span>{next ? <Link href={`/books/${book.slug}/${next.slug}`}>{next.title} →</Link> : <Link href={`/books/${book.slug}`}>Book →</Link>}</span>
  </div>;
}

export default async function ChapterPage({ params }) {
  const { slug, chapter: chapterSlug } = await params;
  const { book, chapter } = getChapter(slug, chapterSlug);
  if (!book || !chapter) notFound();
  const index = book.chapters.findIndex((item) => item.slug === chapter.slug);
  return <main>
    <header className="reader-header">
      <div className="shell reader-head-inner">
        <Link aria-label="Home" href="/">⌂</Link>
        <Link className="reader-book" href={`/books/${book.slug}`}>{book.title}</Link>
        <span aria-hidden="true">✦</span>
        <ReaderProgress />
      </div>
    </header>
    <article className="reader-wrap">
      <Nav book={book} index={index} />
      <h1 className="reader-title">{chapter.title}</h1>
      <div className="reader-meta">{book.title} · {chapter.type} · {chapter.read}</div>
      <div className="prose">{chapter.blocks.map((block, i) => <Block key={i} block={block} />)}</div>
      <Nav book={book} index={index} bottom />
    </article>
  </main>;
}
