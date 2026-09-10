'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const SOURCE_KEY = 'david-writes-notion-source-v1';

function PreviewBlock({ block }) {
  if (!block) return null;
  if (block.type === 'divider') return <div className="ornament">···</div>;
  if (block.type === 'heading_1') return <h1>{block.text}</h1>;
  if (block.type === 'heading_2') return <h2>{block.text}</h2>;
  if (block.type === 'heading_3') return <h3>{block.text}</h3>;
  if (block.type === 'quote') return <blockquote>{block.text}</blockquote>;
  if (block.type === 'bulleted_list_item') return <ul><li>{block.text}</li></ul>;
  if (block.type === 'numbered_list_item') return <ol><li>{block.text}</li></ol>;
  if (block.type === 'toggle') return <details className="toggle"><summary>{block.text || 'Open'}</summary>{block.children?.map((child, index) => <PreviewBlock key={child.id || index} block={child} />)}</details>;
  if (block.type === 'image' && block.url) return <figure className="notion-image"><img src={block.url} alt={block.caption || ''} />{block.caption ? <figcaption>{block.caption}</figcaption> : null}</figure>;
  if (!block.text) return null;
  return <p>{block.text}</p>;
}

function PagePreview({ page }) {
  return <div className="preview">
    <h3>{page.title}</h3>
    <div className="muted">Synced from Notion</div>
    <div className="preview-blocks">{page.blocks?.map((block, index) => <PreviewBlock key={block.id || index} block={block} />)}</div>
  </div>;
}

export default function AdminClient({ books, logoutAction }) {
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sync, setSync] = useState(null);

  useEffect(() => {
    setSource(localStorage.getItem(SOURCE_KEY) || '');
  }, []);

  const stats = useMemo(() => ({
    books: books.length,
    chapters: books.reduce((sum, book) => sum + book.chapters.length, 0),
    published: books.reduce((sum, book) => sum + book.chapters.filter((chapter) => chapter.status === 'Published').length, 0)
  }), [books]);

  function saveSource() {
    if (!source.trim()) {
      setError('Paste a Notion page/database URL or ID first.');
      return;
    }
    localStorage.setItem(SOURCE_KEY, source.trim());
    setError('');
    setMessage('Notion source saved in this browser.');
  }

  async function syncNotion() {
    setLoading(true);
    setError('');
    setMessage('');
    setSync(null);
    try {
      const response = await fetch('/api/notion/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: source.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `Sync failed (${response.status})`);
      setSync(data);
      localStorage.setItem(SOURCE_KEY, source.trim());
      setMessage(data.kind === 'database' ? `Synced ${data.database.pages.length} Notion pages.` : 'Notion page synced successfully.');
    } catch (err) {
      setError(err.message || 'Notion sync failed.');
    } finally {
      setLoading(false);
    }
  }

  return <div className="admin-page">
    <div className="admin-shell">
      <div className="admin-top">
        <div><div className="wordmark">DAVID//WRITES</div><div className="muted">Private publishing dashboard</div></div>
        <div style={{display:'flex',gap:10}}><Link className="button" href="/">View website</Link><form action={logoutAction}><button className="button" type="submit">Sign out</button></form></div>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Publishing dashboard</h2>
          <div className="status-row"><span>Books</span><strong>{stats.books}</strong></div>
          <div className="status-row"><span>Chapters</span><strong>{stats.chapters}</strong></div>
          <div className="status-row"><span>Published</span><strong>{stats.published}</strong></div>
          <div style={{marginTop:22}}>
            {books.map((book) => <div className="status-row" key={book.slug}>
              <div><strong>{book.title}</strong><div className="muted">{book.status}</div></div>
              <div className="muted">{book.chapters.length} ch.</div>
            </div>)}
          </div>
        </section>

        <section className="admin-card">
          <h2>Notion source</h2>
          <p className="muted">Paste a Notion page URL, database URL, or ID. Your API secret stays in Vercel as <code>API_KEY</code>.</p>
          <div className="field"><label>Page / database URL or ID</label><input value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://www.notion.so/..." /></div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button className="button" type="button" onClick={saveSource}>Save source</button>
            <button className="button primary" type="button" onClick={syncNotion} disabled={loading}>{loading ? 'Syncing…' : 'Sync Notion'}</button>
          </div>
          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
          <div className="notice" style={{marginTop:18}}>Sync now returns data directly from the API. It does not use a Next.js redirect, so the previous <code>NEXT_REDIRECT</code> failure path has been removed.</div>
        </section>
      </div>

      {sync?.kind === 'page' ? <section className="admin-card" style={{marginTop:22}}><h2>Notion preview</h2><PagePreview page={sync.page} /></section> : null}
      {sync?.kind === 'database' ? <section className="admin-card" style={{marginTop:22}}><h2>Notion preview</h2>{sync.database.pages.map((page) => <PagePreview key={page.id} page={page} />)}</section> : null}
    </div>
  </div>;
}
