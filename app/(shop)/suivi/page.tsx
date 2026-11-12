import Link from 'next/link';
import {privateMetadata} from '@/lib/seo';
import {TextLink} from '@/components/ui';
export const metadata={title:'Suivi',...privateMetadata};
export default function Page(){return <div className="shell page narrow"><h1>Suivre une demande</h1><div className="panel"><p>Ouvrez le lien privé affiché lors de la confirmation de votre commande ou demande.</p><TextLink href="/compte">Ouvrir mon compte</TextLink><p className="muted">Lien perdu ? <Link href="/#contact">Contactez la boutique</Link> pour retrouver votre dossier.</p></div></div>;}
