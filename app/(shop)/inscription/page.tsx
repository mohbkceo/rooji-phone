import Link from 'next/link';
import {signup} from '@/app/actions';
import {ActionForm,Field} from '@/components/forms';
import {privateMetadata} from '@/lib/seo';
export const metadata={title:'Inscription',...privateMetadata};
export default function Page(){return <div className="shell page auth-page"><h1>Créer un compte</h1><div className="panel"><ActionForm action={signup} label="S’inscrire"><Field label="Nom"><input name="name" autoComplete="name" required maxLength={100}/></Field><Field label="Téléphone"><input type="tel" name="phone" autoComplete="tel" required maxLength={30}/></Field><Field label="E-mail"><input type="email" name="email" autoComplete="username" required maxLength={150}/></Field><Field label="Mot de passe (10 caractères minimum)"><input type="password" name="password" autoComplete="new-password" required minLength={10} maxLength={160}/></Field></ActionForm><p className="muted">Déjà inscrit ? <Link href="/connexion">Se connecter</Link></p></div></div>;}
