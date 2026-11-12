import type {Metadata} from 'next';
import {siteURL} from '@/lib/seo';
import './globals.css';
export const metadata:Metadata={
 metadataBase:siteURL,
 title:{default:'Roudji Phone | Smartphones, accessoires et réparation en Algérie',template:'%s | Roudji Phone'},
 description:'Découvrez le catalogue Roudji Phone ou faites une demande de réparation pour votre smartphone en Algérie.',
 icons:{icon:'/brand/logo.png'},
};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="fr-DZ"><body><a className="fixed top-3 left-3 z-50 -translate-y-[200%] rounded-control bg-ink px-4 py-3 text-sm font-semibold text-white focus:translate-y-0" href="#contenu">Aller au contenu</a>{children}</body></html>;
}
