import {CatalogPage,type SearchParams,first} from '@/components/catalog-page';
import {pageMeta} from '@/lib/seo';
export async function generateMetadata({searchParams}:{searchParams:Promise<SearchParams>}) {
 const query=await searchParams;
 return {...pageMeta('Catalogue','Parcourez les smartphones et accessoires Roudji Phone.','/catalogue'),...(Object.values(query).some(v=>first(v))?{robots:{index:false,follow:true}}:{})};
}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <CatalogPage title="Catalogue" path="/catalogue" params={await searchParams}/>;}
