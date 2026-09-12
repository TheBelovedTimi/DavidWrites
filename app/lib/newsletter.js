import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';

function sql() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  return neon(process.env.DATABASE_URL);
}

async function ensureSubscribers() {
  const q = sql();
  await q`CREATE TABLE IF NOT EXISTS subscribers (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    unsubscribe_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

export function newsletterConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.NEWSLETTER_FROM_EMAIL);
}

export async function subscribeEmail(rawEmail) {
  await ensureSubscribers();
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  const token = randomUUID();
  const q = sql();
  await q`INSERT INTO subscribers (email,active,unsubscribe_token)
    VALUES (${email},TRUE,${token})
    ON CONFLICT (email) DO UPDATE SET active=TRUE,unsubscribe_token=${token},updated_at=NOW()`;
  return { email };
}

export async function unsubscribeByToken(token) {
  if (!token) return false;
  await ensureSubscribers();
  const q = sql();
  const rows = await q`UPDATE subscribers SET active=FALSE,updated_at=NOW() WHERE unsubscribe_token=${token} RETURNING id`;
  return Boolean(rows[0]);
}

export async function getPublicationStatus(kind, id) {
  if (!id) return null;
  const q = sql();
  if (kind === 'book') {
    const rows = await q`SELECT status FROM books WHERE id=${id} AND deleted_at IS NULL LIMIT 1`;
    return rows[0]?.status || null;
  }
  if (kind === 'chapter') {
    const rows = await q`SELECT status FROM chapters WHERE id=${id} AND deleted_at IS NULL LIMIT 1`;
    return rows[0]?.status || null;
  }
  return null;
}

async function publicationDetails(kind, id) {
  const q = sql();
  if (kind === 'book') {
    const rows = await q`SELECT id,title,slug,description FROM books WHERE id=${id} AND deleted_at IS NULL LIMIT 1`;
    const row = rows[0];
    if (!row) return null;
    return { kind:'book', title:row.title, description:row.description || '', url:`/books/${row.slug}` };
  }
  if (kind === 'chapter') {
    const rows = await q`SELECT c.id,c.title,c.slug,c.excerpt,b.title AS book_title,b.slug AS book_slug
      FROM chapters c JOIN books b ON b.id=c.book_id
      WHERE c.id=${id} AND c.deleted_at IS NULL AND b.deleted_at IS NULL LIMIT 1`;
    const row = rows[0];
    if (!row) return null;
    return { kind:'chapter', title:row.title, bookTitle:row.book_title, description:row.excerpt || '', url:`/books/${row.book_slug}/${row.slug}` };
  }
  return null;
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

async function sendOne(subscriber, publication) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://david-writes.vercel.app').replace(/\/$/,'');
  const readUrl = `${base}${publication.url}`;
  const unsubscribeUrl = `${base}/api/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`;
  const isChapter = publication.kind === 'chapter';
  const subject = isChapter ? `New chapter: ${publication.title}` : `New book published: ${publication.title}`;
  const heading = isChapter ? `${publication.title} is now live` : `${publication.title} has been published`;
  const context = isChapter && publication.bookTitle ? `<p style="margin:0 0 18px;color:#8e859b">From <strong>${escapeHtml(publication.bookTitle)}</strong></p>` : '';
  const description = publication.description ? `<p style="font-size:16px;line-height:1.7;color:#d8d2df">${escapeHtml(publication.description)}</p>` : '';
  const html = `<!doctype html><html><body style="margin:0;background:#0b0910;color:#f4eff7;font-family:Arial,sans-serif"><div style="max-width:620px;margin:auto;padding:42px 24px"><div style="font-size:12px;letter-spacing:.18em;color:#a58eb9;margin-bottom:28px">DAVID//WRITES</div><h1 style="font-family:Georgia,serif;font-size:34px;line-height:1.15;margin:0 0 12px">${escapeHtml(heading)}</h1>${context}${description}<p style="margin:30px 0"><a href="${readUrl}" style="display:inline-block;padding:13px 20px;background:#7d55a5;color:white;text-decoration:none;border-radius:999px">Read now</a></p><hr style="border:0;border-top:1px solid #292330;margin:38px 0 22px"><p style="font-size:12px;line-height:1.6;color:#817789">You received this because you subscribed to David Writes publication updates. <a href="${unsubscribeUrl}" style="color:#b99ad0">Unsubscribe</a>.</p></div></body></html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method:'POST',
    headers:{'Authorization':`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({from:process.env.NEWSLETTER_FROM_EMAIL,to:[subscriber.email],subject,html})
  });
  if (!response.ok) throw new Error(`Email delivery failed (${response.status}).`);
}

export async function notifySubscribers(kind, id) {
  if (!newsletterConfigured()) return { sent:0, skipped:true };
  await ensureSubscribers();
  const publication = await publicationDetails(kind,id);
  if (!publication) return { sent:0, skipped:true };
  const q = sql();
  const subscribers = await q`SELECT email,unsubscribe_token FROM subscribers WHERE active=TRUE ORDER BY id`;
  let sent = 0;
  for (let i=0;i<subscribers.length;i+=20) {
    const batch = subscribers.slice(i,i+20);
    const results = await Promise.allSettled(batch.map(s=>sendOne(s,publication)));
    sent += results.filter(r=>r.status==='fulfilled').length;
  }
  return { sent, total:subscribers.length };
}
