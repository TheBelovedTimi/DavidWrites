import { NextResponse } from 'next/server';
import { isAdmin } from '../../lib/auth';
import { deleteBook, deleteChapter, hasDatabase, listBooks, saveBook, saveChapter } from '../../lib/db';

async function guard() {
  if (!(await isAdmin())) return NextResponse.json({ ok:false,error:'Unauthorized' },{status:401});
  if (!hasDatabase()) return NextResponse.json({ ok:false,error:'Database is not connected yet. Add DATABASE_URL in Vercel.' },{status:503});
  return null;
}

export async function GET(){
  const blocked=await guard(); if(blocked) return blocked;
  try { return NextResponse.json({ok:true,books:await listBooks({admin:true})}); }
  catch(error){ return NextResponse.json({ok:false,error:error.message || 'Could not load CMS.'},{status:500}); }
}

export async function POST(request){
  const blocked=await guard(); if(blocked) return blocked;
  try {
    const body=await request.json();
    if(body.action==='saveBook') return NextResponse.json({ok:true,result:await saveBook(body.book)});
    if(body.action==='saveChapter') return NextResponse.json({ok:true,result:await saveChapter(body.chapter)});
    if(body.action==='deleteBook'){ await deleteBook(body.id); return NextResponse.json({ok:true}); }
    if(body.action==='deleteChapter'){ await deleteChapter(body.id); return NextResponse.json({ok:true}); }
    return NextResponse.json({ok:false,error:'Unknown CMS action.'},{status:400});
  } catch(error) {
    const message=String(error?.message || 'CMS request failed.');
    const status=message.includes('duplicate key') ? 409 : 500;
    return NextResponse.json({ok:false,error:status===409 ? 'That slug is already in use. Choose a different one.' : message},{status});
  }
}
