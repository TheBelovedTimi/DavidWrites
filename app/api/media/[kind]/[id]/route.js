import { getArtwork } from '../../../../lib/db';

export async function GET(_request,{params}){
  const {kind,id}=await params;
  const data=await getArtwork(kind,id);
  if(!data) return new Response(null,{status:404});
  const match=String(data).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if(!match) return new Response(null,{status:404});
  const bytes=Buffer.from(match[2],'base64');
  return new Response(bytes,{headers:{'Content-Type':match[1],'Cache-Control':'public, max-age=3600, stale-while-revalidate=86400'}});
}
