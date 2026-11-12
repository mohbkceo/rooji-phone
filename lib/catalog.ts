import {all,get} from './db.ts';
import type {CatalogProduct,Category,ProductDetail,Variant} from './types.ts';

export const defaults = {
 heroTitle:'La technologie, simplement.', heroImage:'', heroAlt:'', heroLink:'/catalogue',
 repairImage:'', repairAlt:'', phone:'', email:'', address:'', hours:'', city:'', instagram:'', facebook:'',
 deliveryText:'', returnsText:'', legalText:'', pickup:true, delivery:false, deliveryFee:0,
};
export type Settings = typeof defaults;
export function settings():Settings {
 const row=get<{value:string}>('SELECT value FROM settings WHERE key=?','store');
 return row ? {...defaults,...JSON.parse(row.value)} : defaults;
}
export const categories=()=>all<Category>('SELECT * FROM categories ORDER BY rowid');
export const categoryBySlug=(slug:string)=>get<Category>('SELECT * FROM categories WHERE slug=?',slug);
const base = `
SELECT p.*, c.name AS category_name,c.slug AS category_slug,
  (SELECT MIN(COALESCE(v.sale,v.price)) FROM variants v WHERE v.product_id=p.id AND v.active=1) AS price,
  EXISTS(SELECT 1 FROM variants v WHERE v.product_id=p.id AND v.active=1 AND v.stock>0) AS available,
  COALESCE(json_extract(p.images,'$[0]'),'') AS image
FROM products p JOIN categories c ON c.id=p.category`;
type Filters={q?:string; category?:string; brand?:string; min?:number; max?:number; stock?:boolean; sort?:string; page?:number; featured?:boolean; limit?:number};
export function catalog(filters:Filters={}) {
 const {q,category,brand,min,max,stock,sort,featured,limit=12}=filters;
 const page=Math.max(1,Math.min(10000,filters.page||1));
 const where=['status=?'];
 const params:(string|number)[]=['published'];
 if(q){where.push("(name LIKE ? ESCAPE '\\' OR brand LIKE ? ESCAPE '\\')");const term='%'+q.replace(/[\\%_]/g,'\\$&')+'%';params.push(term,term);}
 if(category){where.push('category_slug=?');params.push(category);}
 if(brand){where.push('brand=? COLLATE NOCASE');params.push(brand);}
 if(min!==undefined||max!==undefined||stock){
  const variantFilters=['v.product_id=result.id','v.active=1'];
  if(min!==undefined){variantFilters.push('COALESCE(v.sale,v.price)>=?');params.push(min);}
  if(max!==undefined){variantFilters.push('COALESCE(v.sale,v.price)<=?');params.push(max);}
  if(stock)variantFilters.push('v.stock>0');
  where.push('EXISTS (SELECT 1 FROM variants v WHERE '+variantFilters.join(' AND ')+')');
 }
 if(featured)where.push('featured=1');
 const filtered=' FROM ('+base+') AS result WHERE '+where.join(' AND ');
 const total=get<{n:number}>('SELECT COUNT(*) AS n'+filtered,...params)?.n??0;
 const order=sort==='price-asc'?'price IS NULL,price ASC':sort==='price-desc'?'price IS NULL,price DESC':sort==='name'?'name COLLATE NOCASE ASC':'created DESC';
 return {products:all<CatalogProduct>('SELECT *'+filtered+' ORDER BY '+order+',id LIMIT ? OFFSET ?',...params,limit,(page-1)*limit),total,page,limit};
}
export const brands=()=>all<{brand:string}>("SELECT DISTINCT brand FROM products WHERE status='published' AND brand<>'' ORDER BY brand").map(p=>p.brand);
export function product(slug:string):ProductDetail|undefined {
 const row=get<CatalogProduct>(base+" WHERE p.slug=? AND p.status='published'",slug);
 if(!row)return;
 return {...row,variants:all<Variant>('SELECT * FROM variants WHERE product_id=? AND active=1 ORDER BY rowid',row.id)};
}
