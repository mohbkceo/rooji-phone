import Link from 'next/link';
import {ExternalLink,LogOut} from 'lucide-react';
import {requireAdmin} from '@/lib/auth';
import {logout} from '@/app/actions';
import {Brand} from '@/components/ui';
import {AdminNav} from '@/components/admin-nav';
export default async function Layout({children}:{children:React.ReactNode}){
 await requireAdmin();
 return <div className="admin-shell"><aside className="admin-sidebar"><Brand/><span className="admin-label">ADMINISTRATION</span><AdminNav/><div className="admin-bottom"><Link href="/"><ExternalLink size={17} aria-hidden="true"/><span className="sr-only lg:not-sr-only">Voir la boutique</span></Link><form action={logout}><button type="submit" className="bare"><LogOut size={17} aria-hidden="true"/><span className="sr-only lg:not-sr-only">Se déconnecter</span></button></form></div></aside><main id="contenu" tabIndex={-1} className="admin-main">{children}</main></div>;
}
