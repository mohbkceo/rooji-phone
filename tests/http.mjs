import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {cp,mkdtemp,readFile,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {setTimeout} from 'node:timers/promises';

const dir=await mkdtemp(join(tmpdir(),'roudji-http-'));
const probe=createServer();
probe.listen(0,'127.0.0.1');
await once(probe,'listening');
const port=probe.address().port, origin='http://127.0.0.1:'+port;
await new Promise(resolve=>probe.close(resolve));
const email='http-test-admin@example.test', password='temporary-http-test-password';
const env={...process.env,APP_SECRET:'only-for-temporary-production-http-tests',SITE_URL:origin,DATA_DIR:dir,HOSTNAME:'127.0.0.1',
 PORT:String(port),COOKIE_SECURE:'false',ADMIN_EMAIL:email,ADMIN_PASSWORD:password};
let server, logs='';
const decode=(value='')=>value.replace(/&(#x[0-9a-f]+|#\d+|quot|amp|lt|gt|apos);/gi,(_match,key)=>{
 if(key.startsWith('#x'))return String.fromCodePoint(parseInt(key.slice(2),16));
 if(key.startsWith('#'))return String.fromCodePoint(Number(key.slice(1)));
 return {quot:'"',amp:'&',lt:'<',gt:'>',apos:"'"}[key];
});
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([,key,val])=>[key,decode(val)]));
const request=(path,options={})=>fetch(new URL(path,origin),{redirect:'manual',...options});
const cookie=res=>res.headers.get('set-cookie')?.split(';')[0]||'';
const sessionHeader=session=>session?{cookie:session}:{};
const location=(response)=>{
 assert.equal(response.status,303);
 const url=new URL(response.headers.get('location'),origin);
 assert.equal(url.origin,origin);
 return url.pathname+url.search;
};
async function get(path,session=''){
 const response=await request(path,{headers:sessionHeader(session)});
 assert.equal(response.status,200,path);
 return response.text();
}
async function postForm(path,fields,session='',selector=0){
 const page=await get(path,session);
 const forms=[...page.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(match=>match[0]).filter(form=>form.includes('$ACTION_'));
 const chosen=typeof selector==='function'?forms.find(selector):forms[selector];
 assert.ok(chosen,'Server form: '+path);
 const form=new FormData();
 for(const match of chosen.matchAll(/<input\b[^>]+>/g)){
  const {name,value}=attrs(match[0]);
  if(name?.startsWith('$ACTION_'))form.append(name,value||'');
 }
 for(const [key,value] of Object.entries(fields))form.append(key,value);
 return request(path,{method:'POST',headers:{origin,...sessionHeader(session)},body:form});
}
function privateToken(path){return new URL(path,origin).searchParams.get('t');}
function version(page){
 const value=[...page.matchAll(/<input\b[^>]+>/g)].map(match=>attrs(match[0])).find(input=>input.name==='version')?.value;
 assert.ok(value);
 return value;
}
function firstDetail(html,route){
 const result=html.match(new RegExp('href="('+route+'/[a-f0-9]{32})"'))?.[1];
 assert.ok(result,route);return result;
}
try{
 const setup=spawnSync(process.execPath,['scripts/admin.ts'],{env,encoding:'utf8'});
 assert.equal(setup.status,0,setup.stderr);
 await cp('public','.next/standalone/public',{recursive:true});
 await cp('.next/static','.next/standalone/.next/static',{recursive:true});
 server=spawn(process.execPath,['.next/standalone/server.js'],{env,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',chunk=>{logs+=chunk;});server.stderr.on('data',chunk=>{logs+=chunk;});
 let ready=false;
 for(let attempt=0;attempt<40;attempt++){
  try{ready=(await request('/')).status===200;}catch{}
  if(ready)break;
  await setTimeout(100);
 }
 assert.ok(ready,logs);
 const home=await get('/');
 assert.match(home,/La technologie, simplement/);
 assert.match(home,/\/photos\/phone-640.png/);
 const png=await request('/photos/phone-640.png');
 assert.equal(png.status,200);
 assert.match(png.headers.get('content-type'),/image\/png/);
 const locked=await request('/admin');
 assert.ok([303,307].includes(locked.status));
 assert.equal(locked.headers.get('location'),'/admin/connexion');
 const anon=await request('/api/admin/media',{method:'POST'});
 assert.equal(anon.status,403);

 const login=await postForm('/admin/connexion',{email,password});
 assert.equal(location(login),'/admin');
 const admin=cookie(login);
 assert.match(admin,/^roudji_session=/);
 assert.match(await get('/admin',admin),/Tableau de bord/);
 const media=new FormData();
 const photo=new File([await readFile('public/photos/phone-320.png')],'verified-test-photo.png',{type:'image/png'});
 media.append('photo',photo);
 const upload=await request('/api/admin/media',{method:'POST',headers:{origin,cookie:admin},body:media});
 assert.equal(upload.status,200,await upload.clone().text());
 const {id:asset}=await upload.json();
 const productCreation=await postForm('/admin/produits/nouveau',{id:'',version:'',name:'Smartphone vérifié HTTP',category:'smartphones',
  brand:'Test HTTP',description:'Fiche de vérification automatisée et temporaire.',specs:'Stockage : 128 Go',featured:'on',status:'published',
  images:JSON.stringify([asset]),stocks:'{}',variants:JSON.stringify([
   {id:'',label:'Bleu 128 Go',price:'30000',sale:'29000',stock:'2',image:asset,color:'Bleu',storage:'128 Go'},
   {id:'',label:'Noir 128 Go',price:'32000',sale:'',stock:'0',image:asset,color:'Noir',storage:'128 Go'},
  ])},admin,form=>form.includes('Enregistrer le produit'));
 const edit=location(productCreation);
 assert.match(edit,/^\/admin\/produits\/[a-f0-9]+\?saved=1$/);
 const productPath='/produit/smartphone-verifie-http';
 const productPage=await get(productPath);
 const graph=JSON.parse(productPage.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]||'{}')['@graph'];
 assert.match(productPage,/Fiche de vérification automatisée/);
 assert.equal(graph[1]['@type'],'ProductGroup');
 assert.equal(graph[1].hasVariant[0].offers.price,29000);
 assert.equal(graph[1].hasVariant[1].offers.availability,'https://schema.org/OutOfStock');
 assert.ok(productPage.includes(origin+productPath));
 assert.match((await request('/media/'+asset+'/640.png')).headers.get('content-type'),/image\/png/);
 assert.match(await get('/catalogue?q=Smartphone&marque=Test%20HTTP&min=28000&max=30000&stock=1'),/Smartphone vérifié HTTP/);
 const sitemap=await get('/sitemap.xml');
 assert.ok(sitemap.includes(origin+productPath));
 assert.ok(!sitemap.includes('/admin'));
 assert.ok((await get('/robots.txt')).includes(origin+'/sitemap.xml'));
 console.log('PASS  Administration, upload PNG, catalogue SSR, variantes et SEO');

 const repair=location(await postForm('/reparation',{brand:'Apple',model:'iPhone de test',issue:'Écran',name:'Invité HTTP',
  phone:'0550112233',arrangement:'À convenir',photos:photo}));
 const repairRef=repair.split('?')[0],repairToken=privateToken(repair);
 assert.match(repairRef,/^\/suivi\/REP-/);
 assert.equal((await request(repairRef)).status,404);
 const privatePage=await request(repair);
 assert.equal(privatePage.status,200);
 assert.match(privatePage.headers.get('x-robots-tag'),/noindex/);
 assert.match(privatePage.headers.get('cache-control'),/no-store/);
 assert.match(privatePage.headers.get('referrer-policy'),/no-referrer/);
 assert.match(await privatePage.text(),/Demande reçue/);
 const repairAdmin=firstDetail(await get('/admin/reparations',admin),'/admin/reparations');
 const detail=await get(repairAdmin,admin);
 const privatePhoto=detail.match(/href="(\/api\/photo\/REP-[A-Z0-9-]+\/[a-f0-9]{32})"/)?.[1];
 assert.ok(privatePhoto);
 assert.equal((await request(privatePhoto)).status,404);
 assert.equal((await request(privatePhoto,{headers:{cookie:admin}})).status,200);
 for(const [state,quote] of [['Diagnostic',''],['Devis','6500']]){
  const page=await get(repairAdmin,admin);
  const result=await postForm(repairAdmin,{id:repairAdmin.split('/').at(-1),state,quote,version:version(page),diagnostic:'Diagnostic interne privé',internal:'Note interne privée'},admin,form=>form.includes('Message visible'));
  location(result);
 }
 const quoteView=await get(repair);
 assert.match(quoteView,/Accepter le devis/);
 assert.doesNotMatch(quoteView,/Diagnostic interne privé|Note interne privée/);
 const repairDecision=await postForm(repair,{ref:repairRef.split('/').at(-1),token:repairToken,version:version(quoteView),decision:'yes'},'',form=>form.includes('Accepter le devis'));
 assert.match(await get(location(repairDecision)),/Devis accepté/);
 console.log('PASS  Réparation invitée, photo privée, diagnostic et acceptation du devis');

 const productRequest=location(await postForm('/demande-produit',{product:'Modèle hors catalogue HTTP',variant:'Gris',quantity:'2',name:'Client test',phone:'0550112234'}));
 const requestAdmin=firstDetail(await get('/admin/demandes',admin),'/admin/demandes');
 const requestId=requestAdmin.split('/').at(-1),requestView=await get(requestAdmin,admin);
 location(await postForm(requestAdmin,{id:requestId,state:'Devis',quote:'90000',version:version(requestView)},admin,form=>form.includes('Message visible')));
 const customerView=await get(productRequest);
 location(await postForm(productRequest,{ref:productRequest.split('?')[0].split('/').at(-1),token:privateToken(productRequest),version:version(customerView),decision:'yes'},'',form=>form.includes('Accepter le devis')));
 const orderDetail=location(await postForm(requestAdmin,{id:requestId},admin,form=>form.includes('Créer la commande'))).split('?')[0];
 const orderId=orderDetail.split('/').at(-1);
 assert.match(orderDetail,/^\/admin\/commandes\//);
 for(const state of ['Confirmée','En préparation','Livrée']){
  const page=await get(orderDetail,admin);
  location(await postForm(orderDetail,{id:orderId,state,version:version(page)},admin,form=>form.includes('Message visible')));
 }
 assert.match(await get('/admin/statistiques',admin),/Chiffre d’affaires/);
 const customerLogin=await postForm('/inscription',{name:'Client HTTP',email:'client-http@example.test',phone:'0550112235',password:'temporary-client-password'});
 assert.equal(location(customerLogin),'/compte');
 const customer=cookie(customerLogin);
 assert.match(await get('/compte',customer),/Mon compte/);
 const customerAdmin=await request('/admin',{headers:{cookie:customer}});
 assert.equal(customerAdmin.headers.get('location'),'/admin/connexion');
 assert.equal((await request(repairRef,{headers:{cookie:customer}})).status,404);
 console.log('PASS  Demande hors catalogue, conversion en commande, livraison, statistiques et séparation des rôles');
}catch(error){
 console.error(logs);
 throw error;
}finally{
 if(server&&server.exitCode===null){server.kill();await once(server,'exit');}
 await rm(dir,{recursive:true,force:true});
}
