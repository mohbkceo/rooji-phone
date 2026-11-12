'use client';
import {useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {adminProduct} from '@/app/actions';
import {asDzd,slugify} from '@/lib/shared';
import type {Category,Product,Variant} from '@/lib/types';
import {ActionForm,Field} from './forms';
import {PhotoEditor} from './photo-editor';

type Entry={key:string;id:string;label:string;price:string;sale:string;stock:string;image:string;color:string;size:string;storage:string};
const initialVariant=(key:string):Entry=>({key,id:'',label:'Standard',price:'',sale:'',stock:'0',image:'',color:'',size:'',storage:''});
export function ProductEditor({product,variants,categories}:{product?:Product;variants:Variant[];categories:Category[]}){
 const [name,setName]=useState(product?.name||''),[seoTitle,setSeoTitle]=useState(product?.seo_title||'');
 const [gallery,setGallery]=useState<string[]>(product?JSON.parse(product.images):[]);
 const [entries,setEntries]=useState<Entry[]>(variants.map(v=>({key:v.id,id:v.id,label:v.label,price:asDzd(v.price),sale:asDzd(v.sale),stock:String(v.stock),image:v.image,color:v.color,size:v.size,storage:v.storage})));
 const [uploading,setUploading]=useState(false);
 const [selected,setSelected]=useState(product?.status||'draft');
 const stocks=Object.fromEntries(variants.map(v=>[v.id,v.stock]));
 function edit(key:string,field:keyof Entry,value:string){setEntries(list=>list.map(v=>v.key===key?{...v,[field]:value}:v));}
 return <ActionForm action={adminProduct} label="Enregistrer le produit" disabled={uploading} className="form product-editor">
  <input type="hidden" name="id" value={product?.id||''}/><input type="hidden" name="version" value={product?.updated||''}/><input type="hidden" name="images" value={JSON.stringify(gallery)}/><input type="hidden" name="variants" value={JSON.stringify(entries)}/><input type="hidden" name="stocks" value={JSON.stringify(stocks)}/>
  <section className="panel"><h2>Informations</h2><Field label="Nom du produit"><input name="name" value={name} onChange={e=>setName(e.target.value)} maxLength={160} required/></Field><div className="form-grid"><Field label="Catégorie"><select name="category" required defaultValue={product?.category||''}><option value="" disabled>Choisir</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></Field><Field label="Marque"><input name="brand" maxLength={70} defaultValue={product?.brand}/></Field></div>
   <Field label="Description"><textarea name="description" rows={3} maxLength={3000} defaultValue={product?.description} required={selected==='published'}/></Field><details><summary>Caractéristiques</summary><Field label="Spécifications"><textarea name="specs" rows={3} maxLength={3000} defaultValue={product?.specs}/></Field></details></section>
  <section className="panel"><h2>Photos</h2><PhotoEditor images={gallery} onBusy={setUploading} onChange={images=>{setGallery(images);setEntries(values=>values.map(v=>v.image&&!images.includes(v.image)?{...v,image:''}:v));}}/></section>
  <section className="panel"><div className="section-head"><h2>Prix et stock</h2><button type="button" className="button secondary" disabled={entries.length>=60} onClick={()=>setEntries(list=>[...list,{...initialVariant(crypto.randomUUID()),label:list.length?'':'Standard'}])}><Plus size={16}/> {entries.length?'Ajouter une variante':'Ajouter un prix'}</button></div>
   {!entries.length&&<p className="muted">Sans prix, le produit sera proposé sur demande.</p>}
   {entries.map((v,i)=><div key={v.key} className="variant-editor"><div className="section-head"><strong>Variante {i+1}</strong><button type="button" className="icon-link" aria-label={'Retirer la variante '+(i+1)} onClick={()=>setEntries(list=>list.filter(x=>x.key!==v.key))}><Trash2 size={18}/></button></div>
    <Field label="Libellé (couleur, stockage…)"><input value={v.label} onChange={e=>edit(v.key,'label',e.target.value)} required maxLength={110}/></Field>
    <div className="variant-values"><Field label="Prix (DA)"><input inputMode="decimal" value={v.price} onChange={e=>edit(v.key,'price',e.target.value)} required/></Field><Field label="Prix remisé (DA)"><input inputMode="decimal" value={v.sale} onChange={e=>edit(v.key,'sale',e.target.value)}/></Field><Field label="Stock"><input type="number" min={0} max={9999999} value={v.stock} onChange={e=>edit(v.key,'stock',e.target.value)} required/></Field></div>
    {gallery.length>0&&<Field label="Photo de la variante"><select value={v.image} onChange={e=>edit(v.key,'image',e.target.value)}><option value="">Photo principale</option>{gallery.map((a,i)=><option value={a} key={a}>Photo {i+1}</option>)}</select></Field>}
    <details><summary>Attributs de la variante</summary><div className="variant-values"><Field label="Couleur"><input value={v.color} maxLength={70} onChange={e=>edit(v.key,'color',e.target.value)}/></Field><Field label="Taille"><input value={v.size} maxLength={70} onChange={e=>edit(v.key,'size',e.target.value)}/></Field><Field label="Stockage"><input value={v.storage} maxLength={70} onChange={e=>edit(v.key,'storage',e.target.value)}/></Field></div></details>
   </div>)}
  </section>
  <section className="panel"><h2>Publication</h2><div className="form-grid"><Field label="Visibilité"><select name="status" value={selected} onChange={e=>setSelected(e.target.value)}><option value="draft">Brouillon</option><option value="published">Publié</option><option value="archived">Archivé</option></select></Field><label className="check"><input type="checkbox" name="featured" defaultChecked={!!product?.featured}/> Afficher dans Populaires</label></div>
  <details><summary>Référencement</summary><div className="seo-preview"><strong>{seoTitle||name||'Nom du produit'}</strong><small>/produit/{product?.slug||slugify(name)||'…'}</small></div><Field label="Titre SEO"><input name="seoTitle" maxLength={100} value={seoTitle} onChange={e=>setSeoTitle(e.target.value)}/></Field><Field label="Description SEO"><textarea name="seoDescription" rows={2} maxLength={240} defaultValue={product?.seo_description}/></Field></details></section>
 </ActionForm>;
}
