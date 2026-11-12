'use client';
import {useId,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ImagePlus,Star,X} from 'lucide-react';
import {imageUrl} from '@/lib/image-url';

export function PhotoEditor({images,onChange,max=12,onBusy}:{images:string[];onChange:(images:string[])=>void;max?:number;onBusy?:(busy:boolean)=>void}){
 const id=useId(),fileInput=useRef<HTMLInputElement>(null),drag=useRef<number|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function importFiles(files:FileList){
  if(busy)return;
  setError('');setBusy(true);onBusy?.(true);
  const next=max===1?[]:[...images];
  for(const file of Array.from(files).slice(0,max-next.length)){
   const body=new FormData();body.set('photo',file);
   try {
    const response=await fetch('/api/admin/media',{method:'POST',body});
    const data=await response.json();
    if(!response.ok||typeof data.id!=='string')throw Error(data.error||'Import impossible.');
    next.push(data.id);
   }catch(error){setError(error instanceof Error?error.message:'Import impossible.');}
  }
  if(max!==1||next.length)onChange(next);
  setBusy(false);onBusy?.(false);
  if(fileInput.current)fileInput.current.value='';
 }
 function move(from:number,to:number){
  if(to<0||to>=images.length||from===to)return;
  const next=[...images];const [item]=next.splice(from,1);next.splice(to,0,item);onChange(next);
 }
 return <div>
  <div className="dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(e.dataTransfer.files.length)void importFiles(e.dataTransfer.files);}}>
   <label htmlFor={id}><ImagePlus size={20}/>{busy?'Import en cours…':max===1?'Importer un PNG':'Déposer ou choisir des PNG'}</label>
   <input ref={fileInput} id={id} type="file" accept="image/png,.png" multiple={max>1} disabled={busy||max>1&&images.length>=max} onChange={e=>{if(e.currentTarget.files?.length)void importFiles(e.currentTarget.files);}}/>
   <small>8 Mo par image{max>1?' · '+images.length+'/'+max:''}</small>
  </div>{error&&<p className="form-error" role="alert">{error}</p>}
  {images.length>0&&<div className="image-editor-grid">{images.map((asset,index)=><div key={asset} draggable={max>1&&!busy} onDragStart={e=>{drag.current=index;e.dataTransfer.setData('text/plain',String(index));}} onDragOver={e=>e.preventDefault()} onDrop={e=>{if(busy||drag.current===null)return;e.preventDefault();e.stopPropagation();move(drag.current,index);drag.current=null;}} onDragEnd={()=>{drag.current=null;}}>
   <img src={imageUrl(asset,320)} alt={'Photo '+(index+1)}/>
   <div className="image-controls">{max>1&&<>{index===0?<span className="badge">Principale</span>:<button type="button" className="icon-link" aria-label="Définir comme principale" disabled={busy} onClick={()=>move(index,0)}><Star size={16}/></button>}
   <button type="button" className="icon-link" aria-label="Déplacer avant" disabled={busy||index===0} onClick={()=>move(index,index-1)}><ArrowLeft size={16}/></button><button type="button" className="icon-link" aria-label="Déplacer après" disabled={busy||index===images.length-1} onClick={()=>move(index,index+1)}><ArrowRight size={16}/></button></>}
   <button type="button" className="icon-link" aria-label={'Retirer la photo '+(index+1)} disabled={busy} onClick={()=>onChange(images.filter(x=>x!==asset))}><X size={17}/></button></div>
  </div>)}</div>}
 </div>;
}
export function SinglePhoto({name,initial}:{name:string;initial:string}){
 const [images,setImages]=useState(initial?[initial]:[]);
 return <><input type="hidden" name={name} value={images[0]||''}/><PhotoEditor images={images} onChange={setImages} max={1}/></>;
}
