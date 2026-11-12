import {notFound} from 'next/navigation';
import Link from 'next/link';
import {lookup,history} from '@/lib/access';
import {orderItems} from '@/lib/orders';
import {get} from '@/lib/db';
import {settings} from '@/lib/catalog';
import {Badge} from '@/components/ui';
import {CopyLink} from '@/components/customer-forms';
import {ActionForm} from '@/components/forms';
import {ClearCart} from '@/components/cart';
import {respondQuote} from '@/app/actions';
import {formatDate,money} from '@/lib/shared';
import {privateMetadata} from '@/lib/seo';
import {hasCapability,tracking} from '@/lib/security';
import type {Order,Details} from '@/lib/types';
export const metadata={title:'Suivi',referrer:'no-referrer',...privateMetadata};
export default async function Page({params,searchParams}:{params:Promise<{ref:string}>;searchParams:Promise<{t?:string;new?:string}>}){
 const {ref}=await params,query=await searchParams,token=typeof query.t==='string'?query.t:'';
 const record=await lookup(ref,token);
 if(!record)notFound();
 const order='total' in record?record:undefined,req='kind' in record?record:undefined;
 const details=req?JSON.parse(req.details) as Details:undefined;
 const validToken=hasCapability(req?.kind||'order',record.id,token)?token:'';
 const fresh=query.new==='1'&&!!validToken;
 const converted=req?.kind==='product'?get<Order>('SELECT * FROM orders WHERE request_id=?',req.id):undefined;
 const pickup=order?.delivery==='pickup'?settings().address:'';
 return <div className="shell page narrow">
  {order&&fresh&&<ClearCart reference={ref}/>}
  <span className="eyebrow">{fresh?'ENREGISTRÉ':req?.kind==='repair'?'SUIVI RÉPARATION':req?'SUIVI DEMANDE':'SUIVI COMMANDE'}</span>
  <h1>{fresh?(order?'Commande reçue.':'Demande reçue.'):(order?'Votre commande':req?.kind==='repair'?'Votre réparation':'Votre demande')}</h1>
  <section className="panel tracking-summary"><div className="section-head"><div><span className="muted">Référence</span><strong className="reference">{ref}</strong></div><Badge state={record.state}/></div>
   {validToken&&<div className="actions"><CopyLink/></div>}{fresh&&<p className="muted">Conservez ce lien privé pour revenir ici.</p>}
   {order&&<><div className="summary">{orderItems(order.id).map((item,i)=><div key={i}><span>{item.title} · {item.variant||'Standard'} × {item.quantity}</span><strong>{money(item.price*item.quantity)}</strong></div>)}<div><span>Frais de livraison</span><strong>{money(order.shipping)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(order.total)}</strong></div></div>
   <p className="muted">{order.payment}{pickup?' · '+pickup:''}</p></>}
   {details&&<p>{details.product||[details.brand,details.model,details.issue].filter(Boolean).join(' · ')}</p>}
   {converted&&<Link className="button secondary" href={validToken?tracking('order',converted.id,converted.ref):'/suivi/'+converted.ref}>Voir la commande</Link>}
  </section>
  {req&&req.quote!==null&&!['Nouvelle','Diagnostic','Reçue','En étude'].includes(req.state)&&<section className="panel account-section"><h2>Devis · {money(req.quote)}</h2>{req.quote_note&&<p className="preformatted">{req.quote_note}</p>}
   {req.decision&&<Badge state={req.decision==='accepted'?'Acceptée':'Refusée'}/>}
   {req.state==='Devis'&&!req.decision&&<div className="quote-actions">{[['yes','Accepter le devis'],['no','Refuser']].map(([decision,label])=><ActionForm key={decision} action={respondQuote} label={label}><input type="hidden" name="ref" value={ref}/><input type="hidden" name="token" value={validToken}/><input type="hidden" name="decision" value={decision}/><input type="hidden" name="version" value={req.updated}/></ActionForm>)}</div>}
  </section>}
  <section className="panel account-section"><h2>Historique</h2><ol className="timeline">{history(record.id).map((h,i)=><li key={i}><strong>{h.state}</strong><time dateTime={h.created}>{formatDate(h.created)}</time>{h.note&&<p>{h.note}</p>}</li>)}</ol></section>
 </div>;
}
