import { NextResponse } from 'next/server';
import { subscribeEmail } from '../../lib/newsletter';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await subscribeEmail(body?.email);
    return NextResponse.json({ ok:true, email:result.email });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error?.message || 'Could not subscribe right now.' }, { status:400 });
  }
}
