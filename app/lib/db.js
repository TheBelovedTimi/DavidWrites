import { neon } from '@neondatabase/serverless';
import { books as seedBooks } from '../data';

let bootstrapped = false;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function sql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  return neon(process.env.DATABASE_URL);
}

function slugify(value='') {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || `untitled-${Date.now()}`;
}

async function ensureSchema() {
  if (bootstrapped || !hasDatabase()) return;
  const q = sql();
  await q`CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    accent TEXT NOT NULL DEFAULT 'violet',
    status TEXT NOT NULL DEFAULT 'Draft',
    teaser TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await q`CREATE TABLE IF NOT EXISTS chapters (
    id BIGSERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Chapter',
    excerpt TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Draft',
    read_minutes INTEGER NOT NULL DEFAULT 1,
    content JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(book_id, slug)
  )`;
  const rows = await q`SELECT COUNT(*)::int AS count FROM books`;
  if ((rows[0]?.count || 0) === 0) {
    for (let b=0; b<seedBooks.length; b++) {
      const book = seedBooks[b];
      const inserted = await q`INSERT INTO books (title,slug,description,label,accent,status,sort_order)
        VALUES (${book.title},${book.slug},${book.description || ''},${book.label || ''},${book.accent || 'violet'},${book.status === 'Ongoing' ? 'Published' : book.status === 'In Development' ? 'Coming Soon' : book.status || 'Draft'},${b}) RETURNING id`;
      const bookId = inserted[0].id;
      for (let c=0; c<(book.chapters || []).length; c++) {
        const ch = book.chapters[c];
        await q`INSERT INTO chapters (book_id,title,slug,type,status,read_minutes,content,sort_order)
          VALUES (${bookId},${ch.title},${ch.slug},${ch.type || 'Chapter'},${ch.status || 'Draft'},${parseInt(ch.read) || 1},${JSON.stringify(ch.blocks || [])}::jsonb,${c})`;
      }
    }
  }
  bootstrapped = true;
}

export async function listBooks({ admin=false }={}) {
  if (!hasDatabase()) return seedBooks;
  await ensureSchema();
  const q = sql();
  const books = admin
    ? await q`SELECT * FROM books ORDER BY sort_order,id`
    : await q`SELECT * FROM books WHERE status IN ('Published','Coming Soon') ORDER BY sort_order,id`;
  const result = [];
  for (const book of books) {
    const chapters = admin
      ? await q`SELECT * FROM chapters WHERE book_id=${book.id} ORDER BY sort_order,id`
      : await q`SELECT * FROM chapters WHERE book_id=${book.id} AND status IN ('Published','Coming Soon') ORDER BY sort_order,id`;
    result.push(normalizeBook(book, chapters));
  }
  return result;
}

export async function getBookBySlug(slug,{admin=false}={}) {
  if (!hasDatabase()) return seedBooks.find(b=>b.slug===slug) || null;
  await ensureSchema();
  const q=sql();
  const rows = admin
    ? await q`SELECT * FROM books WHERE slug=${slug} LIMIT 1`
    : await q`SELECT * FROM books WHERE slug=${slug} AND status IN ('Published','Coming Soon') LIMIT 1`;
  if (!rows[0]) return null;
  const chapters = admin
    ? await q`SELECT * FROM chapters WHERE book_id=${rows[0].id} ORDER BY sort_order,id`
    : await q`SELECT * FROM chapters WHERE book_id=${rows[0].id} AND status IN ('Published','Coming Soon') ORDER BY sort_order,id`;
  return normalizeBook(rows[0], chapters);
}

export async function getChapterBySlug(bookSlug, chapterSlug,{admin=false}={}) {
  const book=await getBookBySlug(bookSlug,{admin});
  if (!book) return {book:null,chapter:null};
  const chapter=(book.chapters || []).find(c=>c.slug===chapterSlug) || null;
  return {book,chapter};
}

function normalizeBook(book, chapters=[]) {
  return {
    id:book.id,
    title:book.title,
    slug:book.slug,
    description:book.description || '',
    label:book.label || '',
    accent:book.accent || 'violet',
    status:book.status,
    teaser:book.teaser || '',
    chapters:chapters.map(c=>({
      id:c.id,
      title:c.title,
      slug:c.slug,
      type:c.type || 'Chapter',
      excerpt:c.excerpt || '',
      status:c.status,
      read:`${c.read_minutes || 1} min read`,
      readMinutes:c.read_minutes || 1,
      blocks:Array.isArray(c.content) ? c.content : []
    }))
  };
}

export async function saveBook(input) {
  await ensureSchema(); const q=sql();
  const status=['Draft','Coming Soon','Published'].includes(input.status) ? input.status : 'Draft';
  if (input.id) {
    const rows=await q`UPDATE books SET title=${input.title},slug=${slugify(input.slug || input.title)},description=${input.description || ''},label=${input.label || ''},accent=${input.accent || 'violet'},status=${status},teaser=${input.teaser || ''},updated_at=NOW() WHERE id=${input.id} RETURNING id,slug`;
    return rows[0];
  }
  const max=await q`SELECT COALESCE(MAX(sort_order),-1)+1 AS n FROM books`;
  const rows=await q`INSERT INTO books(title,slug,description,label,accent,status,teaser,sort_order) VALUES(${input.title},${slugify(input.slug || input.title)},${input.description || ''},${input.label || ''},${input.accent || 'violet'},${status},${input.teaser || ''},${max[0].n}) RETURNING id,slug`;
  return rows[0];
}

export async function saveChapter(input) {
  await ensureSchema(); const q=sql();
  const status=['Draft','Coming Soon','Published'].includes(input.status) ? input.status : 'Draft';
  const blocks=Array.isArray(input.blocks) ? input.blocks : [];
  const wordCount=blocks.reduce((n,b)=>n+String(b.text || '').trim().split(/\s+/).filter(Boolean).length,0);
  const readMinutes=Math.max(1,Math.ceil(wordCount/220));
  if (input.id) {
    const rows=await q`UPDATE chapters SET title=${input.title},slug=${slugify(input.slug || input.title)},type=${input.type || 'Chapter'},excerpt=${input.excerpt || ''},status=${status},content=${JSON.stringify(blocks)}::jsonb,read_minutes=${readMinutes},updated_at=NOW() WHERE id=${input.id} RETURNING id,slug`;
    return rows[0];
  }
  const max=await q`SELECT COALESCE(MAX(sort_order),-1)+1 AS n FROM chapters WHERE book_id=${input.bookId}`;
  const rows=await q`INSERT INTO chapters(book_id,title,slug,type,excerpt,status,content,read_minutes,sort_order) VALUES(${input.bookId},${input.title},${slugify(input.slug || input.title)},${input.type || 'Chapter'},${input.excerpt || ''},${status},${JSON.stringify(blocks)}::jsonb,${readMinutes},${max[0].n}) RETURNING id,slug`;
  return rows[0];
}

export async function deleteBook(id){ await ensureSchema(); return sql()`DELETE FROM books WHERE id=${id}`; }
export async function deleteChapter(id){ await ensureSchema(); return sql()`DELETE FROM chapters WHERE id=${id}`; }
