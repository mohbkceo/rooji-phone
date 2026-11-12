import {ProductRequestForm} from '@/components/customer-forms';
import {Breadcrumb,TextLink} from '@/components/ui';
import {currentUser} from '@/lib/auth';
import {pageMeta} from '@/lib/seo';
import {first,type SearchParams} from '@/components/catalog-page';
export const metadata=pageMeta('Demande de produit','Demandez à Roudji Phone un modèle ou une variante qui ne figure pas au catalogue.','/demande-produit');
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 const [user,p]=await Promise.all([currentUser(),searchParams]);
 return <div className="shell page"><Breadcrumb items={[{label:'Demande de produit'}]}/><div className="service-grid"><div className="min-w-0"><span className="eyebrow"><i/> LA BOUTIQUE</span><h1 className="mt-2 mb-3">Demander un produit</h1><p className="mb-2 text-muted">Indiquez le modèle recherché pour recevoir un devis.</p><TextLink href="/suivi">Suivre une demande</TextLink></div>
 <ProductRequestForm model={first(p.modele).slice(0,110)} variant={first(p.variante).slice(0,100)} identity={user?{name:user.name,phone:user.phone}:undefined}/></div></div>;
}
