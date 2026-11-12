import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {after,test} from 'node:test';
import {db,all,get,run} from '../lib/db';
import {checkout,orderItems,updateOrder} from '../lib/orders';
import {createRequest,updateRequest,requestOptions,decideQuote,convertRequest} from '../lib/requests';
import {analytics,rangeFor} from '../lib/analytics';
import {catalog,defaults,product} from '../lib/catalog';
import {saveProduct} from '../lib/admin';
import {uploadImage} from '../lib/media';
import {capability,hasCapability,hashPassword,id,rateLimit,timestamp,verifyPassword} from '../lib/security';
import type {Order,Product,RequestRecord,Variant} from '../lib/types';

const directory=mkdtempSync(join(tmpdir(),'roudji-tests-'));
process.env.DATA_DIR=directory;
process.env.APP_SECRET='secret-for-automated-tests-only-at-least-32';
const actor=id(),guest={name:'Client test',phone:'0550123456'};
run("INSERT INTO users(id,email,password,role,name,created) VALUES(?,?,?,'admin',?,?)",actor,'test@example.test','unused','Test',timestamp());
const fixture=(label:string,stock=1)=>{
 const productId=saveProduct(actor,{id:'',name:label,category:'smartphones',brand:'Test',description:'Données de test isolées.',status:'published',featured:false,
   images:[],variants:[{id:'',label:'Standard',price:'1000',sale:'900',stock:String(stock),image:'',color:'Bleu'}]});
 const variant=get<Variant>('SELECT * FROM variants WHERE product_id=?',productId)!;
 const item=get<Product>('SELECT * FROM products WHERE id=?',productId)!;
 return {item,variant};
};
const input=(amount=90000)=>({...guest,delivery:'pickup',key:randomUUID(),expectedTotal:amount});
const stock=(variantId:string)=>get<Variant>('SELECT * FROM variants WHERE id=?',variantId)?.stock;
const order=(id:string)=>get<Order>('SELECT * FROM orders WHERE id=?',id)!;
const request=(id:string)=>get<RequestRecord>('SELECT * FROM requests WHERE id=?',id)!;
const quote=(record:RequestRecord,state:string,amount:number|null)=>updateRequest(actor,record.id,{state,quote:amount,quoteNote:amount===null?'':'Devis de test',diagnostic:'',technician:'',internal:'Note réservée',update:'',version:record.updated});

after(()=>{db().close();rmSync(directory,{recursive:true,force:true});});

test('published products support real variant pricing and stock filters',()=>{
 const {item,variant}=fixture('Smartphone à rechercher');
 assert.equal(product(item.slug)?.variants[0].color,'Bleu');
 assert.equal(catalog({q:'à rechercher',category:'smartphones',brand:'test',min:88000,max:91000,stock:true}).total,1);
 assert.equal(catalog({q:'à rechercher',max:10000}).total,0);
 const saved=get<Product>('SELECT * FROM products WHERE id=?',item.id)!;
 saveProduct(actor,{id:item.id,version:saved.updated,name:item.name,category:item.category,brand:item.brand,description:item.description,status:'archived',featured:false,
  images:[],variants:[{id:variant.id,label:variant.label,price:'1000',sale:'900',stock:'1',image:''}]});
 assert.equal(product(item.slug),undefined);
});

test('guest checkout validates totals, decrements stock once, and returns idempotent retries',()=>{
 const {variant}=fixture('Commande invitée');
 const cart=[{id:variant.id,qty:1}];
 assert.throws(()=>checkout(cart,input(123),null),/total a changé/);
 assert.equal(stock(variant.id),1);
 const form=input(),result=checkout(cart,form,null);
 assert.equal(result.user_id,null);
 assert.equal(result.total,90000);
 assert.equal(stock(variant.id),0);
 assert.equal(checkout(cart,form,null).id,result.id);
 assert.throws(()=>checkout(cart,{...form,name:'Autre'},null),/déjà été utilisée/);
 assert.throws(()=>checkout(cart,input(),null),/stock insuffisant/);
 assert.equal(orderItems(result.id)[0].price,90000);
 updateOrder(actor,result.id,'Annulée','','',result.updated);
 assert.equal(stock(variant.id),1);
 const cancelled=order(result.id);
 updateOrder(actor,result.id,'Annulée','Suivi interne','',cancelled.updated);
 assert.equal(stock(variant.id),1);
});

test('cash on delivery requires an enabled method, a valid destination and the configured fee',()=>{
 const {variant}=fixture('Livraison test');
 const cart=[{id:variant.id,qty:1}];
 const form={...input(95000),delivery:'delivery',wilaya:'Alger',commune:'Alger-Centre',address:'Adresse fictive de test'};
 assert.throws(()=>checkout(cart,form,null),/mode de remise/);
 run("INSERT INTO settings(key,value) VALUES('store',?)",JSON.stringify({...defaults,delivery:true,deliveryFee:5000}));
 try {
  assert.throws(()=>checkout(cart,{...form,wilaya:'Invalide'},null),/Renseignez/);
  assert.throws(()=>checkout(cart,{...form,expectedTotal:90000},null),/total a changé/);
  const result=checkout(cart,form,null);
  assert.equal(result.payment,'À la livraison');
  assert.equal(result.shipping,5000);
  assert.equal(result.total,95000);
 }finally{run("DELETE FROM settings WHERE key='store'");}
});

test('an administrator cannot overwrite concurrent stock from a stale editor',()=>{
 const {item,variant}=fixture('Stock à jour',3);
 checkout([{id:variant.id,qty:1}],input(),null);
 const edits={id:item.id,version:item.updated,name:item.name,category:item.category,brand:item.brand,description:item.description,status:'published',featured:false,
  images:[],stocks:{[variant.id]:3},variants:[{id:variant.id,label:variant.label,price:'1000',sale:'900',stock:'5',image:''}]};
 assert.throws(()=>saveProduct(actor,edits),/stock a changé/);
 saveProduct(actor,{...edits,variants:[{...edits.variants[0],stock:'3'}]});
 assert.equal(stock(variant.id),2);
});

test('two simultaneous checkout processes cannot oversell a single item',async ()=>{
 const {variant}=fixture('Dernière unité');
 const code=`
 import {checkout} from './lib/orders.ts';
 try { checkout(JSON.parse(process.argv[1]),JSON.parse(process.argv[2]),null); console.log('PLACED'); }
 catch(error) { if(/stock insuffisant/.test(error.message)) console.log('OUT_OF_STOCK'); else throw error; }
 `;
 const submit=()=>new Promise<string>((resolve,reject)=>{
  const worker=spawn(process.execPath,['--input-type=module','-e',code,JSON.stringify([{id:variant.id,qty:1}]),JSON.stringify(input())],{cwd:process.cwd(),env:process.env});
  let stdout='',stderr='';
  worker.stdout.on('data',x=>{stdout+=x;});worker.stderr.on('data',x=>{stderr+=x;});
  worker.on('error',reject);worker.on('close',exit=>exit===0?resolve(stdout.trim()):reject(Error(stderr)));
 });
 assert.deepEqual((await Promise.all([submit(),submit()])).sort(),['OUT_OF_STOCK','PLACED']);
 assert.equal(stock(variant.id),0);
});

test('repair follows diagnosis and quote approval before work can start',()=>{
 const created=createRequest('repair',{...guest,brand:'Apple',model:'iPhone',issue:'Écran',arrangement:'À convenir'},[],null);
 assert.equal(request(created.id).quote,null);
 quote(request(created.id),'Diagnostic',null);
 quote(request(created.id),'Devis',450000);
 const proposal=request(created.id);
 assert.ok(!requestOptions(proposal).includes('En réparation'));
 decideQuote(proposal.id,true,proposal.updated);
 assert.throws(()=>decideQuote(proposal.id,false,proposal.updated),/déjà été traité/);
 quote(request(created.id),'En réparation',450000);
 quote(request(created.id),'Prête',450000);
 quote(request(created.id),'Terminée',450000);
 assert.equal(request(created.id).state,'Terminée');
});

test('accepted product quotations convert once without losing amount or quantity',()=>{
 const created=createRequest('product',{...guest,product:'Téléphone demandé',quantity:'3'},[],null);
 quote(request(created.id),'Devis',120001);
 const proposal=request(created.id);
 assert.throws(()=>convertRequest(actor,proposal.id),/doit accepter/);
 decideQuote(proposal.id,true,proposal.updated);
 const converted=convertRequest(actor,proposal.id);
 assert.equal(convertRequest(actor,proposal.id).id,converted.id);
 assert.equal(converted.total,120001);
 assert.equal(converted.state,'Nouvelle');
 assert.equal(request(proposal.id).state,'Terminée');
 const items=orderItems(converted.id);
 assert.equal(items.reduce((n,i)=>n+i.quantity,0),3);
 assert.equal(items.reduce((n,i)=>n+i.price*i.quantity,0),120001);
});

test('analytics counts delivered value and distinguishes placed orders',()=>{
 const before=analytics(rangeFor('today'));
 const {variant}=fixture('Vente livrée');
 const checkoutResult=checkout([{id:variant.id,qty:1}],input(),null);
 for(const state of ['Confirmée','En préparation','Livrée']){
  const current=order(checkoutResult.id);
  updateOrder(actor,current.id,state,'','',current.updated);
 }
 const after=analytics(rangeFor('today'));
 assert.equal(after.orderCount,before.orderCount+1);
 assert.equal(after.deliveredCount,before.deliveredCount+1);
 assert.equal(after.revenue,before.revenue+90000);
});

test('tracking capabilities are scoped and passwords are verified securely',async ()=>{
 const first=id(),second=id(),token=capability('repair',first);
 assert.equal(hasCapability('repair',first,token),true);
 assert.equal(hasCapability('product',first,token),false);
 assert.equal(hasCapability('repair',second,token),false);
 const hash=await hashPassword('temporary-password');
 assert.equal(await verifyPassword('temporary-password',hash),true);
 assert.equal(await verifyPassword('incorrect',hash),false);
 rateLimit('test-rate',1,30);
 assert.throws(()=>rateLimit('test-rate',1,30),/Trop de tentatives/);
});

test('PNG uploads are decoded and invalid bytes do not create media records',async ()=>{
 const good=new Uint8Array(readFileSync('public/brand/logo.png'));
 const fake=new File(['not an image'],'invalid.png',{type:'image/png'});
 await assert.rejects(uploadImage(fake,'public'),/PNG valide/);
 const asset=await uploadImage(new File([good],'valid.png',{type:'image/png'}),'public');
 assert.deepEqual(all<{id:string}>("SELECT id FROM media WHERE scope='public'").map(x=>x.id),[asset]);
});
