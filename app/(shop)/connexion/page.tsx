import Link from 'next/link';
import {login} from '@/app/actions';
import {ActionForm,Field} from '@/components/forms';
import {privateMetadata} from '@/lib/seo';
export const metadata={title:'Connexion',...privateMetadata};
export default function Page(){return <div className="shell page auth-page"><h1>Connexion</h1><div className="panel"><ActionForm action={login.bind(null,false)} label="Se connecter"><Field label="E-mail"><input type="email" name="email" autoComplete="username" required maxLength={150}/></Field><Field label="Mot de passe"><input type="password" name="password" autoComplete="current-password" required maxLength={160}/></Field></ActionForm><p className="muted">Première visite ? <Link href="/inscription">Créer un compte</Link></p></div></div>;}
