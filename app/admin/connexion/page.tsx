import {redirect} from 'next/navigation';
import {currentUser} from '@/lib/auth';
import {login} from '@/app/actions';
import {ActionForm,Field} from '@/components/forms';
import {Brand} from '@/components/ui';
export const metadata={title:'Accès administration'};
export default async function Page(){
 if((await currentUser())?.role==='admin')redirect('/admin');
 return <main id="contenu" tabIndex={-1} className="admin-auth"><div className="panel"><Brand/><h1>Administration</h1><ActionForm action={login.bind(null,true)} label="Se connecter"><Field label="E-mail"><input type="email" name="email" autoComplete="username" maxLength={150} required/></Field><Field label="Mot de passe"><input name="password" type="password" autoComplete="current-password" maxLength={160} required/></Field></ActionForm></div></main>;
}
