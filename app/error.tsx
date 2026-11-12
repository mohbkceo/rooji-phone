'use client';
import {ButtonLink} from '@/components/ui';
export default function ErrorPage({reset}:{reset:()=>void}){
 return <section className="shell page narrow" id="contenu"><span className="eyebrow">ROUDJI PHONE</span><h1>Une erreur est survenue.</h1><div className="actions"><button className="button primary" onClick={reset}>Réessayer</button><ButtonLink href="/" secondary>Accueil</ButtonLink></div></section>;
}
