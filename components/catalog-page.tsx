import Link from 'next/link';
import {Search} from 'lucide-react';
import {brands,catalog,categories} from '@/lib/catalog';
import {Breadcrumb,ButtonLink,Empty,ProductGrid} from '@/components/ui';
export type SearchParams=Record<string,string|string[]|undefined>;
export const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]||'':value||'';
const price=(input:string)=>/^\d{1,8}(?:[.,]\d{1,2})?$/.test(input)?Math.round(Number(input.replace(',','.'))*100):undefined;
export function CatalogPage({params,title,path,category}:{params:SearchParams;title:string;path:string;category?:string}){
 const q=first(params.q).slice(0,120),brand=first(params.marque).slice(0,70),cat=category||first(params.categorie),min=first(params.min),max=first(params.max),stock=first(params.stock)==='1',sort=first(params.tri),page=Number(first(params.page));
 const {products,total,limit,page:actualPage}=catalog({q,brand,category:cat,min:price(min),max:price(max),stock,sort,page:Number.isInteger(page)?page:1});
 function pagination(next:number){
  const search=new URLSearchParams();
  for(const [key,value] of Object.entries(params))if(key!=='page'&&first(value))search.set(key,first(value));
  if(next>1)search.set('page',String(next));
  return path+(search.size?'?'+search:'');
 }
 return <div className="shell page">
  <Breadcrumb items={category?[{label:'Catalogue',href:'/catalogue'},{label:title}]:[{label:title}]}/>
  <div className="mt-6 mb-4"><span className="eyebrow">LA BOUTIQUE</span><h1 className="mt-2 mb-0">{title}</h1></div>
  <form className="grid scroll-mt-4 gap-3 rounded-card border border-line bg-subtle p-3 sm:p-4" action={path} id="recherche">
   <div className="flex flex-wrap gap-3">
    <label className="relative min-w-36 flex-1"><Search className="pointer-events-none absolute top-3.5 left-3 text-muted" size={18} aria-hidden="true"/><input className="h-full pl-10" type="search" aria-label="Rechercher un produit" name="q" defaultValue={q} maxLength={120} placeholder="Rechercher un produit"/></label>
    <button className="button primary" type="submit">Rechercher</button>
   </div>
   <details className="rounded-control border border-line bg-white px-3" open={!!(brand||min||max||stock||cat&&!category||sort)}><summary className="min-h-11 py-3 text-sm font-semibold">Filtres et tri</summary><div className="grid gap-3 pb-4 min-[420px]:grid-cols-2 md:grid-cols-3">
    {!category&&<label className="field"><span>Catégorie</span><select name="categorie" defaultValue={cat}><option value="">Toutes</option>{categories().map(c=><option value={c.slug} key={c.id}>{c.name}</option>)}</select></label>}
    <label className="field"><span>Marque</span><select name="marque" defaultValue={brand}><option value="">Toutes</option>{brands().map(b=><option key={b}>{b}</option>)}</select></label>
    <label className="field"><span>Prix min. (DA)</span><input name="min" type="number" min="0" max="99999999" defaultValue={min}/></label>
    <label className="field"><span>Prix max. (DA)</span><input name="max" type="number" min="0" max="99999999" defaultValue={max}/></label>
    <label className="field"><span>Trier par</span><select name="tri" defaultValue={sort}><option value="">Nouveautés</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option><option value="name">Nom</option></select></label>
    <label className="check"><input name="stock" type="checkbox" value="1" defaultChecked={stock}/> En stock</label>
   </div></details>
   {Object.values(params).some(v=>first(v))&&<Link className="button secondary" href={path}>Réinitialiser</Link>}
  </form>
  <p className="mt-5 mb-3 text-sm text-muted">{total} produit{total===1?'':'s'}</p>
  {products.length?<ProductGrid products={products} heading="h2"/>:<Empty title="Aucun produit trouvé."><ButtonLink href="/demande-produit" secondary>Demander un produit</ButtonLink></Empty>}
  {(actualPage>1||actualPage*limit<total)&&<nav className="pagination" aria-label="Pagination">{actualPage>1&&<Link href={pagination(actualPage-1)}>Précédent</Link>}<span>Page {actualPage}</span>{actualPage*limit<total&&<Link href={pagination(actualPage+1)}>Suivant</Link>}</nav>}
 </div>;
}
