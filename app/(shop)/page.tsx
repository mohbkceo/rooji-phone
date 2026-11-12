import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {categories,catalog,settings} from '@/lib/catalog';
import {Photo,ButtonLink,TextLink,ProductGrid,Empty} from '@/components/ui';
import {photos} from '@/lib/editorial';
import {JsonLd} from '@/components/json-ld';
import {absolute,pageMeta} from '@/lib/seo';

export const metadata=pageMeta('Smartphones, accessoires et réparation en Algérie','Découvrez le catalogue Roudji Phone et demandez une réparation de smartphone en Algérie.','/','/photos/phone-960.png');

function HomeSection({title,href,action,children}:{title:string;href:string;action:string;children:React.ReactNode}){
 return <section className="mt-12 md:mt-16 lg:mt-20">
  <div className="section-head"><h2>{title}</h2><TextLink href={href}>{action}</TextLink></div>
  {children}
 </section>;
}

export default function Home(){
 const s=settings(),groups=categories().slice(0,4);
 const popular=catalog({featured:true,limit:4}).products,newest=catalog({limit:4}).products;
 const repairImage=s.repairImage||photos.reparation.asset,repairAlt=s.repairImage?s.repairAlt:photos.reparation.alt;
 const tiles=[...groups.map(c=>({name:c.name,href:'/categorie/'+c.slug,image:c.image||photos[c.slug]?.asset||''})),{name:'Réparation',href:'/reparation',image:repairImage}];
 const heroAction=s.heroLink==='/catalogue'?'Voir les produits':s.heroLink==='/reparation'?'Réparation':s.heroLink==='/demande-produit'?'Demander un produit':'Découvrir';
 const organization={'@type':s.address?'LocalBusiness':'Organization',name:'Roudji Phone',url:absolute('/'),logo:absolute('/brand/logo.png'),
  ...(s.phone?{telephone:s.phone}:{}),...(s.address?{address:{'@type':'PostalAddress',streetAddress:s.address,addressCountry:'DZ',...(s.city?{addressLocality:s.city}:{})}}:{}),
  ...([s.facebook,s.instagram].some(Boolean)?{sameAs:[s.facebook,s.instagram].filter(Boolean)}:{})};

 return <div className="shell pt-4 pb-16 sm:pt-6 lg:pt-8 lg:pb-24">
  <JsonLd items={[organization]}/>
  <section className="grid overflow-hidden rounded-feature border border-line bg-surface md:grid-cols-[minmax(0,.94fr)_minmax(0,1.06fr)]">
   <div className="flex min-w-0 flex-col items-start justify-center px-4 py-6 min-[360px]:px-5 sm:p-8 md:p-6 lg:p-8 xl:p-12">
    <div className="motion-safe:animate-enter">
     <span className="eyebrow"><span className="size-1.5 rounded-full bg-brand" aria-hidden="true"/> Roudji Phone</span>
     <h1 className="mt-3 mb-3 max-w-[15ch] text-hero font-bold tracking-[-0.055em] text-pretty max-[359px]:text-4xl lg:mt-4 lg:mb-4">{s.heroTitle}</h1>
     <p className="mb-0 max-w-md text-sm leading-relaxed text-muted sm:text-base">Smartphones, accessoires, électronique et réparation.</p>
    </div>
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 motion-safe:animate-enter motion-safe:[animation-delay:70ms] max-[359px]:[&>.button]:px-3 lg:mt-7 lg:gap-x-5">
     <ButtonLink href={s.heroLink}>{heroAction}</ButtonLink>
     {s.heroLink!=='/reparation'&&<Link className="text-link" href="/reparation">Réparation</Link>}
    </div>
   </div>
   <div className="relative aspect-4/3 self-stretch overflow-hidden bg-stone-200 md:aspect-auto md:min-h-72 lg:min-h-96 xl:min-h-124">
    <Photo asset={s.heroImage||photos.smartphones.asset} alt={s.heroImage?s.heroAlt:photos.smartphones.alt} priority
     className="absolute inset-0 size-full object-cover motion-safe:animate-photo"
     sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 767px) calc(100vw - 48px), (max-width: 1375px) 50vw, 678px"/>
   </div>
  </section>

  <HomeSection title="Catégories" href="/catalogue" action="Tout voir">
   <ul className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3 sm:gap-4 lg:grid-cols-5">
    {tiles.map(tile=><li key={tile.href} className="min-w-0">
     <Link className="group discovery-card" href={tile.href}>
      <div className="aspect-4/3 overflow-hidden rounded-t-card bg-surface">
       <Photo asset={tile.image} alt="" className="size-full object-cover" sizes="(max-width: 599px) 45vw, (max-width: 1023px) 30vw, (max-width: 1375px) 18vw, 245px"/>
      </div>
      <span className="flex min-h-12 flex-1 items-center justify-between gap-1 px-3 py-2 text-sm font-semibold wrap-anywhere sm:px-4">
       {tile.name}<ArrowRight size={16} className="shrink-0 text-muted group-hover:text-brand-deep" aria-hidden="true"/>
      </span>
     </Link>
    </li>)}
   </ul>
  </HomeSection>

  <HomeSection title="Populaires" href="/catalogue" action="Catalogue">
   {popular.length?<ProductGrid products={popular}/>:<Empty title="La sélection arrive bientôt."><TextLink href="/demande-produit">Demander un produit</TextLink></Empty>}
  </HomeSection>

  <section className="mt-12 grid overflow-hidden rounded-feature border border-line bg-surface md:mt-16 md:grid-cols-2 lg:mt-20">
   <div className="flex flex-col items-start justify-center px-5 py-7 sm:p-8 lg:p-12">
    <span className="eyebrow">L’atelier</span>
    <h2 className="mt-3 mb-2 max-w-[17ch] text-section">Votre téléphone, réparé.</h2>
    <p className="mb-5 text-sm text-muted sm:text-base">Décrivez la panne pour demander une réparation.</p>
    <ButtonLink href="/reparation">Demander une réparation</ButtonLink>
   </div>
   <div className="relative aspect-video bg-stone-200 md:aspect-auto md:min-h-64">
    <Photo asset={repairImage} alt={repairAlt} className="absolute inset-0 size-full object-cover" sizes="(max-width: 767px) 92vw, (max-width: 1375px) 47vw, 640px"/>
   </div>
  </section>

  <HomeSection title="Nouveautés" href="/nouveautes" action="Voir plus">
   {newest.length?<ProductGrid products={newest}/>:<Empty title="Aucun nouveau produit pour le moment."/>}
  </HomeSection>
 </div>;
}
