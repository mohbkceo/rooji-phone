import Link from 'next/link';
import {Search,UserRound} from 'lucide-react';
import {Brand} from '@/components/ui';
import {MobileMenu,ShopNav} from '@/components/mobile-menu';
import {CartProvider,CartIcon} from '@/components/cart';
import {settings} from '@/lib/catalog';

export const dynamic='force-dynamic';

export default function ShopLayout({children}:{children:React.ReactNode}) {
 const s=settings();
 const hasContact=s.phone||s.email||s.instagram||s.facebook;
 return <CartProvider>
  <header className="relative z-10 border-b border-line bg-white">
   <div className="shell flex min-h-16 items-center justify-between gap-0 md:grid md:min-h-18 md:grid-cols-[1fr_auto_1fr] md:gap-4">
    <div className="flex min-w-0 items-center min-[375px]:gap-1">
     <MobileMenu/>
     <Brand/>
    </div>
    <ShopNav/>
    <div className="flex shrink-0 items-center justify-end sm:gap-1">
     <Link className="icon-link" href="/catalogue#recherche" aria-label="Rechercher"><Search size={20} aria-hidden="true"/></Link>
     <Link className="icon-link" href="/compte" aria-label="Compte"><UserRound size={20} aria-hidden="true"/></Link>
     <CartIcon/>
    </div>
   </div>
  </header>

  <main id="contenu" tabIndex={-1}>{children}</main>

  <footer className="border-t border-line bg-subtle" id="contact">
   <div className="shell grid grid-cols-2 gap-x-4 gap-y-6 py-8 text-sm md:grid-cols-[1.25fr_repeat(2,minmax(0,1fr))] md:gap-6 md:py-12 md:data-[contact]:grid-cols-[1.25fr_repeat(3,minmax(0,1fr))]" data-contact={hasContact?true:undefined}>
    <div className="col-span-full flex min-w-0 flex-col items-start gap-2 md:col-span-1">
     <Brand/>
     {s.address&&<p className="m-0 wrap-anywhere text-muted">{s.address}{s.city?', '+s.city:''}</p>}
     {s.hours&&<p className="preformatted m-0 text-muted">{s.hours}</p>}
    </div>
    <nav aria-label="Explorer" className="footer-links">
     <strong>Explorer</strong>
     <Link href="/catalogue">Catalogue</Link>
     <Link href="/reparation">Réparation</Link>
     <Link href="/demande-produit">Demande produit</Link>
     <Link href="/suivi">Suivi</Link>
    </nav>
    <nav aria-label="Informations" className="footer-links">
     <strong>Informations</strong>
     {s.deliveryText&&<Link href="/informations/livraison">Livraison</Link>}
     {s.returnsText&&<Link href="/informations/retours">Retours</Link>}
     {s.legalText&&<Link href="/informations/mentions">Mentions légales</Link>}
     <Link href="/informations/photos">Crédits photo</Link>
    </nav>
    {hasContact&&<div className="footer-links">
     <strong>Contact</strong>
     {s.phone&&<a href={'tel:'+s.phone.replace(/[^+\d]/g,'')}>{s.phone}</a>}
     {s.email&&<a href={'mailto:'+s.email}>{s.email}</a>}
     {s.instagram&&<a href={s.instagram}>Instagram</a>}
     {s.facebook&&<a href={s.facebook}>Facebook</a>}
    </div>}
   </div>
   <div className="shell flex flex-wrap justify-between gap-x-4 gap-y-1 border-t border-line py-4 text-xs text-muted">
    <span>© {new Date().getFullYear()} Roudji Phone</span><span>Algérie · DZD</span>
   </div>
  </footer>
 </CartProvider>;
}
