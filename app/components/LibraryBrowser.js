'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function LibraryBrowser({books}){
  const [query,setQuery]=useState('');
  const [status,setStatus]=useState('All');
  const [label,setLabel]=useState('All');
  const [lastRead,setLastRead]=useState(null);
  const [filtersOpen,setFiltersOpen]=useState(false);

  useEffect(()=>{
    try{
      const saved=localStorage.getItem('dw_continue_reading');
      if(saved)setLastRead(JSON.parse(saved));
    }catch{}
  },[]);

  const labels=useMemo(()=>Array.from(new Set((books||[]).map(b=>b.label).filter(Boolean))).sort(),[books]);
  const activeCount=(query.trim()?1:0)+(status!=='All'?1:0)+(label!=='All'?1:0);
  const filtered=useMemo(()=>{
    const q=query.trim().toLowerCase();
    return (books||[]).filter(book=>{
      const matchesQuery=!q || [book.title,book.description,book.label].some(v=>String(v||'').toLowerCase().includes(q));
      const matchesStatus=status==='All' || book.status===status;
      const matchesLabel=label==='All' || book.label===label;
      return matchesQuery&&matchesStatus&&matchesLabel;
    });
  },[books,query,status,label]);

  function clearFilters(){setQuery('');setStatus('All');setLabel('All');}

  return <>
    {lastRead?.url?<div className="continue-card"><div><div className="eyebrow">Continue reading</div><strong>{lastRead.chapterTitle}</strong><div className="muted">{lastRead.bookTitle}</div></div><Link className="button primary" href={lastRead.url}>Continue →</Link></div>:null}

    <div className="library-filter-wrap">
      <button className={`library-filter-toggle ${filtersOpen?'open':''}`} type="button" onClick={()=>setFiltersOpen(v=>!v)} aria-expanded={filtersOpen} aria-controls="library-filters" aria-label="Search and filter library">
        <span className="filter-icon" aria-hidden="true">⌕</span>
        <span>Find & filter</span>
        {activeCount>0?<span className="filter-count">{activeCount}</span>:null}
        <span className="filter-chevron" aria-hidden="true">⌄</span>
      </button>

      {filtersOpen?<div id="library-filters" className="library-filter-panel">
        <div className="library-search-row">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search the library…" aria-label="Search library" autoFocus/>
        </div>
        <div className="library-filter-fields">
          <label><span>Status</span><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Published</option><option>Coming Soon</option></select></label>
          <label><span>Genre / collection</span><select value={label} onChange={e=>setLabel(e.target.value)}><option>All</option>{labels.map(item=><option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="library-filter-foot"><span className="muted">Showing {filtered.length} of {(books||[]).length}</span>{activeCount>0?<button type="button" className="filter-clear" onClick={clearFilters}>Clear filters</button>:null}</div>
      </div>:null}
    </div>

    <div className="book-grid">
      {filtered.map(book=><Link key={book.slug} href={`/books/${book.slug}`} className={`book-card ${book.accent}`} style={{overflow:'hidden'}}>{book.coverImage?<img src={book.coverImage} alt={`${book.title} cover`} style={{width:'100%',aspectRatio:'2 / 3',objectFit:'cover',display:'block',marginBottom:18,borderRadius:10}}/>:null}<div className="label">{book.label || (book.status==='Coming Soon'?'COMING SOON':'BOOK')}</div><h3>{book.title}</h3><p>{book.description}</p><div className="card-foot"><span>{book.status}</span><span>{book.chapters.length} {book.chapters.length===1?'chapter':'chapters'} →</span></div></Link>)}
    </div>
    {!filtered.length?<div className="empty-library">No books match those filters.</div>:null}
  </>;
}
