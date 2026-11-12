import {notFound} from 'next/navigation';
import {product,settings} from '@/lib/catalog';
import {absolute,breadcrumbData,pageMeta} from '@/lib/seo';
import {imageUrl} from '@/lib/image-url';
import {Breadcrumb} from '@/components/ui';
import {ProductBuy} from '@/components/product-buy';
import {JsonLd} from '@/components/json-ld';
type Props={params:Promise<{slug:string}>;searchParams:Promise<{variante?:string}>};
export async function generateMetadata({params}:Props){
 const p=product((await params).slug);
 if(!p)notFound();
 return pageMeta(p.seo_title||p.name,p.seo_description||p.description.slice(0,165),'/produit/'+p.slug,p.image?imageUrl(p.image,960):undefined);
}
export default async function Page({params,searchParams}:Props){
 const p=product((await params).slug);
 if(!p)notFound();
 const config=settings(),buyable=config.pickup||config.delivery,path='/produit/'+p.slug, category='/categorie/'+p.category_slug;
 const initial=(await searchParams).variante;
 const images=(JSON.parse(p.images) as string[]).map(x=>absolute(imageUrl(x,960)));
 const crumbs=breadcrumbData([{name:'Catalogue',path:'/catalogue'},{name:p.category_name,path:category},{name:p.name,path}]);
 const brand=p.brand?{brand:{'@type':'Brand',name:p.brand}}:{};
 const individual=p.variants.map(v=>({'@type':'Product',name:p.name+(p.variants.length>1?' – '+v.label:''),sku:v.id,description:p.description,...brand,
  ...(v.color?{color:v.color}:{}),...(v.size?{size:v.size}:{}),...(v.storage?{additionalProperty:{'@type':'PropertyValue',name:'Stockage',value:v.storage}}:{}),
  image:v.image?[absolute(imageUrl(v.image,960))]:images,url:absolute(path+'?variante='+v.id),
  ...(buyable?{offers:{'@type':'Offer',url:absolute(path+'?variante='+v.id),price:(v.sale??v.price)/100,priceCurrency:'DZD',availability:'https://schema.org/'+(v.stock?'InStock':'OutOfStock')}}:{})
 }));
 const variesBy=(['color','size'] as const).filter(attr=>new Set(p.variants.map(v=>v[attr]).filter(Boolean)).size>1).map(attr=>'https://schema.org/'+attr);
 const group=p.variants.length>1?{'@type':'ProductGroup',name:p.name,productGroupID:p.id,description:p.description,image:images,...brand,...(variesBy.length?{variesBy}:{}),hasVariant:individual}:individual[0];
 return <div className="shell page"><JsonLd items={group&&images.length&&buyable?[crumbs,group]:[crumbs]}/><Breadcrumb items={[{label:'Catalogue',href:'/catalogue'},{label:p.category_name,href:category},{label:p.name}]}/><ProductBuy key={p.id+':'+(initial??'')} product={buyable?p:{...p,variants:p.variants.map(v=>({...v,stock:0}))}} initial={p.variants.some(v=>v.id===initial)?initial:undefined}/></div>;
}
