import {randomUUID} from 'node:crypto';
import {Checkout} from '@/components/cart';
import {Breadcrumb} from '@/components/ui';
import {settings} from '@/lib/catalog';
import {currentUser} from '@/lib/auth';
import {privateMetadata} from '@/lib/seo';
export const metadata={title:'Commande',...privateMetadata};
export default async function Page(){
 const s=settings(),user=await currentUser();
 return <div className="shell page"><Breadcrumb items={[{label:'Panier',href:'/panier'},{label:'Commande'}]}/><h1>Commander</h1><Checkout pickup={s.pickup} delivery={s.delivery} fee={s.deliveryFee} keyValue={randomUUID()} address={s.address} identity={user?{name:user.name,phone:user.phone}:undefined}/></div>;
}
