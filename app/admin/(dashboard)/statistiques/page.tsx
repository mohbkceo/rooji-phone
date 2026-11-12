import {requireAdmin} from '@/lib/auth';
import {analytics,rangeFor} from '@/lib/analytics';
import {money} from '@/lib/shared';
import {AdminHead,AdminSection} from '@/components/admin-ui';
import {Bars,Metrics} from '@/components/analytics-ui';
import {first,type SearchParams} from '@/components/catalog-page';
export const metadata={title:'Statistiques'};
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){
 await requireAdmin();
 const params=await searchParams;
 const period=first(params.periode)||'30',range=rangeFor(period,first(params.du),first(params.au));
 const m=analytics(range);
 return <><AdminHead title="Statistiques"/><form className="list-filter" action="/admin/statistiques">
 <label className="field"><span>Période</span><select name="periode" defaultValue={period}><option value="today">Aujourd’hui</option><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option><option value="custom">Dates personnalisées</option></select></label>
 <label className="field"><span>Du</span><input type="date" name="du" defaultValue={range.start}/></label><label className="field"><span>Au</span><input type="date" name="au" defaultValue={range.end}/></label><button className="button secondary">Appliquer</button>
 </form>{range.invalid&&<p className="form-error">Période invalide. Choisissez une plage de 366 jours maximum.</p>}
 <p className="muted">Le chiffre d’affaires inclut la remise et suit la date de passage au statut Livrée. Le panier moyen porte sur ces commandes.</p>
 <Metrics values={[[ 'Chiffre d’affaires',money(m.revenue)],['Commandes reçues',m.orderCount],['Commandes livrées',m.deliveredCount],['Panier moyen',money(m.average)],['Réparations',m.repairCount],['Demandes produit',m.requestCount]]}/>
 <div className="admin-columns"><AdminSection title="Chiffre d’affaires"><Bars rows={m.revenueTrend} currency/></AdminSection><AdminSection title="Commandes reçues"><Bars rows={m.orderTrend}/></AdminSection><AdminSection title="Produits populaires"><Bars rows={m.popular}/></AdminSection><AdminSection title="Réparations par problème"><Bars rows={m.repairs}/></AdminSection><AdminSection title="Statuts des commandes"><Bars rows={m.states}/></AdminSection></div></>;
}
