'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Menu, X} from 'lucide-react';
import {useEffect,useRef,useState} from 'react';
import {NavigationPending} from './navigation-pending';

const links=[
 {href:'/catalogue',label:'Catalogue',related:['/categorie/','/produit/']},
 {href:'/nouveautes',label:'Nouveautés'},
 {href:'/reparation',label:'Réparation'},
 {href:'/suivi',label:'Suivi',related:['/suivi/']},
];

export function ShopNav({mobile=false,onSelect}:{mobile?:boolean;onSelect?:()=>void}){
 const pathname=usePathname();
 return <nav aria-label="Navigation principale" className={mobile?
  'mobile-navigation absolute inset-x-0 top-full z-10 grid gap-1 border-b border-line bg-white px-4 py-3 motion-safe:group-open:animate-menu':
  'hidden items-center gap-1 md:flex lg:gap-3'}>
  {links.map(({href,label,related})=>{
   const current=pathname===href;
   const active=current||related?.some(prefix=>pathname.startsWith(prefix));
   return <Link className="relative flex min-h-11 items-center rounded-control px-3 text-sm font-medium text-muted underline-offset-4 motion-safe:transition-colors hover:bg-surface hover:text-ink data-[active]:bg-brand-tint data-[active]:text-brand-deep data-[active]:underline"
    aria-current={current?'page':active?'location':undefined} data-active={active||undefined} href={href} key={href} onClick={onSelect}>{label}<NavigationPending/></Link>;
  })}
  {mobile&&<Link className="text-link border-t border-line px-3 pt-2" href="/demande-produit" onClick={onSelect}>Demander un produit</Link>}
 </nav>;
}

export function MobileMenu(){
 const menu=useRef<HTMLDetailsElement>(null);
 const summary=useRef<HTMLElement>(null);
 const [open,setOpen]=useState(false);
 const close=()=>{if(menu.current)menu.current.open=false;};
 useEffect(()=>{
  const outside=(event:PointerEvent)=>{if(!menu.current?.contains(event.target as Node))close();};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[]);
 return <details className="group md:hidden" ref={menu} onToggle={event=>setOpen(event.currentTarget.open)} onBlur={event=>{
  if(event.relatedTarget&&!event.currentTarget.contains(event.relatedTarget))close();
 }} onKeyDown={event=>{
  if(event.key==='Escape'&&menu.current?.open){
   event.preventDefault();
   close();
   summary.current?.focus();
  }
 }}>
  <summary className="icon-link list-none [&::-webkit-details-marker]:hidden" aria-label={open?'Fermer le menu':'Ouvrir le menu'} aria-expanded={open} ref={summary}>
   <Menu size={21} className="group-open:hidden" aria-hidden="true"/>
   <X size={21} className="hidden group-open:block" aria-hidden="true"/>
  </summary>
  <ShopNav mobile onSelect={close}/>
 </details>;
}
