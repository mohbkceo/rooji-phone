import {z} from 'zod';
import {all,get,run,transaction} from './db.ts';
import {settings} from './catalog.ts';
import {digest,id,InputError,reference,timestamp} from './security.ts';
import {contact,optional,parse,positiveInteger,required} from './validation.ts';
import {wilayas} from './shared.ts';
import type {Item,Order} from './types.ts';

const cartSchema=z.array(z.object({id:z.string().regex(/^[a-f0-9]{32}$/),qty:positiveInteger(20)})).min(1).max(30).refine(lines=>new Set(lines.map(l=>l.id)).size===lines.length);
const checkoutSchema=contact.extend({delivery:z.enum(['delivery','pickup']),wilaya:optional(60),commune:optional(100),
 address:optional(200),note:optional(350),key:z.string().regex(/^[a-f0-9-]{36}$/),expectedTotal:z.number().int().nonnegative()});
type CartInput=z.infer<typeof cartSchema>;
type VariantLine={id:string;name:string;label:string;slug:string;price:number;stock:number;image:string};
export function logHistory(recordId:string,state:string,note='',at=timestamp()) {
 run('INSERT INTO history(record_id,state,note,created) VALUES(?,?,?,?)',recordId,state,note,at);
}
export function audit(actor:string,action:string,recordId:string) {
 run('INSERT INTO audit(actor,action,record_id,created) VALUES(?,?,?,?)',actor,action,recordId,timestamp());
}
export function pricedCart(raw:unknown) {
 const cart=parse(cartSchema,raw);
 const lines=cart.map(line=>{
  const row=get<VariantLine>(`SELECT v.id,p.name,v.label,p.slug,COALESCE(v.sale,v.price) AS price,v.stock,
     COALESCE(NULLIF(v.image,''),json_extract(p.images,'$[0]'),'') AS image
    FROM variants v JOIN products p ON p.id=v.product_id WHERE v.id=? AND v.active=1 AND p.status='published'`,line.id);
  if(!row || row.stock<line.qty)throw new InputError(row?row.name+' : stock insuffisant.':'Un article n’est plus disponible.');
  return {...row,qty:line.qty};
 });
 return {lines,subtotal:lines.reduce((sum,line)=>sum+line.price*line.qty,0)};
}
export function checkout(rawCart:unknown,rawContact:unknown,userId:string|null) {
 const form=parse(checkoutSchema,rawContact);
 const cart=parse(cartSchema,rawCart);
 const fingerprint=digest(JSON.stringify([userId,form,cart]));
 return transaction(()=>{
  const prior=get<Order>('SELECT * FROM orders WHERE idempotency=?',form.key);
  if(prior){
   if(prior.fingerprint!==fingerprint)throw new InputError('Cette tentative a déjà été utilisée. Actualisez la commande.');
   return prior;
  }
  const config=settings();
  if(!config[form.delivery])throw new InputError('Ce mode de remise est indisponible.');
  if(form.delivery==='delivery'&&(!wilayas.includes(form.wilaya)||!form.commune||!form.address))throw new InputError('Renseignez la wilaya, la commune et l’adresse.');
  const {lines,subtotal}=pricedCart(cart);
  const shipping=form.delivery==='delivery'?config.deliveryFee:0;
  if(subtotal+shipping!==form.expectedTotal)throw new InputError('Le total a changé. Vérifiez votre panier avant de confirmer.');
  const at=timestamp(),orderId=id(),ref=reference('order');
  run(`INSERT INTO orders(id,ref,user_id,name,phone,delivery,payment,wilaya,commune,address,note,state,subtotal,shipping,total,idempotency,fingerprint,created,updated)
     VALUES(?,?,?,?,?,?,?,?,?,?,?,'Nouvelle',?,?,?,?,?,?,?)`,orderId,ref,userId,form.name,form.phone,form.delivery,form.delivery==='pickup'?'Au retrait':'À la livraison',
     form.delivery==='delivery'?form.wilaya:'',form.delivery==='delivery'?form.commune:'',form.delivery==='delivery'?form.address:'',form.note,
     subtotal,shipping,subtotal+shipping,form.key,fingerprint,at,at);
  for(const line of lines) {
   const changed=run('UPDATE variants SET stock=stock-? WHERE id=? AND stock>=?',line.qty,line.id,line.qty);
   if(!changed.changes)throw new InputError('Stock insuffisant.');
   run('INSERT INTO order_items VALUES(?,?,?,?,?,?)',orderId,line.id,line.name,line.label,line.price,line.qty);
  }
  logHistory(orderId,'Nouvelle','',at);
  return get<Order>('SELECT * FROM orders WHERE id=?',orderId)!;
 });
}
const transitions:Record<string,string[]>={'Nouvelle':['Confirmée','Annulée'],'Confirmée':['En préparation','Annulée'],'En préparation':['Expédiée','Livrée','Annulée'],'Expédiée':['Livrée','Annulée'],'Livrée':[],'Annulée':[]};
export function orderOptions(order:Order) {
 return [order.state,...(transitions[order.state]??[]).filter(state=>order.delivery==='pickup'?state!=='Expédiée':order.state!=='En préparation'||state!=='Livrée')];
}
export function updateOrder(actor:string,orderId:string,state:string,internal:string,update:string,version:string) {
 transaction(()=>{
  const order=get<Order>('SELECT * FROM orders WHERE id=?',orderId);
  if(!order || order.updated!==version || !orderOptions(order).includes(state))throw new InputError('Commande modifiée ou statut indisponible. Rechargez la page.');
  const at=timestamp(order.updated);
  if(state==='Annulée' && state!==order.state) {
   for(const item of orderItems(orderId))if(item.variant_id)run('UPDATE variants SET stock=stock+? WHERE id=?',item.quantity,item.variant_id);
  }
  run('UPDATE orders SET state=?,internal=?,updated=? WHERE id=?',state,internal,at,orderId);
  if(state!==order.state || update)logHistory(orderId,state,update,at);
  audit(actor,'order.update',orderId);
 });
}
export const orderItems=(orderId:string)=>all<Item>('SELECT * FROM order_items WHERE order_id=? ORDER BY rowid',orderId);
