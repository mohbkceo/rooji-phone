'use server';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {z} from 'zod';
import {currentUser,requireAdmin,newSession,clearSession,throttle} from '@/lib/auth';
import {get,run} from '@/lib/db';
import {hashPassword,id,InputError,secret,timestamp,tracking,verifyPassword} from '@/lib/security';
import {checkout,pricedCart,updateOrder} from '@/lib/orders';
import {createRequest,repairForm,requestForm,decideQuote,updateRequest,convertRequest} from '@/lib/requests';
import {contact,email,json,object,optional,parse,priceInput,required} from '@/lib/validation';
import {discardImage,uploadImage} from '@/lib/media';
import {lookup} from '@/lib/access';
import {saveCategory,saveProduct,saveSettings} from '@/lib/admin';
import type {User} from '@/lib/types';
import type {ActionState} from '@/lib/shared';

const password=z.string().min(1).max(160);
const credentials=z.object({email,password});
const signupSchema=credentials.extend({name:required(100),phone:contact.shape.phone,password:z.string().min(10,'10 caractères minimum.').max(160)});
const generic='Une erreur est survenue. Réessayez.';
const errorState=(error:unknown)=>{
 if(error instanceof InputError)return {error:error.message};
 console.error('Action failed:',error instanceof Error?error.name:'unknown');
 return {error:generic};
};
export async function login(admin:boolean,_state:ActionState,form:FormData):Promise<ActionState> {
 try {
  const input=parse(credentials,object(form));
  await throttle('auth',input.email);
  const user=get<User>('SELECT * FROM users WHERE email=?',input.email);
  if(!await verifyPassword(input.password,user?.password)||!user||admin&&user.role!=='admin')throw new InputError('Identifiants invalides.');
  await newSession(user);
  admin=user.role==='admin';
 }catch(error){return errorState(error);}
 redirect(admin?'/admin':'/compte');
}
export async function signup(_state:ActionState,form:FormData):Promise<ActionState> {
 try {
  const input=parse(signupSchema,object(form));
  await throttle('auth',input.email);
  if(get('SELECT id FROM users WHERE email=?',input.email))throw new InputError('Impossible de créer ce compte. Essayez de vous connecter.');
  const user:User={id:id(),email:input.email,name:input.name,phone:input.phone,role:'customer',password:await hashPassword(input.password)};
  run('INSERT INTO users(id,email,password,role,name,phone,created) VALUES(?,?,?,?,?,?,?)',user.id,user.email,user.password,user.role,user.name,user.phone,timestamp());
  await newSession(user);
 }catch(error){return errorState(error);}
 redirect('/compte');
}
export async function logout() {await clearSession();redirect('/');}
export async function updateProfile(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await currentUser();
 if(!user)redirect('/connexion');
 try{
  const data=parse(contact,object(form));
  run('UPDATE users SET name=?,phone=? WHERE id=?',data.name,data.phone,user.id);
  return {success:'Profil enregistré.'};
 }catch(error){return errorState(error);}
}
export async function quoteCart(cart:unknown) {
 try { const result=pricedCart(cart); return {lines:result.lines.map(({stock:_,...line})=>line),subtotal:result.subtotal}; }
 catch(error){return errorState(error);}
}
export async function placeOrder(_state:ActionState,form:FormData):Promise<ActionState> {
 let url:string;
 try {
  secret();
  const values=object(form),contactInfo=parse(contact,values);
  await throttle('order',contactInfo.phone);
  const user=await currentUser();
  const order=checkout(json(values.cart),{...values,expectedTotal:Number(values.expectedTotal)},user?.id??null);
  url=tracking('order',order.id,order.ref)+'&new=1';
 }catch(error){return errorState(error);}
 redirect(url);
}
export async function submitRequest(kind:'repair'|'product',_state:ActionState,form:FormData):Promise<ActionState> {
 let url:string;
 const assets:string[]=[];
 try {
  secret();
  const values=object(form);
  const input=kind==='repair'?parse(repairForm,values):parse(requestForm,values);
  await throttle('request',input.phone);
  const user=await currentUser();
  const files=form.getAll('photos').filter((value):value is File=>value instanceof File&&value.size>0);
  if(files.length>(kind==='repair'?3:1) || files.reduce((size,f)=>size+f.size,0)>16*1024*1024)throw new InputError('Trop d’images (16 Mo au total).');
  for(const file of files)assets.push(await uploadImage(file,'private'));
  const record=createRequest(kind,input,assets,user?.id??null);
  url=tracking(kind,record.id,record.ref)+'&new=1';
 }catch(error){
  await Promise.allSettled(assets.map(discardImage));
  return errorState(error);
 }
 redirect(url);
}
export async function respondQuote(_state:ActionState,form:FormData):Promise<ActionState> {
 let url:string;
 try {
  const data=parse(z.object({ref:required(25),token:optional(70),version:required(60),decision:z.enum(['yes','no'])}),object(form));
  const record=await lookup(data.ref,data.token);
  if(!record||!('kind' in record))throw new InputError('Demande introuvable.');
  decideQuote(record.id,data.decision==='yes',data.version);
  url='/suivi/'+data.ref+(data.token?'?t='+encodeURIComponent(data.token):'');
 }catch(error){return errorState(error);}
 redirect(url);
}
export async function adminProduct(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await requireAdmin();
 let productId:string;
 try{
  const raw=object(form);
  productId=saveProduct(user.id,{...raw,featured:raw.featured==='on',images:json(raw.images),variants:json(raw.variants),stocks:json(raw.stocks)});
 }catch(error){return errorState(error);}
 revalidatePath('/', 'layout');
 redirect('/admin/produits/'+productId+'?saved=1');
}
export async function adminSettings(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await requireAdmin();
 try {
  const raw=object(form);
  saveSettings(user.id,{...raw,pickup:raw.pickup==='on',delivery:raw.delivery==='on'});
  revalidatePath('/', 'layout');
  return {success:'Paramètres enregistrés.'};
 }catch(error){return errorState(error);}
}
export async function adminCategory(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await requireAdmin();
 try {saveCategory(user.id,object(form));revalidatePath('/', 'layout');return {success:'Catégorie enregistrée.'};}
 catch(error){return errorState(error);}
}
export async function adminOrder(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await requireAdmin();
 let orderId:string;
 try {
  const data=parse(z.object({id:required(32),state:required(30),version:required(60),internal:optional(2000),update:optional(300)}),object(form));
  updateOrder(user.id,data.id,data.state,data.internal,data.update,data.version);orderId=data.id;
 }catch(error){return errorState(error);}
 redirect('/admin/commandes/'+orderId+'?saved=1');
}
export async function adminRequest(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await requireAdmin();
 let url:string;
 try {
  const data=parse(z.object({id:required(32),state:required(30),version:required(60),quote:z.union([z.literal('').transform(()=>null),priceInput]),
   quoteNote:optional(450),diagnostic:optional(2000),technician:optional(100),internal:optional(2000),update:optional(300)}),object(form));
  updateRequest(user.id,data.id,data);
  const kind=get<{kind:string}>('SELECT kind FROM requests WHERE id=?',data.id)?.kind;
  url='/admin/'+(kind==='repair'?'reparations':'demandes')+'/'+data.id+'?saved=1';
 }catch(error){return errorState(error);}
 redirect(url);
}
export async function adminConvert(_state:ActionState,form:FormData):Promise<ActionState> {
 const user=await requireAdmin();
 let orderId:string;
 try {orderId=convertRequest(user.id,parse(required(32),form.get('id'))).id;}
 catch(error){return errorState(error);}
 redirect('/admin/commandes/'+orderId+'?saved=1');
}
