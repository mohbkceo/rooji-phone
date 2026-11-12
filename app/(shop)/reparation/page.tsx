import {RepairForm} from '@/components/customer-forms';
import {currentUser} from '@/lib/auth';
import {settings} from '@/lib/catalog';
import {pageMeta} from '@/lib/seo';
import {photos} from '@/lib/editorial';
import {Breadcrumb,Photo,TextLink} from '@/components/ui';
export const metadata=pageMeta('Réparation téléphone','Demandez un diagnostic pour votre smartphone en Algérie, consultez le devis et suivez votre réparation.','/reparation','/photos/repair-960.png');
export default async function Page(){
 const user=await currentUser(),s=settings();
 return <div className="shell page"><Breadcrumb items={[{label:'Réparation'}]}/><div className="service-grid"><div className="min-w-0"><span className="eyebrow"><i/> ATELIER</span><h1 className="mt-2 mb-3">Réparation téléphone</h1><p className="mb-2 text-muted">Décrivez le problème. Vous recevrez un devis après le diagnostic.</p><TextLink href="/suivi">Suivre une réparation</TextLink><div className="mt-5 hidden aspect-4/3 overflow-hidden rounded-card bg-surface md:block"><Photo asset={s.repairImage||photos.reparation.asset} alt={s.repairImage?s.repairAlt:photos.reparation.alt} className="size-full object-cover"/></div></div>
 <RepairForm identity={user?{name:user.name,phone:user.phone}:undefined} dropoff={s.pickup}/></div></div>;
}
