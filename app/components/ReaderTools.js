'use client';

import { useEffect, useMemo, useState } from 'react';

export default function ReaderTools({chapterId,readMinutes,title}){
  const [theme,setTheme]=useState('dark');
  const [fontSize,setFontSize]=useState(18);
  const [progress,setProgress]=useState(0);
  const [shared,setShared]=useState(false);

  useEffect(()=>{
    const savedTheme=localStorage.getItem('dw_reader_theme') || 'dark';
    const savedSize=Number(localStorage.getItem('dw_reader_size') || 18);
    setTheme(savedTheme); setFontSize(savedSize);
  },[]);

  useEffect(()=>{
    document.documentElement.dataset.readerTheme=theme;
    document.documentElement.style.setProperty('--reader-font-size',`${fontSize}px`);
    localStorage.setItem('dw_reader_theme',theme);
    localStorage.setItem('dw_reader_size',String(fontSize));
  },[theme,fontSize]);

  useEffect(()=>{
    const update=()=>{
      const max=document.documentElement.scrollHeight-window.innerHeight;
      setProgress(max>0?Math.min(1,window.scrollY/max):0);
    };
    update(); window.addEventListener('scroll',update,{passive:true}); window.addEventListener('resize',update);
    return()=>{window.removeEventListener('scroll',update);window.removeEventListener('resize',update)};
  },[]);

  useEffect(()=>{
    if(!chapterId)return;
    const key=`dw_view_${chapterId}`;
    if(sessionStorage.getItem(key))return;
    sessionStorage.setItem(key,'1');
    fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chapterId})}).catch(()=>{});
  },[chapterId]);

  const minutesLeft=useMemo(()=>Math.max(1,Math.ceil((Number(readMinutes||1))*(1-progress))),[readMinutes,progress]);

  async function share(){
    const data={title, text:`Read “${title}” on David Writes`, url:window.location.href};
    try{
      if(navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(window.location.href); setShared(true); setTimeout(()=>setShared(false),1800); }
    }catch{}
  }

  return <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'center',margin:'20px 0 30px'}}>
    <span className="muted" style={{fontSize:13}}>{minutesLeft} min left</span>
    <button className="button" type="button" onClick={()=>setFontSize(v=>Math.max(15,v-1))} aria-label="Decrease text size">A−</button>
    <button className="button" type="button" onClick={()=>setFontSize(v=>Math.min(24,v+1))} aria-label="Increase text size">A+</button>
    <button className="button" type="button" onClick={()=>setTheme('dark')} aria-pressed={theme==='dark'}>Dark</button>
    <button className="button" type="button" onClick={()=>setTheme('light')} aria-pressed={theme==='light'}>Light</button>
    <button className="button" type="button" onClick={()=>setTheme('sepia')} aria-pressed={theme==='sepia'}>Sepia</button>
    <button className="button" type="button" onClick={share}>{shared?'Link copied ✓':'Share'}</button>
  </div>;
}
