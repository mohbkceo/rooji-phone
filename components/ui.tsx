import Link from 'next/link';
import {ArrowRight, ImageOff} from 'lucide-react';
import {imageUrl,widths} from '@/lib/image-url';
import {money} from '@/lib/shared';
import type {CatalogProduct} from '@/lib/types';

export function Brand(){
 return <Link className="inline-flex min-h-11 w-fit min-w-0 items-center gap-1.5 whitespace-nowrap text-sm font-bold tracking-tight min-[375px]:gap-2 min-[375px]:text-base sm:text-xl" href="/" aria-label="Roudji Phone, accueil">
  <img className="size-6 shrink-0 object-contain min-[375px]:size-8 sm:size-9" src="/brand/logo-96.webp" width="36" height="36" alt=""/>
  <span>Roudji <span className="text-brand-deep">Phone</span></span>
 </Link>;
}

const editorialPhoto = /^\/photos\/(phone|cable|audio|watch|repair)\.png$/;
export function Photo({asset,alt,sizes='(max-width: 620px) 90vw, 40vw',priority=false,className=''}:{asset:string;alt:string;sizes?:string;priority?:boolean;className?:string}) {
 if(!asset)return <div className={`grid size-full min-h-12 content-center justify-items-center gap-2 bg-surface text-xs text-muted ${className}`}><ImageOff size={20} aria-hidden="true"/><span>Photo à venir</span></div>;
 const optimized=editorialPhoto.test(asset);
 const src=(width:number)=>optimized?imageUrl(asset,width).replace(/\.png$/,'.webp'):imageUrl(asset,width);
 return <img className={className} src={imageUrl(asset,640)} srcSet={widths.map(w=>src(w)+' '+w+'w').join(', ')} sizes={sizes} alt={alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':undefined} decoding="async"/>;
}

export function ButtonLink({href,children,secondary=false}:{href:string;children:React.ReactNode;secondary?:boolean}) {
 return <Link className={'button '+(secondary?'secondary':'primary')} href={href}>{children}{!secondary&&<ArrowRight size={17} aria-hidden="true"/>}</Link>;
}
export function TextLink({href,children}:{href:string;children:React.ReactNode}) {
 return <Link className="text-link" href={href}>{children}<ArrowRight size={15} aria-hidden="true"/></Link>;
}
export function Empty({title,children}:{title:string;children?:React.ReactNode}) {
 return <div className="empty"><strong>{title}</strong>{children}</div>;
}
export function Badge({state}:{state:string}) {
 const tone=['Livrée','Terminée','Acceptée','Publié','Prête'].includes(state)?'green':['Annulée','Refusée','Archivé'].includes(state)?'red':'';
 return <span className={'badge '+tone}>{state}</span>;
}
export function Breadcrumb({items}:{items:{label:string;href?:string}[]}) {
 return <nav aria-label="Fil d’Ariane" className="mb-5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm text-muted">
  <Link className="inline-flex min-h-6 items-center hover:text-brand-deep hover:underline" href="/">Accueil</Link>
  {items.map(item=><span className="inline-flex min-w-0 items-baseline gap-2" key={item.label}><span aria-hidden="true">/</span>{item.href?
   <Link className="inline-flex min-h-6 items-center wrap-anywhere hover:text-brand-deep hover:underline" href={item.href}>{item.label}</Link>:
   <span className="wrap-anywhere text-ink" aria-current="page">{item.label}</span>}</span>)}
 </nav>;
}

export function ProductGrid({products,heading:Heading='h3'}:{products:CatalogProduct[];heading?:'h2'|'h3'}) {
 return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
  {products.map(p=><article className="min-w-0" key={p.id}>
   <Link className="group discovery-card" href={'/produit/'+p.slug}>
    <div className="aspect-square overflow-hidden rounded-t-card bg-surface">
     <Photo asset={p.image} alt="" className="size-full object-contain p-3 sm:p-4" sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, (max-width: 1375px) 22vw, 304px"/>
    </div>
    <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
     <p className="m-0 text-xs wrap-anywhere text-muted">{p.category_name}</p>
     <Heading className="m-0 text-sm leading-snug font-semibold tracking-normal wrap-anywhere sm:text-base">{p.name}</Heading>
     <div className="mt-auto pt-2">
      {p.price!==null&&!p.available&&<p className="mb-1 text-xs text-muted">Rupture de stock</p>}
      <div className="flex items-end justify-between gap-1">
       <strong className="text-sm leading-snug wrap-anywhere sm:text-base">{p.price===null?'Sur demande':money(p.price)}</strong>
       <ArrowRight size={16} className="mb-0.5 shrink-0 text-muted group-hover:text-brand-deep" aria-hidden="true"/>
      </div>
     </div>
    </div>
   </Link>
  </article>)}
 </div>;
}
