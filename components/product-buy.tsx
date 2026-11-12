'use client';
import {useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/shared';
import type {ProductDetail} from '@/lib/types';
import {Photo} from './ui';
import {BuyButtons} from './cart';

export function ProductBuy({product,initial}:{product:ProductDetail;initial?:string}){
 const images=JSON.parse(product.images) as string[];
 const [selected,setSelected]=useState(initial||product.variants[0]?.id||'');
 const variant=product.variants.find(v=>v.id===selected)||product.variants[0];
 const [active,setActive]=useState(variant?.image||images[0]||'');
 const [quantity,setQuantity]=useState(1);
 const price=variant?.sale??variant?.price;
 const max=variant?Math.min(20,variant.stock):0;
 return <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-8 lg:gap-12">
  <div><div className="aspect-square overflow-hidden rounded-card bg-surface"><Photo asset={active} alt={[product.name,variant?.label].filter(Boolean).join(' – ')} sizes="(max-width: 767px) 92vw, (max-width: 1375px) 47vw, 640px" className="size-full object-contain p-4 sm:p-6" priority/></div>
   {images.length>1&&<div className="mt-3 flex gap-2 overflow-x-auto p-1">{images.map((image,i)=><button className="aspect-square w-16 shrink-0 overflow-hidden rounded-control border border-line bg-surface aria-pressed:border-brand aria-pressed:ring-1 aria-pressed:ring-brand" type="button" key={image} aria-label={'Photo '+(i+1)} aria-pressed={image===active} onClick={()=>setActive(image)}><Photo asset={image} alt="" sizes="64px" className="size-full object-contain"/></button>)}</div>}</div>
  <div className="min-w-0 md:pt-2"><span className="eyebrow">{product.brand||product.category_name}</span><h1 className="mt-2 mb-3">{product.name}</h1>
   <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight">{price===undefined?'Sur demande':money(price)}{variant?.sale&&<del className="text-base font-medium text-muted">{money(variant.price)}</del>}</div>
   <p className="muted">{variant?(variant.stock?'En stock':'Rupture de stock'):'Disponible sur demande'}</p>
   {product.variants.length>0&&<label className="field max-w-sm"><span>Variante</span><select value={variant?.id} onChange={e=>{
    const next=product.variants.find(v=>v.id===e.target.value);
    setSelected(e.target.value);setActive(next?.image||images[0]||'');setQuantity(1);
   }}>{product.variants.map(v=><option key={v.id} value={v.id}>{v.label}{v.stock?'':' — épuisée'}</option>)}</select></label>}
   {variant&&max>0&&price!==undefined?<><label className="field my-3 max-w-24"><span>Quantité</span><input type="number" min={1} max={max} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(max,e.target.valueAsNumber||1)))}/></label>
    <BuyButtons key={variant.id} line={{id:variant.id,name:product.name,label:variant.label,slug:product.slug,price,qty:quantity,image:variant.image||images[0]}} max={max}/></>:<Link className="button primary" href={'/demande-produit?modele='+encodeURIComponent(product.name)+(variant?'&variante='+encodeURIComponent(variant.label):'')}>Demander</Link>}
   <div className="mt-4 border-t border-line pt-5 wrap-anywhere"><p>{product.description}</p>{product.specs&&<details open><summary className="mb-2 min-h-8 font-semibold">Caractéristiques</summary><div className="preformatted">{product.specs}</div></details>}</div>
  </div>
 </div>;
}
