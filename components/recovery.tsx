import {ButtonLink} from './ui';

export function NotFoundContent({admin = false}: {admin?: boolean}) {
 return <section className={admin ? 'panel narrow' : 'shell page narrow'}>
  <span className="eyebrow">{admin ? 'ADMINISTRATION' : 'ROUDJI PHONE'}</span>
  <h1>Page introuvable.</h1><p className="max-w-prose text-muted">Ce lien n’est plus disponible ou vous n’avez pas accès à cette page.</p>
  <div className="actions"><ButtonLink href={admin ? '/admin' : '/catalogue'}>{admin ? 'Tableau de bord' : 'Voir le catalogue'}</ButtonLink>
   <ButtonLink href={admin ? '/admin/produits' : '/'} secondary>{admin ? 'Produits' : 'Revenir à l’accueil'}</ButtonLink></div>
 </section>;
}
