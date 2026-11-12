import {notFound} from 'next/navigation';
import {settings} from '@/lib/catalog';
import {photos} from '@/lib/editorial';
import {pageMeta} from '@/lib/seo';
import {Breadcrumb} from '@/components/ui';
const pages={livraison:['Livraison','deliveryText'],retours:['Retours','returnsText'],mentions:['Mentions légales','legalText'],photos:['Crédits photo','']} as const;
async function getPage(params:Promise<{slug:string}>) {
 const {slug}=await params;
 const page=pages[slug as keyof typeof pages];
 if(!page)notFound();
 const [title,key]=page,text=key?settings()[key]:'';
 if(slug!=='photos'&&!text)notFound();
 return {slug,title,text};
}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){
 const p=await getPage(params);return pageMeta(p.title,p.text.slice(0,155)||'Sources et licences des photographies éditoriales de Roudji Phone.','/informations/'+p.slug);
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {title,text,slug}=await getPage(params);
 return <div className="shell page narrow"><Breadcrumb items={[{label:title}]}/><h1>{title}</h1>{text?<p className="preformatted">{text}</p>:slug==='photos'&&<><p>Photographies éditoriales. Les images ont été redimensionnées, recadrées et converties en PNG.</p><ul className="credits">{Object.values(photos).map(p=><li key={p.file}><a href={'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(p.file)}>{p.alt}</a> — {p.author}, {p.licensePath?<a href={'https://creativecommons.org/licenses/'+p.licensePath+'/'}>{p.license}</a>:p.license}.</li>)}</ul></>}</div>;
}
