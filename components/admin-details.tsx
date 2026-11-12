import Link from 'next/link';
import {notFound} from 'next/navigation';
import {adminConvert,adminOrder,adminRequest} from '@/app/actions';
import {history} from '@/lib/access';
import {get} from '@/lib/db';
import {orderItems,orderOptions} from '@/lib/orders';
import {requestOptions} from '@/lib/requests';
import {asDzd,formatDate,money,requestStates} from '@/lib/shared';
import {tracking} from '@/lib/security';
import type {Details,Order,RequestRecord} from '@/lib/types';
import {ActionForm,Field} from './forms';
import {Badge,TextLink} from './ui';
import {AdminHead,AdminSection,HistoryList,Saved} from './admin-ui';

export function OrderDetail({id,saved}:{id:string;saved?:string}){
 const o=get<Order>('SELECT * FROM orders WHERE id=?',id);
 if(!o)notFound();
 const track=tracking('order',o.id,o.ref);
 return <><TextLink href="/admin/commandes">Commandes</TextLink><AdminHead title={o.ref} eyebrow="COMMANDE"><Badge state={o.state}/></AdminHead><Saved show={saved}/>
 <div className="admin-columns detail-columns"><div><AdminSection title="Articles"><div className="table-wrap"><table><thead><tr><th>Produit</th><th>Qté</th><th>Total</th></tr></thead><tbody>{orderItems(id).map((i,index)=><tr key={index}><td>{i.title}{i.variant&&<small>{i.variant}</small>}</td><td>{i.quantity}</td><td>{money(i.price*i.quantity)}</td></tr>)}</tbody></table></div>
 <div className="summary"><div><span>Sous-total</span><strong>{money(o.subtotal)}</strong></div><div><span>Frais de livraison</span><strong>{money(o.shipping)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(o.total)}</strong></div></div></AdminSection>
 <AdminSection title="Client"><dl className="definition"><dt>Nom</dt><dd>{o.name}</dd><dt>Téléphone</dt><dd><a href={'tel:'+o.phone}>{o.phone}</a></dd><dt>Date</dt><dd>{formatDate(o.created)}</dd><dt>Mode de remise</dt><dd>{o.delivery==='delivery'?'Livraison':'Retrait en boutique'}</dd><dt>Paiement</dt><dd>{o.payment}</dd>{o.address&&<><dt>Adresse</dt><dd>{[o.address,o.commune,o.wilaya].join(', ')}</dd></>}{o.note&&<><dt>Note client</dt><dd>{o.note}</dd></>}</dl><Link href={track} className="text-link">Lien privé du client</Link></AdminSection></div>
 <div><AdminSection title="Mettre à jour"><ActionForm action={adminOrder}><input type="hidden" name="id" value={o.id}/><input type="hidden" name="version" value={o.updated}/><Field label="Statut"><select name="state" defaultValue={o.state}>{orderOptions(o).map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Message visible par le client (facultatif)"><input name="update" maxLength={300}/></Field><Field label="Note interne"><textarea name="internal" rows={3} maxLength={2000} defaultValue={o.internal}/></Field></ActionForm></AdminSection>
 <AdminSection title="Historique"><HistoryList rows={history(o.id)}/></AdminSection></div></div></>;
}

export function RequestDetail({id,kind,saved}:{id:string;kind:'repair'|'product';saved?:string}){
 const r=get<RequestRecord>('SELECT * FROM requests WHERE id=? AND kind=?',id,kind);
 if(!r)notFound();
 const repair=kind==='repair',d=JSON.parse(r.details) as Details;
 const parent=repair?'reparations':'demandes',images=JSON.parse(r.images) as string[];
 const quoteLocked=r.decision==='accepted'||['En réparation','Prête','Terminée','Annulée','Refusée'].includes(r.state);
 const order=get<Order>('SELECT * FROM orders WHERE request_id=?',id);
 return <><TextLink href={'/admin/'+parent}>{repair?'Réparations':'Demandes'}</TextLink><AdminHead title={r.ref} eyebrow={repair?'RÉPARATION':'DEMANDE PRODUIT'}><Badge state={r.state}/></AdminHead><Saved show={saved}/>
 <div className="admin-columns detail-columns"><div><AdminSection title={repair?[d.brand,d.model].join(' '):d.product||'Produit'}>
 <dl className="definition">{repair?<><dt>Problème</dt><dd>{d.issue}</dd><dt>Dépôt</dt><dd>{d.arrangement}</dd></>:<><dt>Variante</dt><dd>{d.variant||'—'}</dd><dt>Quantité</dt><dd>{d.quantity}</dd></>}{d.description&&<><dt>Détails</dt><dd>{d.description}</dd></>}</dl>
 {images.length>0&&<div className="admin-gallery">{images.map((asset,i)=><a key={asset} href={'/api/photo/'+r.ref+'/'+asset} target="_blank" rel="noreferrer"><img src={'/api/photo/'+r.ref+'/'+asset} alt={'Photo du client '+(i+1)} loading="lazy"/></a>)}</div>}</AdminSection>
 <AdminSection title="Client"><dl className="definition"><dt>Nom</dt><dd>{r.name}</dd><dt>Téléphone</dt><dd><a href={'tel:'+r.phone}>{r.phone}</a></dd><dt>Date</dt><dd>{formatDate(r.created)}</dd></dl><Link className="text-link" href={tracking(kind,r.id,r.ref)}>Lien privé du client</Link></AdminSection>
 {!repair&&r.state===requestStates[3]&&<AdminSection title="Créer une commande"><p className="muted">Le devis accepté devient une commande à retirer en boutique.</p><ActionForm action={adminConvert} label="Créer la commande"><input type="hidden" name="id" value={id}/></ActionForm></AdminSection>}
 {order&&<AdminSection title="Commande liée"><TextLink href={'/admin/commandes/'+order.id}>{order.ref}</TextLink></AdminSection>}
 </div><div><AdminSection title="Mettre à jour"><ActionForm action={adminRequest}><input type="hidden" name="id" value={id}/><input type="hidden" name="version" value={r.updated}/>
 <Field label="Statut"><select name="state" defaultValue={r.state}>{requestOptions(r).map(s=><option key={s}>{s}</option>)}</select></Field>
 <Field label="Devis total (DA)"><input name="quote" inputMode="decimal" defaultValue={asDzd(r.quote)} readOnly={quoteLocked}/></Field>
 <Field label="Détails du devis (visibles par le client)"><textarea name="quoteNote" rows={2} maxLength={450} defaultValue={r.quote_note} readOnly={quoteLocked}/></Field>
 {r.decision&&<p><Badge state={r.decision==='accepted'?'Acceptée':'Refusée'}/></p>}
 {repair&&<><Field label="Diagnostic interne"><textarea name="diagnostic" rows={2} maxLength={2000} defaultValue={r.diagnostic}/></Field><Field label="Technicien (facultatif)"><input name="technician" maxLength={100} defaultValue={r.technician}/></Field></>}
 <Field label="Note interne"><textarea name="internal" rows={2} maxLength={2000} defaultValue={r.internal}/></Field><Field label="Message visible par le client (facultatif)"><input name="update" maxLength={300}/></Field>
 </ActionForm></AdminSection><AdminSection title="Historique"><HistoryList rows={history(id)}/></AdminSection></div></div></>;
}
