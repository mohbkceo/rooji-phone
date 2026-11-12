import {z} from 'zod';
import {all,get,run,transaction} from './db';
import {settings,defaults} from './catalog';
import {audit} from './orders';
import {id,InputError,timestamp} from './security';
import {imageId,publicAsset} from './media';
import {slugify} from './shared';
import {optional,parse,priceInput,required} from './validation';
import type {Product,Variant} from './types';

const image=z.string().regex(imageId);
const maybeImage=z.union([image,z.literal('')]);
const variant=z.object({
 id:z.union([image,z.literal('')]),label:required(110),price:priceInput,
 sale:z.union([z.literal('').transform(()=>null),priceInput]),stock:z.string().regex(/^\d{1,7}$/).transform(Number),image:maybeImage, color:optional(70),size:optional(70),storage:optional(70),
}).refine(v=>v.price>0&&(v.sale===null||v.sale>0&&v.sale<v.price),'Le prix remisé doit être inférieur au prix normal.');
const productSchema=z.object({id:maybeImage,version:optional(50),name:required(160),category:required(100),brand:optional(70),
 description:optional(3000),specs:optional(3000),status:z.enum(['draft','published','archived']), featured:z.boolean(),
 seoTitle:optional(100),seoDescription:optional(240),images:z.array(image).max(12),variants:z.array(variant).max(60),
}).refine(p=>p.status!=='published'||p.description.length>0,'Ajoutez une description avant publication.');
export function saveProduct(actor:string,input:unknown) {
 const form=parse(productSchema,input);
 if(new Set(form.images).size!==form.images.length || form.images.some(asset=>!publicAsset(asset)))throw new InputError('Galerie invalide.');
 if(form.variants.some(v=>v.image&&!form.images.includes(v.image)))throw new InputError('Sélectionnez les photos de variantes dans la galerie.');
 const variantIds=form.variants.filter(v=>v.id).map(v=>v.id);
 if(new Set(variantIds).size!==variantIds.length)throw new InputError('Variantes en double.');
 return transaction(()=>{
  if(!get('SELECT id FROM categories WHERE id=?',form.category))throw new InputError('Catégorie introuvable.');
  const productId=form.id||id();
  const previous=get<Product>('SELECT * FROM products WHERE id=?',productId);
  if(form.id&&(!previous||previous.updated!==form.version))throw new InputError('Produit modifié. Rechargez la page.');
  if(!form.id&&variantIds.length)throw new InputError('Identifiant de variante invalide.');
  const at=timestamp(previous?.updated),baseSlug=slugify(form.name)||'produit';
  const slug=previous?.slug||(get('SELECT id FROM products WHERE slug=?',baseSlug)?baseSlug+'-'+productId.slice(0,8):baseSlug);
  const previousVariants=all<Variant>('SELECT * FROM variants WHERE product_id=?',productId);
  if(variantIds.some(variantId=>!previousVariants.some(v=>v.id===variantId)))throw new InputError('Variante invalide.');
  const values=[form.name,form.category,form.brand,form.description,form.specs,JSON.stringify(form.images),form.status,Number(form.featured),form.seoTitle,form.seoDescription,at];
  if(previous)run('UPDATE products SET name=?,category=?,brand=?,description=?,specs=?,images=?,status=?,featured=?,seo_title=?,seo_description=?,updated=? WHERE id=?',...values,productId);
  else run('INSERT INTO products(name,category,brand,description,specs,images,status,featured,seo_title,seo_description,updated,id,slug,created) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',...values,productId,slug,at);
  run('UPDATE variants SET active=0 WHERE product_id=?',productId);
  for(const v of form.variants) {
   const old=previousVariants.find(row=>row.id===v.id);
   if(old && old.stock!==v.stock) {
    const baseline=(input as {stocks?:Record<string,unknown>}).stocks?.[v.id];
    if(typeof baseline!=='number')throw new InputError('Stock de référence invalide.');
    if(baseline!==v.stock && old.stock!==baseline)throw new InputError('Le stock a changé. Rechargez la page.');
    if(baseline===v.stock)v.stock=old.stock;
   }
   if(v.id)run('UPDATE variants SET label=?,price=?,sale=?,stock=?,image=?,color=?,size=?,storage=?,active=1 WHERE id=?',v.label,v.price,v.sale,v.stock,v.image,v.color,v.size,v.storage,v.id);
   else run('INSERT INTO variants(id,product_id,label,price,sale,stock,image,color,size,storage) VALUES(?,?,?,?,?,?,?,?,?,?)',id(),productId,v.label,v.price,v.sale,v.stock,v.image,v.color,v.size,v.storage);
  }
  audit(actor,previous?'product.update':'product.create',productId);
  return productId;
 });
}
const external=z.string().trim().max(250).refine(s=>!s||URL.canParse(s)&&new URL(s).protocol==='https:','Utilisez une adresse HTTPS.');
export const settingsInput=z.object({
 heroTitle:required(90),heroImage:maybeImage,heroAlt:optional(150),heroLink:z.string().trim().regex(/^\/(?:catalogue|reparation|demande-produit|categorie\/[a-z0-9-]+|produit\/[a-z0-9-]+)$/),
 repairImage:maybeImage,repairAlt:optional(150),phone:optional(32).refine(s=>!s||/^[+\d(). -]+$/.test(s)),email:optional(150).refine(s=>!s||z.email().safeParse(s).success),
 address:optional(250),city:optional(100),hours:optional(200),instagram:external,facebook:external,deliveryText:optional(4500),
 returnsText:optional(4500),legalText:optional(7000),pickup:z.boolean(),delivery:z.boolean(),deliveryFee:priceInput,
});
export function saveSettings(actor:string,input:unknown) {
 const form=parse(settingsInput,input);
 if((form.heroImage&&!form.heroAlt)||(form.repairImage&&!form.repairAlt))throw new InputError('Ajoutez une description aux photos importées.');
 if([form.heroImage,form.repairImage].some(asset=>asset&&!publicAsset(asset)))throw new InputError('Image introuvable.');
 transaction(()=>{
  const value={...defaults,...settings(),...form};
  run("INSERT INTO settings VALUES('store',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(value));
  audit(actor,'settings.update','store');
 });
}
export function saveCategory(actor:string,input:unknown) {
 const form=parse(z.object({id:optional(100),name:required(75),image:maybeImage}),input);
 const slug=slugify(form.name);
 if(!slug || form.image&&!publicAsset(form.image))throw new InputError('Catégorie ou photo invalide.');
 transaction(()=>{
  if(form.id) {
   if(!run('UPDATE categories SET name=?,image=? WHERE id=?',form.name,form.image,form.id).changes)throw new InputError('Catégorie introuvable.');
  } else {
   if(get('SELECT id FROM categories WHERE slug=?',slug))throw new InputError('Cette catégorie existe déjà.');
   run('INSERT INTO categories VALUES(?,?,?,?)',id(),slug,form.name,form.image);
  }
  audit(actor,'category.save',form.id||slug);
 });
}
