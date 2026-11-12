import Link from 'next/link';
import {Badge,Empty,TextLink} from './ui';
import {formatDate,money} from '@/lib/shared';
import type {Details,History,Order,RequestRecord} from '@/lib/types';

export function AdminHead({title,eyebrow='ADMINISTRATION',children}:{title:string;eyebrow?:string;children?:React.ReactNode}){
 return <header className="admin-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>{children}</header>;
}
export function Saved({show}:{show?:string}){return show==='1'?<p className="form-success" role="status">Enregistré.</p>:null;}
export function OrdersTable({orders,empty='Aucune commande.'}:{orders:Order[];empty?:string}){
 if(!orders.length)return <Empty title={empty}/>;
 return <div className="table-wrap"><table><thead><tr><th>Commande</th><th>Client</th><th>Total</th><th>Date</th><th>Statut</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><Link className="row-link" href={'/admin/commandes/'+o.id}>{o.ref}</Link></td><td>{o.name}</td><td>{money(o.total)}</td><td>{formatDate(o.created)}</td><td><Badge state={o.state}/></td></tr>)}</tbody></table></div>;
}
export function RequestsTable({records,kind}:{records:RequestRecord[];kind:'repair'|'product'}){
 if(!records.length)return <Empty title="Aucune demande."/>;
 const repair=kind==='repair';
 return <div className="table-wrap"><table><thead><tr><th>Référence</th><th>{repair?'Appareil':'Produit'}</th>{repair&&<th>Problème</th>}<th>Client</th><th>Date</th><th>Statut</th></tr></thead><tbody>{records.map(r=>{
  const d=JSON.parse(r.details) as Details;
  return <tr key={r.id}><td><Link className="row-link" href={'/admin/'+(repair?'reparations':'demandes')+'/'+r.id}>{r.ref}</Link></td><td>{repair?[d.brand,d.model].join(' '):d.product}</td>{repair&&<td>{d.issue}</td>}<td>{r.name}</td><td>{formatDate(r.created)}</td><td><Badge state={r.state}/></td></tr>;
 })}</tbody></table></div>;
}
export function HistoryList({rows}:{rows:History[]}){
 return <ol className="timeline">{rows.map((row,index)=><li key={index}><strong>{row.state}</strong><time dateTime={row.created}>{formatDate(row.created)}</time>{row.note&&<p>{row.note}</p>}</li>)}</ol>;
}
export function ListFilter({action,q,state,states}:{action:string;q:string;state:string;states:readonly string[]}){
 return <form className="list-filter" action={action}><input type="search" name="q" maxLength={100} defaultValue={q} placeholder="Rechercher" aria-label="Rechercher"/><select name="statut" defaultValue={state} aria-label="Statut"><option value="">Tous les statuts</option>{states.map(s=><option key={s}>{s}</option>)}</select><button className="button secondary">Filtrer</button></form>;
}
export function AdminPageLinks({path,page,more,q,state}:{path:string;page:number;more:boolean;q:string;state:string}){
 const href=(n:number)=>path+'?'+new URLSearchParams({page:String(n),...(q?{q}:{}),...(state?{statut:state}:{})});
 return page>1||more?<nav className="pagination" aria-label="Pagination">{page>1&&<Link href={href(page-1)}>Précédent</Link>}<span>Page {page}</span>{more&&<Link href={href(page+1)}>Suivant</Link>}</nav>:null;
}
export function AdminSection({title,href,children}:{title:string;href?:string;children:React.ReactNode}){
 return <section className="panel admin-section"><div className="section-head"><h2>{title}</h2>{href&&<TextLink href={href}>Tout voir</TextLink>}</div>{children}</section>;
}
