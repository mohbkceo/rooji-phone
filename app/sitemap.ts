import type {MetadataRoute} from 'next';
import {categories,settings} from '@/lib/catalog';
import {all} from '@/lib/db';
import {absolute} from '@/lib/seo';
export const dynamic='force-dynamic';
export default function sitemap():MetadataRoute.Sitemap{
 const s=settings();
 const paths=['/','/catalogue','/nouveautes','/reparation','/demande-produit','/informations/photos',
  ...categories().map(c=>'/categorie/'+c.slug),...(s.deliveryText?['/informations/livraison']:[]),
  ...(s.returnsText?['/informations/retours']:[]),...(s.legalText?['/informations/mentions']:[])];
 return [...paths.map(path=>({url:absolute(path)})),...all<{slug:string;updated:string}>("SELECT slug,updated FROM products WHERE status='published'").map(p=>({url:absolute('/produit/'+p.slug),lastModified:p.updated}))];
}
