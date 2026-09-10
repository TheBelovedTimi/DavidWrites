import { NextResponse } from 'next/server';
import { incrementChapterView } from '../../lib/db';

export async function POST(request){
  try{
    const body=await request.json();
    await incrementChapterView(body.chapterId);
    return NextResponse.json({ok:true});
  }catch{
    return NextResponse.json({ok:false},{status:400});
  }
}
