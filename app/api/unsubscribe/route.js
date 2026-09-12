import { NextResponse } from 'next/server';
import { unsubscribeByToken } from '../../lib/newsletter';

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const removed = await unsubscribeByToken(token).catch(()=>false);
  const title = removed ? 'You are unsubscribed.' : 'This unsubscribe link is invalid or has already been used.';
  const html = `<!doctype html><html><body style="margin:0;background:#0b0910;color:#f4eff7;font-family:Arial,sans-serif"><div style="max-width:620px;margin:80px auto;padding:32px"><div style="font-size:12px;letter-spacing:.18em;color:#a58eb9;margin-bottom:24px">DAVID//WRITES</div><h1 style="font-family:Georgia,serif">${title}</h1><p style="color:#b8aebe;line-height:1.7">${removed?'You will no longer receive new-book or new-chapter notifications from David Writes.':'If you still want to unsubscribe, use the most recent email you received.'}</p><p style="margin-top:30px"><a href="/" style="color:#c5a7dd">Return to David Writes</a></p></div></body></html>`;
  return new NextResponse(html,{headers:{'Content-Type':'text/html; charset=utf-8'}});
}
