import sharp from 'sharp';
import {mkdir,rename,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {dataPath,get,run} from './db';
import {id,InputError} from './security';

import {widths} from './image-url';
export {imageId,imageUrl} from './image-url';
export const mediaPath=(asset:string,width:string)=>join(dataPath(),'media',asset,width+'.png');
export const publicAsset=(asset:string)=>!!get("SELECT id FROM media WHERE id=? AND scope='public'",asset);

export async function uploadImage(file:File,scope:'public'|'private') {
 if(!file.size || file.size>8*1024*1024)throw new InputError('Image trop volumineuse (8 Mo maximum).');
 const bytes=Buffer.from(await file.arrayBuffer());
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 const invalid=scope==='public'?'Sélectionnez une image PNG valide.':'Formats acceptés : PNG, JPG ou WebP.';
 if(!png&&(scope==='public'||!jpeg&&!webp))throw new InputError(invalid);
 const input=sharp(bytes,{limitInputPixels:24_000_000,failOn:'warning'});
 const metadata=await input.metadata().catch(()=>null);
 const formats=scope==='public'?['png']:['png','jpeg','webp'];
 if(!metadata?.width || !metadata.height || !formats.includes(metadata.format) || (metadata.pages??1)>1) {
  throw new InputError(invalid);
 }
 const asset=id(), root=join(dataPath(),'media'), stage=join(root,'.'+asset);
 await mkdir(stage,{recursive:true,mode:0o700});
 try {
  for(const width of widths) {
   await input.clone().rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true})
    .png({compressionLevel:9,adaptiveFiltering:true}).toFile(join(stage,width+'.png'));
  }
  await rename(stage,join(root,asset));
  run('INSERT INTO media VALUES(?,?,?,?)',asset,scope,metadata.width,metadata.height);
  return asset;
 } catch(error) {
  await Promise.all([rm(stage,{recursive:true,force:true}),rm(join(root,asset),{recursive:true,force:true})]);
  console.error('Image upload:',error instanceof Error?error.message:'unknown');
  throw new InputError('Cette image n’a pas pu être enregistrée.');
 }
}
export async function discardImage(asset:string) {
 run('DELETE FROM media WHERE id=?',asset);
 await rm(join(dataPath(),'media',asset),{recursive:true,force:true});
}
