import {CatalogPage,type SearchParams,first} from '@/components/catalog-page';
import {pageMeta} from '@/lib/seo';
export async function generateMetadata({searchParams}:{searchParams:Promise<SearchParams>}) {
 return {...pageMeta('Nouveautés','Les derniers produits publiés par Roudji Phone.','/nouveautes'),...(Object.values(await searchParams).some(v=>first(v))?{robots:{index:false,follow:true}}:{})};
}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <CatalogPage title="Nouveautés" path="/nouveautes" params={await searchParams}/>;}
