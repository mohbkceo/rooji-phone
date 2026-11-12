import Link from 'next/link';
import {redirect} from 'next/navigation';
import {all} from '@/lib/db';
import {currentUser} from '@/lib/auth';
import {logout,updateProfile} from '@/app/actions';
import {ActionForm,Field} from '@/components/forms';
import {Badge,Empty} from '@/components/ui';
import {privateMetadata} from '@/lib/seo';
import {formatDate} from '@/lib/shared';
import type {Order,RequestRecord} from '@/lib/types';
export const metadata={title:'Mon compte',...privateMetadata};
export default async function Page(){
 const user=await currentUser();
 if(!user)redirect('/connexion');
 const orders=all<Order>('SELECT * FROM orders WHERE user_id=? ORDER BY created DESC',user.id);
 const requests=all<RequestRecord>('SELECT * FROM requests WHERE user_id=? ORDER BY created DESC',user.id);
 return <div className="shell page"><div className="section-head"><h1>Mon compte</h1><form action={logout}><button className="button secondary">Se déconnecter</button></form></div>
 <div className="account-grid"><div>{[['Commandes',orders],['Réparations',requests.filter(r=>r.kind==='repair')],['Demandes produits',requests.filter(r=>r.kind==='product')]].map(([label,rows])=><section className="panel account-section" key={String(label)}><h2>{String(label)}</h2>{(rows as (Order|RequestRecord)[]).length?(rows as (Order|RequestRecord)[]).map(r=><Link className="record-row" key={r.id} href={'/suivi/'+r.ref}><span><strong>{r.ref}</strong><small>{formatDate(r.created)}</small></span><Badge state={r.state}/></Link>):<Empty title="Aucun élément."/>}</section>)}</div>
 <section className="panel"><h2>Profil</h2><p className="muted">{user.email}</p><ActionForm action={updateProfile}><Field label="Nom"><input name="name" required maxLength={100} defaultValue={user.name}/></Field><Field label="Téléphone"><input name="phone" type="tel" required maxLength={30} defaultValue={user.phone}/></Field></ActionForm></section></div></div>;
}
