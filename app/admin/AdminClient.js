'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const EMPTY_BOOK={title:'',slug:'',description:'',label:'',accent:'violet',status:'Draft',teaser:''};
const EMPTY_CHAPTER={title:'',slug:'',type:'Chapter',excerpt:'',status:'Draft',blocks:[{type:'paragraph',text:'',html:'',align:'left'}]};
const BLOCK_TYPES=['paragraph','heading_1','heading_2','heading_3','quote','bulleted_list_item','numbered_list_item','divider'];

function StatusPill({status}){
  return <span style={{fontSize:12,padding:'5px 9px',border:'1px solid rgba(255,255,255,.16)',borderRadius:999}}>{status}</span>;
}

function RichBlock({block,index,onUpdate,onMove,onRemove}){
  const editorRef=useRef(null);
  const html=block.html || (block.text ? String(block.text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') : '');
  useEffect(()=>{
    const editor=editorRef.current;
    if(editor && editor.innerHTML!==html) editor.innerHTML=html;
  },[html]);
  const run=(command,value=null)=>{
    const editor=editorRef.current;
    if(!editor)return;
    editor.focus();
    document.execCommand(command,false,value);
    onUpdate(index,{html:editor.innerHTML,text:editor.innerText});
  };
  const align=value=>onUpdate(index,{align:value});
  const toolbarButton=(label,title,action,active=false)=><button type="button" className="button" title={title} aria-label={title} onMouseDown={e=>{e.preventDefault();action();}} style={{padding:'6px 9px',minWidth:34,fontWeight:active?700:500,opacity:active?1:.78}}>{label}</button>;
  return <div style={{borderBottom:'1px solid rgba(255,255,255,.07)',padding:'10px 0 12px'}}>
    <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
      <select value={block.type} onChange={e=>onUpdate(index,{type:e.target.value})} style={{height:34,padding:'4px 8px'}}>{BLOCK_TYPES.map(t=><option key={t} value={t}>{t.replaceAll('_',' ')}</option>)}</select>
      {block.type!=='divider'?<>
        <span style={{width:1,height:22,background:'rgba(255,255,255,.1)',margin:'0 2px'}}/>
        {toolbarButton('B','Bold',()=>run('bold'))}
        {toolbarButton('I','Italic',()=>run('italic'))}
        {toolbarButton('U','Underline',()=>run('underline'))}
        {toolbarButton('S','Strikethrough',()=>run('strikeThrough'))}
        <span style={{width:1,height:22,background:'rgba(255,255,255,.1)',margin:'0 2px'}}/>
        {toolbarButton('L','Align left',()=>align('left'),(block.align||'left')==='left')}
        {toolbarButton('C','Align center',()=>align('center'),block.align==='center')}
        {toolbarButton('R','Align right',()=>align('right'),block.align==='right')}
        {toolbarButton('J','Justify',()=>align('justify'),block.align==='justify')}
      </>:null}
      <span style={{flex:1}}/>
      <button className="button" type="button" onClick={()=>onMove(index,-1)} style={{padding:'6px 9px'}}>↑</button>
      <button className="button" type="button" onClick={()=>onMove(index,1)} style={{padding:'6px 9px'}}>↓</button>
      <button className="button" type="button" onClick={()=>onRemove(index)} style={{padding:'6px 9px'}}>Remove</button>
    </div>
    {block.type==='divider' ? <div className="ornament" style={{margin:'8px 0'}}>···</div> : <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={e=>onUpdate(index,{html:e.currentTarget.innerHTML,text:e.currentTarget.innerText})} dangerouslySetInnerHTML={{__html:html}} data-placeholder="Start writing…" style={{width:'100%',minHeight:block.type==='paragraph'?54:40,padding:'7px 4px',outline:'none',lineHeight:1.65,fontSize:block.type==='heading_1'?30:block.type==='heading_2'?24:block.type==='heading_3'?19:16,fontWeight:block.type.startsWith('heading_')?700:400,fontStyle:block.type==='quote'?'italic':'normal',textAlign:block.align||'left',whiteSpace:'pre-wrap'}} />}
  </div>;
}

function cloneBlocks(blocks){ return JSON.parse(JSON.stringify(blocks || [])); }

function BlockEditor({blocks,onChange}){
  const pastRef=useRef([]);
  const futureRef=useRef([]);
  const [historyVersion,setHistoryVersion]=useState(0);
  const blocksRef=useRef(blocks);
  useEffect(()=>{ blocksRef.current=blocks; },[blocks]);

  function commit(next){
    pastRef.current=[...pastRef.current.slice(-99),cloneBlocks(blocksRef.current)];
    futureRef.current=[];
    blocksRef.current=next;
    onChange(next);
    setHistoryVersion(v=>v+1);
  }
  function update(i,patch){ const next=[...blocksRef.current]; next[i]={...next[i],...patch}; commit(next); }
  function move(i,dir){ const j=i+dir; if(j<0||j>=blocksRef.current.length)return; const next=[...blocksRef.current]; [next[i],next[j]]=[next[j],next[i]]; commit(next); }
  function remove(i){ commit(blocksRef.current.filter((_,x)=>x!==i)); }
  function add(type='paragraph'){ commit([...blocksRef.current,{type,text:'',html:'',align:'left'}]); }
  function undo(){
    const previous=pastRef.current.pop();
    if(!previous)return;
    futureRef.current=[cloneBlocks(blocksRef.current),...futureRef.current].slice(0,100);
    blocksRef.current=previous;
    onChange(previous);
    setHistoryVersion(v=>v+1);
  }
  function redo(){
    const next=futureRef.current.shift();
    if(!next)return;
    pastRef.current=[...pastRef.current.slice(-99),cloneBlocks(blocksRef.current)];
    blocksRef.current=next;
    onChange(next);
    setHistoryVersion(v=>v+1);
  }

  useEffect(()=>{
    const handleKeyDown=e=>{
      const modifier=e.ctrlKey||e.metaKey;
      if(!modifier||e.key.toLowerCase()!=='z')return;
      e.preventDefault();
      if(e.shiftKey) redo(); else undo();
    };
    window.addEventListener('keydown',handleKeyDown);
    return()=>window.removeEventListener('keydown',handleKeyDown);
  });

  const canUndo=pastRef.current.length>0;
  const canRedo=futureRef.current.length>0;
  void historyVersion;
  return <div>
    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8,flexWrap:'wrap'}}>
      <button className="button" type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd + Z)">↶ Undo</button>
      <button className="button" type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl/Cmd + Shift + Z)">↷ Redo</button>
      <span className="muted" style={{fontSize:12}}>Up to 100 recent editing steps</span>
    </div>
    <div style={{border:'1px solid rgba(255,255,255,.10)',borderRadius:14,padding:'4px 14px 14px',background:'rgba(255,255,255,.018)'}}>
      {blocks.map((block,i)=><RichBlock key={i} block={block} index={i} onUpdate={update} onMove={move} onRemove={remove}/>)}
      <div style={{display:'flex',gap:7,flexWrap:'wrap',paddingTop:12}}>{BLOCK_TYPES.map(type=><button key={type} className="button" type="button" onClick={()=>add(type)} style={{padding:'7px 10px'}}>+ {type.replaceAll('_',' ')}</button>)}</div>
    </div>
  </div>;
}

function ChapterEditor({book,chapter,onBack,onSaved,onTrash,api}){
  const [form,setForm]=useState(chapter ? {...chapter,blocks:(chapter.blocks || []).map(b=>({...b,align:b.align||'left'}))} : {...EMPTY_CHAPTER,bookId:book.id});
  const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function save(){ setBusy(true); setError(''); try{ await api('saveChapter',{chapter:{...form,bookId:book.id}}); await onSaved(); }catch(e){setError(e.message)}finally{setBusy(false)} }
  return <section className="admin-card">
    <button className="button" onClick={onBack}>← Back to {book.title}</button>
    <div style={{marginTop:20,display:'grid',gap:14}}>
      <div><div className="eyebrow">Chapter editor</div><h2 style={{marginBottom:4}}>{chapter?'Edit chapter':'New chapter'}</h2><p className="muted" style={{margin:0}}>Select text inside a block, then use the formatting controls above it. Undo/Redo also works with Ctrl/Cmd + Z.</p></div>
      <div className="admin-grid">
        <div className="field"><label>Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
        <div className="field"><label>Slug</label><input value={form.slug || ''} onChange={e=>setForm({...form,slug:e.target.value})} placeholder="auto-generated if empty"/></div>
        <div className="field"><label>Type / label</label><input value={form.type || ''} onChange={e=>setForm({...form,type:e.target.value})} placeholder="Episode One"/></div>
        <div className="field"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Draft</option><option>Coming Soon</option><option>Published</option></select></div>
      </div>
      <div className="field"><label>Teaser / excerpt</label><textarea rows="2" value={form.excerpt || ''} onChange={e=>setForm({...form,excerpt:e.target.value})} placeholder="Shown when this chapter is Coming Soon."/></div>
      <div><div className="eyebrow" style={{marginBottom:8}}>Writing surface</div><BlockEditor blocks={form.blocks || []} onChange={blocks=>setForm({...form,blocks})}/></div>
      {error?<p className="error">{error}</p>:null}
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <button className="button primary" onClick={save} disabled={busy}>{busy?'Saving…':'Save chapter'}</button>
        {chapter?.status==='Published'?<Link className="button" href={`/books/${book.slug}/${chapter.slug}`} target="_blank">Preview live</Link>:null}
        {chapter?.id?<button className="button" style={{marginLeft:'auto'}} onClick={()=>onTrash(chapter)}>Move to Trash</button>:null}
      </div>
    </div>
  </section>;
}

function BookEditor({book,onBack,onSaved,onTrashBook,onTrashChapter,api}){
  const [form,setForm]=useState(book || EMPTY_BOOK); const [selectedChapter,setSelectedChapter]=useState(null); const [newChapter,setNewChapter]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  async function save(){setBusy(true);setError('');try{await api('saveBook',{book:form});await onSaved();}catch(e){setError(e.message)}finally{setBusy(false)}}
  if(selectedChapter||newChapter) return <ChapterEditor book={form} chapter={selectedChapter} onBack={()=>{setSelectedChapter(null);setNewChapter(false)}} onSaved={async()=>{await onSaved();setSelectedChapter(null);setNewChapter(false)}} onTrash={async(ch)=>{await onTrashChapter(ch);setSelectedChapter(null);setNewChapter(false)}} api={api}/>;
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
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button className="button primary" onClick={save} disabled={busy}>{busy?'Saving…':'Save book'}</button>{book?.id?<button className="button" style={{marginLeft:'auto'}} onClick={()=>onTrashBook(book)}>Move book to Trash</button>:null}</div>
      {book?.id ? <div style={{marginTop:18}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:12}}><h3>Chapters</h3><button className="button primary" onClick={()=>setNewChapter(true)}>+ New chapter</button></div>
        {(book.chapters||[]).map(ch=><div className="status-row" key={ch.id || ch.slug}><div><strong>{ch.title}</strong><div className="muted">{ch.type} · {ch.read}</div></div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><StatusPill status={ch.status}/><button className="button" onClick={()=>setSelectedChapter(ch)}>Edit</button><button className="button" onClick={()=>onTrashChapter(ch)}>Trash</button></div></div>)}
        {!(book.chapters||[]).length?<p className="muted">No chapters yet.</p>:null}
      </div>:<p className="muted">Save the book first, then you can add chapters.</p>}
    </div>
  </section>;
}

function TrashView({trash,onBack,onRestoreBook,onRestoreChapter,onDeleteBook,onDeleteChapter}){
  const empty=!trash.books?.length&&!trash.chapters?.length;
  return <section className="admin-card">
    <button className="button" onClick={onBack}>← Back to library</button>
    <div style={{marginTop:24}}><div className="eyebrow">Recovery</div><h2>Trash</h2><p className="muted">Restore items or permanently delete them. Permanent deletion cannot be undone.</p></div>
    {empty?<p className="muted" style={{marginTop:22}}>Trash is empty.</p>:null}
    {trash.books?.length?<div style={{marginTop:24}}><h3>Books</h3>{trash.books.map(book=><div className="status-row" key={book.id}><div><strong>{book.title}</strong><div className="muted">{book.chapters?.length||0} chapters</div></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="button" onClick={()=>onRestoreBook(book)}>Restore</button><button className="button" onClick={()=>onDeleteBook(book)}>Delete permanently</button></div></div>)}</div>:null}
    {trash.chapters?.length?<div style={{marginTop:24}}><h3>Chapters</h3>{trash.chapters.map(ch=><div className="status-row" key={ch.id}><div><strong>{ch.title}</strong><div className="muted">From {ch.bookTitle}</div></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="button" onClick={()=>onRestoreChapter(ch)}>Restore</button><button className="button" onClick={()=>onDeleteChapter(ch)}>Delete permanently</button></div></div>)}</div>:null}
  </section>;
}

export default function AdminClient({initialBooks,databaseReady,logoutAction}){
  const [books,setBooks]=useState(initialBooks); const [trash,setTrash]=useState({books:[],chapters:[]}); const [editing,setEditing]=useState(null); const [creating,setCreating]=useState(false); const [showTrash,setShowTrash]=useState(false); const [error,setError]=useState('');
  const stats=useMemo(()=>({books:books.length,chapters:books.reduce((n,b)=>n+(b.chapters?.length||0),0),published:books.reduce((n,b)=>n+(b.chapters||[]).filter(c=>c.status==='Published').length,0),coming:books.reduce((n,b)=>n+(b.status==='Coming Soon'?1:0)+(b.chapters||[]).filter(c=>c.status==='Coming Soon').length,0)}),[books]);
  async function api(action,payload={}){const r=await fetch('/api/cms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...payload})});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'CMS request failed');return d;}
  async function refresh(){const r=await fetch('/api/cms',{cache:'no-store'});const d=await r.json();if(!r.ok||!d.ok)throw new Error(d.error||'Could not refresh');setBooks(d.books);setTrash(d.trash||{books:[],chapters:[]});if(editing?.id){const fresh=d.books.find(b=>b.id===editing.id);if(fresh)setEditing(fresh);}return d.books;}
  async function saved(){try{const next=await refresh();if(creating){setCreating(false);setEditing(next[next.length-1]||null);}}catch(e){setError(e.message)}}
  async function trashBook(book){if(!confirm(`Move “${book.title}” to Trash? It will disappear from the public site.`))return;try{await api('trashBook',{id:book.id});setEditing(null);await refresh();}catch(e){setError(e.message)}}
  async function trashChapter(ch){if(!confirm(`Move “${ch.title}” to Trash?`))return;try{await api('trashChapter',{id:ch.id});await refresh();}catch(e){setError(e.message)}}
  async function restoreBook(book){try{await api('restoreBook',{id:book.id});await refresh();}catch(e){setError(e.message)}}
  async function restoreChapter(ch){try{await api('restoreChapter',{id:ch.id});await refresh();}catch(e){setError(e.message)}}
  async function deleteBook(book){if(!confirm(`Permanently delete “${book.title}” and all of its chapters? This cannot be undone.`))return;try{await api('permanentlyDeleteBook',{id:book.id});await refresh();}catch(e){setError(e.message)}}
  async function deleteChapter(ch){if(!confirm(`Permanently delete “${ch.title}”? This cannot be undone.`))return;try{await api('permanentlyDeleteChapter',{id:ch.id});await refresh();}catch(e){setError(e.message)}}

  if(showTrash) return <div className="admin-page"><div className="admin-shell"><TrashView trash={trash} onBack={()=>setShowTrash(false)} onRestoreBook={restoreBook} onRestoreChapter={restoreChapter} onDeleteBook={deleteBook} onDeleteChapter={deleteChapter}/>{error?<p className="error">{error}</p>:null}</div></div>;
  if(editing||creating) return <div className="admin-page"><div className="admin-shell"><BookEditor book={editing} onBack={()=>{setEditing(null);setCreating(false)}} onSaved={saved} onTrashBook={trashBook} onTrashChapter={trashChapter} api={api}/>{error?<p className="error">{error}</p>:null}</div></div>;
  return <div className="admin-page"><div className="admin-shell">
    <div className="admin-top"><div><div className="wordmark">DAVID//WRITES</div><div className="muted">Books, chapters and publishing</div></div><div style={{display:'flex',gap:10,flexWrap:'wrap'}}><Link className="button" href="/">View website</Link><button className="button" onClick={async()=>{try{await refresh();setShowTrash(true)}catch(e){setError(e.message)}}}>Trash</button><form action={logoutAction}><button className="button">Sign out</button></form></div></div>
    {!databaseReady?<div className="admin-card" style={{marginBottom:22}}><h2>Connect storage to enable editing</h2><p className="muted">The CMS is installed, but persistent storage is not connected yet. Add a Neon Postgres database to this Vercel project so it provides <code>DATABASE_URL</code>. Your current public content remains unchanged until then.</p></div>:null}
    <div className="admin-grid"><section className="admin-card"><h2>Publishing dashboard</h2><div className="status-row"><span>Books</span><strong>{stats.books}</strong></div><div className="status-row"><span>Chapters</span><strong>{stats.chapters}</strong></div><div className="status-row"><span>Published chapters</span><strong>{stats.published}</strong></div><div className="status-row"><span>Coming soon</span><strong>{stats.coming}</strong></div></section>
      <section className="admin-card"><h2>Publishing rules</h2><p className="muted"><strong>Draft</strong> stays private. <strong>Coming Soon</strong> appears publicly with its teaser but hides chapter content. <strong>Published</strong> is fully readable.</p><button className="button primary" disabled={!databaseReady} onClick={()=>setCreating(true)}>+ New book</button></section></div>
    <section className="admin-card" style={{marginTop:22}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><h2>Your books</h2><button className="button primary" disabled={!databaseReady} onClick={()=>setCreating(true)}>+ New book</button></div>{books.map(book=><div className="status-row" key={book.id || book.slug}><div><strong>{book.title}</strong><div className="muted">{book.chapters?.length||0} chapters · {book.slug}</div></div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><StatusPill status={book.status}/><button className="button" disabled={!databaseReady} onClick={()=>setEditing(book)}>Edit</button><button className="button" disabled={!databaseReady} onClick={()=>trashBook(book)}>Trash</button></div></div>)}</section>
    {error?<p className="error">{error}</p>:null}
    <section className="admin-card" style={{marginTop:22}}><h2>Optional Notion import</h2><p className="muted">Notion is no longer the source of truth. The existing sync endpoint remains available for importing old material when needed; all ongoing editing and publishing happens here.</p></section>
  </div></div>;
}
