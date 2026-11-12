import type {Metadata} from 'next';
export const siteURL=new URL(process.env.SITE_URL||'http://localhost:3000');
export const absolute=(path:string)=>new URL(path,siteURL).href;
export const privateMetadata:Metadata={robots:{index:false,follow:false}};
export function pageMeta(title:string,description:string,path:string,photo?:string):Metadata {
 return {title,description,alternates:{canonical:path},openGraph:{title,description,url:path,siteName:'Roudji Phone',locale:'fr_DZ',type:'website',...(photo?{images:[{url:photo,alt:title}]}:{})}};
}
export function breadcrumbData(items:{name:string;path:string}[]) {
 return {'@type':'BreadcrumbList',itemListElement:[{name:'Accueil',path:'/'},...items].map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,item:absolute(item.path)}))};
}
