import Link from 'next/link';
import {requireAdmin} from '@/lib/auth';
import {all} from '@/lib/db';
import {AdminHead,AdminPageLinks,ListFilter} from '@/components/admin-ui';
import {Badge,ButtonLink,Empty} from '@/components/ui';
import {first,type SearchParams} from '@/components/catalog-page';
import type {Product} from '@/lib/types';
const statuses={draft:'Brouillon',published:'Publié',archived:'Archivé'} as const;
export const metadata={title:'Produits'};
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 await requireAdmin();
 const params=await searchParams,q=first(params.q).trim().slice(0,100),state=first(params.statut),rawPage=Number(first(params.page));
 const page=Number.isInteger(rawPage)?Math.max(1,Math.min(10000,rawPage)):1;
 const status=Object.entries(statuses).find(([,value])=>value===state)?.[0]||'';
 const rows=all<Product&{stock:number;category_name:string}>(`SELECT p.*,c.name AS category_name,
 (SELECT COALESCE(SUM(stock),0) FROM variants WHERE product_id=p.id AND active=1) AS stock
 FROM products p JOIN categories c ON c.id=p.category WHERE (instr(lower(p.name),lower(?))>0 OR instr(lower(p.brand),lower(?))>0) AND (?='' OR p.status=?) ORDER BY p.updated DESC LIMIT 31 OFFSET ?`,q,q,status,status,(page-1)*30);
 return <><AdminHead title="Produits"><ButtonLink href="/admin/produits/nouveau">Nouveau produit</ButtonLink></AdminHead><section className="panel admin-section">
 <ListFilter action="/admin/produits" q={q} state={state} states={Object.values(statuses)}/>
 {rows.length?<div className="table-wrap"><table><thead><tr><th>Produit</th><th>Catégorie</th><th>Stock</th><th>Statut</th></tr></thead><tbody>{rows.slice(0,30).map(p=><tr key={p.id}><td><Link className="row-link" href={'/admin/produits/'+p.id}>{p.name}</Link></td><td>{p.category_name}</td><td>{p.stock}</td><td><Badge state={statuses[p.status as keyof typeof statuses]}/></td></tr>)}</tbody></table></div>:<Empty title="Aucun produit."/>}
 <AdminPageLinks path="/admin/produits" page={page} more={rows.length>30} q={q} state={state}/></section></>;
}
