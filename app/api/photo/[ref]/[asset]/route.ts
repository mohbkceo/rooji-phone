import {readFile} from 'node:fs/promises';
import {lookup} from '@/lib/access';
import {imageId,mediaPath} from '@/lib/media';

export async function GET(request:Request,{params}:{params:Promise<{asset:string;ref:string}>}) {
 const {asset,ref}=await params;
 if(!imageId.test(asset))return new Response(null,{status:404});
 const record=await lookup(ref,new URL(request.url).searchParams.get('t')||'');
 if(!record||!('kind' in record)||!JSON.parse(record.images).includes(asset))return new Response(null,{status:404});
 const content=await readFile(mediaPath(asset,'960')).catch(()=>null);
 if(!content)return new Response(null,{status:404});
 return new Response(new Uint8Array(content),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store'}});
}
