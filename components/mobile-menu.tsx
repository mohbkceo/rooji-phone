'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Menu, X} from 'lucide-react';
import {useRef} from 'react';

const links=[
 {href:'/catalogue',label:'Catalogue',related:['/categorie/','/produit/']},
 {href:'/nouveautes',label:'Nouveautés'},
 {href:'/reparation',label:'Réparation'},
];

export function ShopNav({mobile=false,onSelect}:{mobile?:boolean;onSelect?:()=>void}){
 const pathname=usePathname();
 return <nav aria-label="Navigation principale" className={mobile?
  'absolute inset-x-0 top-full z-10 grid gap-1 border-b border-line bg-white px-4 py-3 shadow-sm motion-safe:group-open:animate-menu':
  'hidden items-center gap-1 md:flex lg:gap-3'}>
  {links.map(({href,label,related})=>{
   const current=pathname===href;
   const active=current||related?.some(prefix=>pathname.startsWith(prefix));
   return <Link className="flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-muted motion-safe:transition-colors hover:bg-surface hover:text-ink data-[active]:bg-brand-tint data-[active]:text-brand-deep"
    aria-current={current?'page':undefined} data-active={active||undefined} href={href} key={href} onClick={onSelect}>{label}</Link>;
  })}
 </nav>;
}

export function MobileMenu(){
 const menu=useRef<HTMLDetailsElement>(null);
 const summary=useRef<HTMLElement>(null);
 const close=()=>{if(menu.current)menu.current.open=false;};
 return <details className="group md:hidden" ref={menu} onKeyDown={event=>{
  if(event.key==='Escape'&&menu.current?.open){
   event.preventDefault();
   close();
   summary.current?.focus();
  }
 }}>
  <summary className="icon-link list-none [&::-webkit-details-marker]:hidden" aria-label="Menu" ref={summary}>
   <Menu size={21} className="group-open:hidden" aria-hidden="true"/>
   <X size={21} className="hidden group-open:block" aria-hidden="true"/>
  </summary>
  <ShopNav mobile onSelect={close}/>
 </details>;
}
