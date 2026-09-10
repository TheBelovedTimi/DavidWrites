'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const EMPTY_BOOK={title:'',slug:'',description:'',label:'',accent:'violet',status:'Draft',teaser:''};
const EMPTY_CHAPTER={title:'',slug:'',type:'Chapter',excerpt:'',status:'Draft',blocks:[{type:'paragraph',text:''}]};
const BLOCK_TYPES=['paragraph','heading_1','heading_2','heading_3','quote','bulleted_list_item','numbered_list_item','divider'];

function StatusPill({status}){
  return <span style={{fontSize:12,padding:'5px 9px',border:'1px solid rgba(255,255,255,.16)',borderRadius:999}}>{status}</span>;
}

function BlockEditor({blocks,onChange}){
  function update(i,patch){ const next=[...blocks]; next[i]={...next[i],...patch}; onChange(next); }
  function move(i,dir){ const j=i+dir; if(j<0||j>=blocks.length)return; const next=[...blocks]; [next[i],next[j]]=[next[j],next[i]]; onChange(next); }
  function remove(i){ onChange(blocks.filter((_,x)=>x!==i)); }
  function add(type='paragraph'){ onChange([...blocks,{type,text:''}]); }
  return <div style={{display:'grid',gap:12}}>
    {blocks.map((block,i)=><div key={i} className="admin-card" style={{padding:14,background:'rgba(255,255,255,.025)'}}>
      <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
        <select value={block.type} onChange={e=>update(i,{type:e.target.value})}>{BLOCK_TYPES.map(t=><option key={t} value={t}>{t.replaceAll('_',' ')}</option>)}</select>
        <button className="button" type="button" onClick={()=>move(i,-1)}>↑</button>
        <button className="button" type="button" onClick={()=>move(i,1)}>↓</button>
        <button className="button" type="button" onClick={()=>remove(i)}>Remove</button>
      </div>
      {block.type==='divider' ? <div className="ornament">···</div> : <textarea rows={block.type==='paragraph'?5:3} value={block.text || ''} onChange={e=>update(i,{text:e.target.value})} placeholder="Start writing…" style={{width:'100%',resize:'vertical'}} />}
    </div>)}
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{BLOCK_TYPES.map(type=><button key={type} className="button" type="button" onClick={()=>add(type)}>+ {type.replaceAll('_',' ')}</button>)}</div>
  </div>;
}

function ChapterEditor({book,chapter,onBack,onSaved,api}){
  const [form,setForm]=useState(chapter ? {...chapter,blocks:chapter.blocks || []} : {...EMPTY_CHAPTER,bookId:book.id});
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function save(){ setBusy(true); setError(''); try{ await api('saveChapter',{chapter:{...form,bookId:book.id}}); await onSaved(); }catch(e){setError(e.message)}finally{setBusy(false)} }
  return <section className="admin-card">
    <button className="button" onClick={onBack}>← Back to {book.title}</button>
    <div style={{marginTop:24,display:'grid',gap:18}}>
      <div><div className="eyebrow">Chapter editor</div><h2>{chapter?'Edit chapter':'New chapter'}</h2></div>
      <div className="admin-grid">
        <div className="field"><label>Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="field"><label>Slug</label><input value={form.slug || ''} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="auto-generated if empty"/></div>
        <div className="field"><label>Type / label</label><input value={form.type || ''} onChange={e=>setForm({...form,type:e.target.value})} placeholder="Episode One"/></div>
        <div className="field"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Draft</option><option>Coming Soon</option><option>Published</option></select></div>
      </div>
      <div className="field"><label>Teaser / excerpt</label><textarea rows="3" value={form.excerpt || ''} onChange={e=>setForm({...form,excerpt:e.target.value})} placeholder="Shown when this chapter is Coming Soon."/></div>
      <div><div className="eyebrow" style={{marginBottom:10}}>Notion-style writing blocks</div><BlockEditor blocks={form.blocks || []} onChange={blocks=>setForm({...form,blocks})}/></div>
      {error?<p className="error">{error}</p>:null}
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="button primary" onClick={save} disabled={busy}>{busy?'Saving…':'Save chapter'}</button>{chapter?.status==='Published'?<Link className="button" href={`/books/${book.slug}/${chapter.slug}`} target="_blank">Preview live</Link>:null}</div>
    </div>
  </section>;
}

function BookEditor({book,onBack,onSaved,api}){
  const [form,setForm]=useState(book || EMPTY_BOOK); const [selectedChapter,setSelectedChapter]=useState(null); const [newChapter,setNewChapter]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function save(){setBusy(true);setError('');try{await api('saveBook',{book:form});await onSaved();}catch(e){setError(e.message)}finally{setBusy(false)}}
  if(selectedChapter||newChapter) return <ChapterEditor book={form} chapter={selectedChapter} onBack={()=>{setSelectedChapter(null);setNewChapter(false)}} onSaved={async()=>{await onSaved();setSelectedChapter(null);setNewChapter(false)}} api={api}/>;
  return <section className="admin-card">
    <button className="button" onClick={onBack}>← Books</button>
    <div style={{marginTop:24,display:'grid',gap:18}}>
      <div><div className="eyebrow">Book editor</div><h2>{book?'Edit book':'Create new book'}</h2></div>
      <div className="admin-grid">
        <div className="field"><label>Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="field"><label>Slug</label><input value={form.slug || ''} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="auto-generated if empty"/></div>
        <div className="field"><label>Library label</label><input value={form.label || ''} onChange={e=>setForm({...form,label:e.target.value})} placeholder="FICTION · HORROR / MYSTERY"/></div>
        <div className="field"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Draft</option><option>Coming Soon</option><option>Published</option></select></div>
        <div className="field"><label>Visual accent</label><select value={form.accent || 'violet'} onChange={e=>setForm({...form,accent:e.target.value})}><option>violet</option><option>cyan</option><option>amber</option></select></div>
      </div>
      <div className="field"><label>Description</label><textarea rows="4" value={form.description || ''} onChange={e=>setForm({...form,description:e.target.value})}/></div>
      <div className="field"><label>Coming Soon teaser</label><textarea rows="3" value={form.teaser || ''} onChange={e=>setForm({...form,teaser:e.target.value})} placeholder="Optional message shown publicly before publication."/></div>
      {error?<p className="error">{error}</p>:null}
      <button className="button primary" onClick={save} disabled={busy}>{busy?'Saving…':'Save book'}</button>
      {book?.id ? <div style={{marginTop:18}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:12}}><h3>Chapters</h3><button className="button primary" onClick={()=>setNewChapter(true)}>+ New chapter</button></div>
        {(book.chapters||[]).map(ch=><div className="status-row" key={ch.id || ch.slug}><div><strong>{ch.title}</strong><div className="muted">{ch.type} · {ch.read}</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><StatusPill status={ch.status}/><button className="button" onClick={()=>setSelectedChapter(ch)}>Edit</button></div></div>)}
        {!(book.chapters||[]).length?<p className="muted">No chapters yet.</p>:null}
      </div>:<p className="muted">Save the book first, then you can add chapters.</p>}
    </div>
  </section>;
}

export default function AdminClient({initialBooks,databaseReady,logoutAction}){
  const [books,setBooks]=useState(initialBooks); const [editing,setEditing]=useState(null); const [creating,setCreating]=useState(false); const [error,setError]=useState('');
  const stats=useMemo(()=>({books:books.length,chapters:books.reduce((n,b)=>n+(b.chapters?.length||0),0),published:books.reduce((n,b)=>n+(b.chapters||[]).filter(c=>c.status==='Published').length,0),coming:books.reduce((n,b)=>n+(b.status==='Coming Soon'?1:0)+(b.chapters||[]).filter(c=>c.status==='Coming Soon').length,0)}),[books]);
  async function api(action,payload={}){const r=await fetch('/api/cms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'CMS request failed');return d;}
  async function refresh(){const r=await fetch('/api/cms',{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Could not refresh');setBooks(d.books);if(editing?.id){const fresh=d.books.find(b=>b.id===editing.id);if(fresh)setEditing(fresh);}return d.books;}
  async function saved(){try{const next=await refresh();if(creating){setCreating(false);setEditing(next[next.length-1]||null);}}catch(e){setError(e.message)}}
  if(editing||creating) return <div className="admin-page"><div className="admin-shell"><BookEditor book={editing} onBack={()=>{setEditing(null);setCreating(false)}} onSaved={saved} api={api}/></div></div>;
  return <div className="admin-page"><div className="admin-shell">
    <div className="admin-top"><div><div className="wordmark">DAVID//WRITES</div><div className="muted">Books, chapters and publishing</div></div><div style={{display:'flex',gap:10}}><Link className="button" href="/">View website</Link><form action={logoutAction}><button className="button">Sign out</button></form></div></div>
    {!databaseReady?<div className="admin-card" style={{marginBottom:22}}><h2>Connect storage to enable editing</h2><p className="muted">The CMS is installed, but persistent storage is not connected yet. Add a Neon Postgres database to this Vercel project so it provides <code>DATABASE_URL</code>. Your current public content remains unchanged until then.</p></div>:null}
    <div className="admin-grid"><section className="admin-card"><h2>Publishing dashboard</h2><div className="status-row"><span>Books</span><strong>{stats.books}</strong></div><div className="status-row"><span>Chapters</span><strong>{stats.chapters}</strong></div><div className="status-row"><span>Published chapters</span><strong>{stats.published}</strong></div><div className="status-row"><span>Coming soon</span><strong>{stats.coming}</strong></div></section>
      <section className="admin-card"><h2>Publishing rules</h2><p className="muted"><strong>Draft</strong> stays private. <strong>Coming Soon</strong> appears publicly with its teaser but hides chapter content. <strong>Published</strong> is fully readable.</p><button className="button primary" disabled={!databaseReady} onClick={()=>setCreating(true)}>+ New book</button></section></div>
    <section className="admin-card" style={{marginTop:22}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><h2>Your books</h2><button className="button primary" disabled={!databaseReady} onClick={()=>setCreating(true)}>+ New book</button></div>{books.map(book=><div className="status-row" key={book.id || book.slug}><div><strong>{book.title}</strong><div className="muted">{book.chapters?.length||0} chapters · {book.slug}</div></div><div style={{display:'flex',gap:8,alignItems:'center'}}><StatusPill status={book.status}/><button className="button" disabled={!databaseReady} onClick={()=>setEditing(book)}>Edit</button></div></div>)}</section>
    {error?<p className="error">{error}</p>:null}
    <section className="admin-card" style={{marginTop:22}}><h2>Optional Notion import</h2><p className="muted">Notion is no longer the source of truth. The existing sync endpoint remains available for importing old material when needed; all ongoing editing and publishing happens here.</p></section>
  </div></div>;
}
