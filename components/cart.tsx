'use client';
import {createContext,useContext,useEffect,useState,useSyncExternalStore} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ShoppingBag,Trash2} from 'lucide-react';
import {money,wilayas,type CartLine} from '@/lib/shared';
import {quoteCart,placeOrder} from '@/app/actions';
import {ActionForm,Field} from './forms';
import {Photo,Empty,ButtonLink} from './ui';

const storageKey='roudji-cart-v1', event='roudji-cart-change';
const empty:CartLine[]=[];
let cachedRaw:string|null=null,cached:CartLine[]=empty;
function snapshot(){
 try{
  const raw=localStorage.getItem(storageKey);
  if(raw!==cachedRaw){
   cachedRaw=raw;
   const value=JSON.parse(raw??'[]');
   cached=Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&Number.isInteger(x.qty)):empty;
  }
 }catch{cached=empty;}
 return cached;
}
function listen(fn:()=>void){window.addEventListener(event,fn);window.addEventListener('storage',fn);return()=>{window.removeEventListener(event,fn);window.removeEventListener('storage',fn);};}
const write=(lines:CartLine[])=>{localStorage.setItem(storageKey,JSON.stringify(lines));window.dispatchEvent(new Event(event));};
const CartContext=createContext(empty);
export function CartProvider({children}:{children:React.ReactNode}){
 const items=useSyncExternalStore(listen,snapshot,()=>empty);
 return <CartContext.Provider value={items}>{children}</CartContext.Provider>;
}
export function addToCart(line:CartLine,max:number) {
 const items=snapshot(), previous=items.find(p=>p.id===line.id);
 const qty=Math.min(20,max,line.qty+(previous?.qty??0));
 write(previous?items.map(p=>p.id===line.id?{...line,qty}:p):[...items,{...line,qty}]);
}
export function CartIcon(){
 const count=useContext(CartContext).reduce((sum,line)=>sum+line.qty,0);
 return <Link href="/panier" className="icon-link relative" aria-label={'Panier, '+count+' article(s)'}><ShoppingBag size={20} aria-hidden="true"/>{count>0&&<span className="absolute top-0 right-0 min-w-4 rounded-full bg-brand px-1 text-center text-[0.625rem] leading-4 font-bold text-white" aria-hidden="true">{count}</span>}</Link>;
}
export function CartView(){
 const items=useContext(CartContext);
 if(!items.length)return <Empty title="Votre panier est vide."><ButtonLink href="/catalogue">Voir le catalogue</ButtonLink></Empty>;
 return <div className="cart-grid"><div className="panel">{items.map(line=><article className="grid grid-cols-[2.75rem_minmax(0,1fr)_3.25rem_2.75rem] items-center gap-2 border-b border-line py-3 text-sm last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)_4rem_2.75rem] sm:gap-3" key={line.id}>
  <div className="aspect-square overflow-hidden rounded-control bg-surface [&_span]:hidden"><Photo asset={line.image||''} alt="" sizes="(max-width: 639px) 44px, 64px" className="size-full object-contain"/></div>
  <div className="min-w-0 wrap-anywhere"><Link className="inline-flex min-h-6 items-center hover:underline" href={'/produit/'+line.slug}><strong>{line.name}</strong></Link><p className="m-0 text-xs text-muted">{line.label}</p><span className="text-xs text-muted">{money(line.price)}</span></div>
  <label className="text-xs text-muted">Qté <input className="px-1.5 sm:px-2" type="number" min="1" max="20" value={line.qty} aria-label={'Quantité de '+line.name} onChange={e=>{
   const qty=e.currentTarget.valueAsNumber;
   if(Number.isInteger(qty)&&qty>=1&&qty<=20)write(items.map(p=>p.id===line.id?{...p,qty}:p));
  }}/></label>
  <button className="icon-link" aria-label={'Retirer '+line.name} onClick={()=>write(items.filter(p=>p.id!==line.id))}><Trash2 size={19}/></button>
 </article>)}</div><div className="panel summary"><h2>Récapitulatif</h2><div><span>Sous-total estimé</span><strong>{money(items.reduce((sum,p)=>sum+p.qty*p.price,0))}</strong></div><ButtonLink href="/commande">Commander</ButtonLink></div></div>;
}
export function Checkout({pickup,delivery,fee,identity,keyValue,address}:{pickup:boolean;delivery:boolean;fee:number;identity?:{name:string;phone:string};keyValue:string;address:string}){
 const items=useContext(CartContext);
 const [method,setMethod]=useState<'delivery'|'pickup'>(pickup?'pickup':'delivery');
 const [retry,setRetry]=useState(0);
 const [quote,setQuote]=useState<{signature:string;value:Awaited<ReturnType<typeof quoteCart>>}>();
 const cart=JSON.stringify(items.map(p=>({id:p.id,qty:p.qty})));
 const signature=cart+':'+retry;
 useEffect(()=>{
  if(cart==='[]')return;
  let active=true;
  quoteCart(JSON.parse(cart)).then(value=>{if(active)setQuote({signature,value});},()=>{if(active)setQuote({signature,value:{error:'Vérification indisponible.'}});});
  return()=>{active=false;};
 },[cart,signature]);
 const result=quote?.signature===signature?quote.value:undefined;
 if(!items.length)return <Empty title="Votre panier est vide."><ButtonLink href="/catalogue">Voir le catalogue</ButtonLink></Empty>;
 if(!pickup&&!delivery)return <Empty title="La commande est momentanément indisponible."><ButtonLink href="/panier">Retour au panier</ButtonLink></Empty>;
 if(!result || !('lines' in result))return <Empty title={result?.error||'Vérification du panier…'}>{result?.error&&<><button className="button secondary" onClick={()=>setRetry(retry+1)}>Réessayer</button><Link href="/panier">Modifier le panier</Link></>}</Empty>;
 const shipping=method==='delivery'?fee:0,total=result.subtotal+shipping;
 return <div className="cart-grid">
  <div className="panel"><ActionForm action={placeOrder} label="Confirmer la commande">
   <input type="hidden" name="cart" value={cart}/><input type="hidden" name="expectedTotal" value={total}/><input type="hidden" name="key" value={keyValue}/>
   <div className="form-grid"><Field label="Nom"><input name="name" autoComplete="name" required maxLength={100} defaultValue={identity?.name}/></Field><Field label="Téléphone"><input name="phone" type="tel" autoComplete="tel" required maxLength={30} defaultValue={identity?.phone}/></Field></div>
   <Field label="Remise"><select name="delivery" value={method} onChange={e=>setMethod(e.target.value==='pickup'?'pickup':'delivery')}>{pickup&&<option value="pickup">Retrait en boutique</option>}{delivery&&<option value="delivery">Livraison</option>}</select></Field>
   {method==='delivery'?<><div className="form-grid"><Field label="Wilaya"><select name="wilaya" required defaultValue=""><option value="" disabled>Choisir</option>{wilayas.map(w=><option key={w}>{w}</option>)}</select></Field><Field label="Commune"><input name="commune" required maxLength={100}/></Field></div><Field label="Adresse"><input name="address" autoComplete="street-address" required maxLength={200}/></Field></>:address&&<p className="muted">{address}</p>}
   <Field label="Note (facultatif)"><textarea name="note" maxLength={350} rows={2}/></Field>
  </ActionForm></div>
  <div className="panel summary"><h2>Récapitulatif</h2>{result.lines.map(l=><div key={l.id}><span>{l.name} × {l.qty}</span><strong>{money(l.price*l.qty)}</strong></div>)}<div><span>Frais de livraison</span><strong>{money(shipping)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><p className="muted">{method==='delivery'?'Paiement à la livraison':'Paiement au retrait'}</p><button type="button" className="bare" onClick={()=>setRetry(retry+1)}>Actualiser les prix</button></div>
 </div>;
}
export function ClearCart({reference}:{reference:string}){
 useEffect(()=>{
  const key='roudji-cleared:'+reference;
  if(sessionStorage.getItem(key))return;
  sessionStorage.setItem(key,'1');write([]);
 },[reference]);
 return null;
}
export function BuyButtons({line,max}:{line:CartLine;max:number}){
 const router=useRouter(); const [notice,setNotice]=useState('');
 return <><div className="actions"><button className="button primary" disabled={max<1} onClick={()=>{addToCart(line,max);setNotice('Article ajouté au panier.');}}>Ajouter au panier</button><button className="button secondary" disabled={max<1} onClick={()=>{addToCart(line,max);router.push('/commande');}}>Commander</button></div><div className="mt-1 min-h-6 text-sm text-green-900" role="status">{notice}</div></>;
}
