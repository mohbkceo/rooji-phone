import {readFile} from 'node:fs/promises';
import {imageId,mediaPath,publicAsset} from '@/lib/media';

export async function GET(_request:Request,{params}:{params:Promise<{asset:string;file:string}>}) {
 const {asset,file}=await params;
 if(!imageId.test(asset)||! /^(320|640|960|1440)\.png$/.test(file)||!publicAsset(asset))return new Response(null,{status:404});
 const content=await readFile(mediaPath(asset,file.slice(0,-4))).catch(()=>null);
 if(!content)return new Response(null,{status:404});
 return new Response(new Uint8Array(content),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable'}});
}
