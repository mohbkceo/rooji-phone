import {z} from 'zod';
import {get,run,transaction} from './db.ts';
import {id,InputError,reference,timestamp} from './security.ts';
import {audit,logHistory} from './orders.ts';
import {contact,optional,parse,positiveInteger,required} from './validation.ts';
import {issues} from './shared.ts';
import type {Details,Order,RequestRecord} from './types.ts';
export const repairForm=contact.extend({brand:required(60),model:required(80),issue:z.enum(issues),arrangement:z.enum(['Dépôt en boutique','À convenir']),description:optional(600)});
export const requestForm=contact.extend({product:required(110),variant:optional(100),quantity:positiveInteger(20),description:optional(600)});
export function createRequest(kind:RequestRecord['kind'],input:unknown,images:string[],userId:string|null) {
 const {name,phone,...details}=kind==='repair'?parse(repairForm,input):parse(requestForm,input);
 const recordId=id(),ref=reference(kind),at=timestamp(),state=kind==='repair'?'Nouvelle':'Reçue';
 transaction(()=>{
  run(`INSERT INTO requests(id,ref,kind,user_id,name,phone,state,details,images,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,
   recordId,ref,kind,userId,name,phone,state,JSON.stringify(details),JSON.stringify(images),at,at);
  logHistory(recordId,state,'',at);
 });
 return {id:recordId,ref};
}
const nextRepair:Record<string,string[]>={'Nouvelle':['Diagnostic','Annulée'],'Diagnostic':['Devis','Annulée'],'Devis':['En réparation','Annulée'],'En réparation':['Prête','Annulée'],'Prête':['Terminée'],'Terminée':[],'Annulée':[]};
const nextRequest:Record<string,string[]>={'Reçue':['En étude','Devis','Refusée'],'En étude':['Devis','Refusée'],'Devis':['Refusée'],'Acceptée':[],'Refusée':[],'Terminée':[]};
export function requestOptions(record:RequestRecord) {
 return [record.state,...((record.kind==='repair'?nextRepair:nextRequest)[record.state]??[]).filter(state=>state!=='En réparation'||record.decision==='accepted')];
}
export type RequestUpdate={state:string;quote:number|null;quoteNote:string;diagnostic:string;technician:string;internal:string;update:string;version:string};
export function updateRequest(actor:string,recordId:string,form:RequestUpdate) {
 transaction(()=>{
  const record=get<RequestRecord>('SELECT * FROM requests WHERE id=?',recordId);
  if(!record || record.updated!==form.version || !requestOptions(record).includes(form.state))throw new InputError('Demande modifiée ou statut indisponible. Rechargez la page.');
  if(form.state==='Devis' && form.quote===null)throw new InputError('Renseignez le montant du devis.');
  const quoteChanged=form.quote!==record.quote||form.quoteNote!==record.quote_note;
  if(quoteChanged && (record.decision==='accepted'||['En réparation','Prête','Terminée','Annulée','Refusée'].includes(record.state)))throw new InputError('Le devis de cette demande est verrouillé.');
  const decision=quoteChanged?'':record.decision,at=timestamp(record.updated);
  run('UPDATE requests SET state=?,quote=?,quote_note=?,decision=?,diagnostic=?,technician=?,internal=?,updated=? WHERE id=?',
   form.state,form.quote,form.quoteNote,decision,form.diagnostic,form.technician,form.internal,at,recordId);
  if(form.state!==record.state||form.update||quoteChanged)logHistory(recordId,form.state,form.update,at);
  audit(actor,'request.update',recordId);
 });
}
export function decideQuote(recordId:string,accept:boolean,version:string) {
 transaction(()=>{
  const record=get<RequestRecord>('SELECT * FROM requests WHERE id=?',recordId);
  if(!record||record.state!=='Devis'||record.quote===null||record.decision||record.updated!==version)throw new InputError('Ce devis a changé ou a déjà été traité.');
  const state=record.kind==='product'?(accept?'Acceptée':'Refusée'):'Devis', at=timestamp(record.updated);
  run('UPDATE requests SET state=?,decision=?,updated=? WHERE id=?',state,accept?'accepted':'declined',at,recordId);
  logHistory(recordId,state,accept?'Devis accepté.':'Devis refusé.',at);
 });
}
export function convertRequest(actor:string,recordId:string) {
 return transaction(()=>{
  const record=get<RequestRecord>("SELECT * FROM requests WHERE id=? AND kind='product'",recordId);
  if(!record)throw new InputError('Demande introuvable.');
  const existing=get<Order>('SELECT * FROM orders WHERE request_id=?',recordId);
  if(existing)return existing;
  if(record.state!=='Acceptée'||record.quote===null||record.decision!=='accepted')throw new InputError('Le client doit accepter le devis.');
  const {product,variant,quantity=1}=JSON.parse(record.details) as Details;
  const orderId=id(),ref=reference('order'),at=timestamp(record.updated);
  run(`INSERT INTO orders(id,ref,user_id,request_id,name,phone,delivery,payment,wilaya,commune,address,note,state,subtotal,shipping,total,created,updated)
     VALUES(?,?,?,?,?,?,'pickup','Au retrait','','','','','Nouvelle',?,0,?,?,?)`,orderId,ref,record.user_id,record.id,record.name,record.phone,record.quote,record.quote,at,at);
  const base=Math.floor(record.quote/quantity), remainder=record.quote%quantity;
  if(quantity>remainder)run('INSERT INTO order_items VALUES(?,NULL,?,?,?,?)',orderId,product!,variant||'',base,quantity-remainder);
  if(remainder)run('INSERT INTO order_items VALUES(?,NULL,?,?,?,?)',orderId,product!,variant||'',base+1,remainder);
  run("UPDATE requests SET state='Terminée',updated=? WHERE id=?",at,recordId);
  logHistory(recordId,'Terminée','Commande créée.',at);
  logHistory(orderId,'Nouvelle','',at);
  audit(actor,'request.convert',recordId);
  return get<Order>('SELECT * FROM orders WHERE id=?',orderId)!;
 });
}
