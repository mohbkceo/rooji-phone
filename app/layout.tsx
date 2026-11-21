import type {Metadata} from 'next';
import {siteURL} from '@/lib/seo';
import {NavigationProvider} from '@/components/navigation';
import './globals.css';
export const metadata:Metadata={
 metadataBase:siteURL,
 title:{default:'Roudji Phone | Smartphones, accessoires et réparation en Algérie',template:'%s | Roudji Phone'},
 description:'Découvrez le catalogue Roudji Phone ou faites une demande de réparation pour votre smartphone en Algérie.',
 icons:{icon:'/brand/logo.png'},
};
export default function Layout({children}:{children:React.ReactNode}){
 return <html lang="fr-DZ"><body><a className="skip-link" href="#contenu">Aller au contenu</a><NavigationProvider>{children}</NavigationProvider></body></html>;
}
