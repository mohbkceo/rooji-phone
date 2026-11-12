'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {LayoutDashboard,Package,ShoppingBag,Wrench,Inbox,Users,ChartNoAxesColumn,Settings} from 'lucide-react';
const items=[['','Tableau de bord',LayoutDashboard],['produits','Produits',Package],['commandes','Commandes',ShoppingBag],['reparations','Réparations',Wrench],['demandes','Demandes',Inbox],['clients','Clients',Users],['statistiques','Statistiques',ChartNoAxesColumn],['parametres','Paramètres',Settings]] as const;
export function AdminNav(){
 const path=usePathname();
 return <nav className="admin-nav" aria-label="Administration">{items.map(([slug,label,Icon])=>{
  const href='/admin'+(slug?'/'+slug:'');
  const active=slug?path===href||path.startsWith(href+'/'):path===href;
  return <Link key={href} href={href} aria-current={active?'page':undefined}><Icon size={18} aria-hidden="true"/><span>{label}</span></Link>;
 })}</nav>;
}
