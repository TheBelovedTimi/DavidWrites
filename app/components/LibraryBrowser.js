'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function LibraryBrowser({books}){
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('All');
  const [label,setLabel]=useState('All');
  const [lastRead,setLastRead]=useState(null);

  useEffect(()=>{
    try{
      const saved=localStorage.getItem('dw_continue_reading');
      if(saved)setLastRead(JSON.parse(saved));
    }catch{}
  },[]);

  const labels=useMemo(()=>Array.from(new Set((books||[]).map(b=>b.label).filter(Boolean))).sort(),[books]);
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return (books||[]).filter(book=>{
      const matchesQuery=!q || [book.title,book.description,book.label].some(v=>String(v||'').toLowerCase().includes(q));
      const matchesStatus=status==='All' || book.status===status;
      const matchesLabel=label==='All' || book.label===label;
      return matchesQuery&&matchesStatus&&matchesLabel;
    });
  },[books,query,status,label]);

  return <>
    {lastRead?.url?<div className="continue-card"><div><div className="eyebrow">Continue reading</div><strong>{lastRead.chapterTitle}</strong><div className="muted">{lastRead.bookTitle}</div></div><Link className="button primary" href={lastRead.url}>Continue →</Link></div>:null}
    <div className="library-tools">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search books, genres or descriptions…" aria-label="Search library"/>
      <select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Filter by status"><option>All</option><option>Published</option><option>Coming Soon</option></select>
      <select value={label} onChange={e=>setLabel(e.target.value)} aria-label="Filter by genre"><option>All</option>{labels.map(item=><option key={item}>{item}</option>)}</select>
    </div>
    <div className="book-grid">
      {filtered.map(book=><Link key={book.slug} href={`/books/${book.slug}`} className={`book-card ${book.accent}`} style={{overflow:'hidden'}}>{book.coverImage?<img src={book.coverImage} alt={`${book.title} cover`} style={{width:'100%',aspectRatio:'2 / 3',objectFit:'cover',display:'block',marginBottom:18,borderRadius:10}}/>:null}<div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'BOOK')}</div><h3>{book.title}</h3><p>{book.description}</p><div className="card-foot"><span>{book.status}</span><span>{book.chapters.length} {book.chapters.length===1?'chapter':'chapters'} →</span></div></Link>)}
    </div>
    {!filtered.length?<div className="empty-library">No books match those filters.</div>:null}
  </>;
}
