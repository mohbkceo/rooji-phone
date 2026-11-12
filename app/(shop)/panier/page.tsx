import {CartView} from '@/components/cart';
import {privateMetadata} from '@/lib/seo';
export const metadata={title:'Panier',...privateMetadata};
export default function Page(){return <div className="shell page"><h1>Panier</h1><CartView/></div>;}
