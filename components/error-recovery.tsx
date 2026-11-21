'use client';
import {ButtonLink} from './ui';

export function ErrorRecovery({reset, admin = false}: {reset: () => void; admin?: boolean}) {
 return <section className={admin ? 'panel narrow' : 'shell page narrow'} role="alert">
  <span className="eyebrow">{admin ? 'ADMINISTRATION' : 'ROUDJI PHONE'}</span><h1>Une erreur est survenue.</h1>
  <p className="text-muted">Réessayez de charger cette page ou revenez {admin ? 'au tableau de bord' : 'à l’accueil'}.</p>
  <div className="actions"><button type="button" className="button primary" onClick={reset}>Réessayer</button>
   <ButtonLink href={admin ? '/admin' : '/'} secondary>{admin ? 'Tableau de bord' : 'Accueil'}</ButtonLink></div>
 </section>;
}
