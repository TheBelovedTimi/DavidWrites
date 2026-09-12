'use client';

import { useState } from 'react';

export default function SubscribeForm(){
  const[email,setEmail]=useState('');
  const[status,setStatus]=useState('idle');
  const[message,setMessage]=useState('');

  async function submit(e){
    e.preventDefault();
    setStatus('loading');setMessage('');
    try{
      const response=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
      const data=await response.json();
      if(!response.ok||!data.ok)throw new Error(data.error||'Could not subscribe right now.');
      setStatus('success');setMessage('You’re subscribed. New books and chapters will find their way to your inbox.');setEmail('');
    }catch(error){setStatus('error');setMessage(error.message||'Could not subscribe right now.');}
  }

  return <form onSubmit={submit} style={{display:'grid',gap:12,maxWidth:620}}>
    <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
      <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" style={{flex:'1 1 260px'}}/>
      <button className="button primary" type="submit" disabled={status==='loading'}>{status==='loading'?'Subscribing…':'Subscribe now'}</button>
    </div>
    <p className="muted" style={{margin:0,fontSize:13,lineHeight:1.6}}>Get an email when a new David Writes book or chapter is published. Unsubscribe anytime.</p>
    {message?<p className={status==='error'?'error':'success'} style={{margin:0}}>{message}</p>:null}
  </form>
}
