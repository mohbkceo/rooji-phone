import Link from 'next/link';
import Form from 'next/form';
import {requireAdmin} from '@/lib/auth';
import {all} from '@/lib/db';
import {AdminHead} from '@/components/admin-ui';
import {Empty} from '@/components/ui';
import {first,type SearchParams} from '@/components/catalog-page';
export const metadata={title:'Clients'};
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 await requireAdmin();
 const q=first((await searchParams).q).trim().slice(0,100);
 const clients=all<{name:string;phone:string;orders:number;repairs:number;requests:number}>(`
 WITH activity AS (SELECT name,phone,'order' AS kind,created FROM orders UNION ALL SELECT name,phone,kind,created FROM requests UNION ALL SELECT name,phone,'account',created FROM users WHERE role='customer'),
 ranked AS (SELECT *,ROW_NUMBER() OVER (PARTITION BY phone ORDER BY created DESC,name) AS newest FROM activity)
 SELECT MAX(CASE WHEN newest=1 THEN name END) AS name,phone,SUM(kind='order') AS orders,SUM(kind='repair') AS repairs,SUM(kind='product') AS requests
 FROM ranked GROUP BY phone HAVING instr(lower(name),lower(?))>0 OR instr(phone,?)>0 ORDER BY MAX(created) DESC LIMIT 100`,q,q);
 return <><AdminHead title="Clients"/><div className="panel admin-section"><Form className="list-filter" action="/admin/clients"><fieldset className="contents" key={q}><legend className="sr-only">Rechercher un client</legend><input name="q" type="search" aria-label="Nom ou téléphone" maxLength={100} defaultValue={q} placeholder="Nom ou téléphone"/><button className="button secondary">Rechercher</button>{q&&<Link className="text-link" href="/admin/clients">Effacer la recherche</Link>}</fieldset></Form>
 {clients.length?<div className="table-wrap" role="region" aria-label="Clients et activité" tabIndex={0}><table><thead><tr><th>Client</th><th>Téléphone</th><th>Commandes</th><th>Réparations</th><th>Demandes</th></tr></thead><tbody>{clients.map(c=><tr key={c.phone}><td>{c.name}</td><td><a className="row-link" href={'tel:'+c.phone}>{c.phone}</a></td><td><Link className="row-link" href={'/admin/commandes?q='+encodeURIComponent(c.phone)}>{c.orders}</Link></td><td><Link className="row-link" href={'/admin/reparations?q='+encodeURIComponent(c.phone)}>{c.repairs}</Link></td><td><Link className="row-link" href={'/admin/demandes?q='+encodeURIComponent(c.phone)}>{c.requests}</Link></td></tr>)}</tbody></table></div>:<Empty title="Aucun client trouvé."/>}</div></>;
}
