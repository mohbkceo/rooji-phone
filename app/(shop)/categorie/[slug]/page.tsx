import {notFound} from 'next/navigation';
import {categoryBySlug} from '@/lib/catalog';
import {pageMeta,breadcrumbData} from '@/lib/seo';
import {JsonLd} from '@/components/json-ld';
import {CatalogPage,type SearchParams,first} from '@/components/catalog-page';
type Props={params:Promise<{slug:string}>;searchParams:Promise<SearchParams>};
export async function generateMetadata({params,searchParams}:Props){
 const {slug}=await params,c=categoryBySlug(slug);
 if(!c)notFound();
 return {...pageMeta(c.name,c.name+' dans le catalogue Roudji Phone en Algérie.','/categorie/'+slug),...(Object.values(await searchParams).some(v=>first(v))?{robots:{index:false,follow:true}}:{})};
}
export default async function Page({params,searchParams}:Props){
 const {slug}=await params,c=categoryBySlug(slug);
 if(!c)notFound();
 return <><JsonLd items={[breadcrumbData([{name:'Catalogue',path:'/catalogue'},{name:c.name,path:'/categorie/'+slug}])]}/><CatalogPage title={c.name} path={'/categorie/'+slug} category={slug} params={await searchParams}/></>;
}
