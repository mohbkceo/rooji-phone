import {requireAdmin} from '@/lib/auth';
import {all,get} from '@/lib/db';
import {analytics,rangeFor} from '@/lib/analytics';
import {money} from '@/lib/shared';
import {AdminHead,AdminSection,OrdersTable,RequestsTable} from '@/components/admin-ui';
import {Bars,Metrics} from '@/components/analytics-ui';
import type {Order,RequestRecord} from '@/lib/types';
export const metadata={title:'Tableau de bord'};
export default async function Page(){
 await requireAdmin();
 const m=analytics(rangeFor('30'));
 const orders=all<Order>('SELECT * FROM orders ORDER BY created DESC LIMIT 5');
 const repairs=all<RequestRecord>("SELECT * FROM requests WHERE kind='repair' AND state NOT IN ('Terminée','Annulée') ORDER BY created DESC LIMIT 5");
 const requests=all<RequestRecord>("SELECT * FROM requests WHERE kind='product' ORDER BY created DESC LIMIT 5");
 const pending=get<{n:number}>("SELECT COUNT(*) AS n FROM requests WHERE kind='repair' AND state NOT IN ('Terminée','Annulée')")?.n??0;
 return <><AdminHead title="Tableau de bord"/><Metrics values={[[ 'Chiffre d’affaires · 30 j',money(m.revenue)],['Commandes · 30 j',m.orderCount],['Réparations en cours',pending],['Demandes produit · 30 j',m.requestCount]]}/>
 <AdminSection title="Commandes récentes" href="/admin/commandes"><OrdersTable orders={orders}/></AdminSection>
 <div className="admin-columns"><AdminSection title="Réparations en cours" href="/admin/reparations"><RequestsTable records={repairs} kind="repair"/></AdminSection><AdminSection title="Demandes produit" href="/admin/demandes"><RequestsTable records={requests} kind="product"/></AdminSection></div>
 <AdminSection title="Ventes livrées · 30 jours" href="/admin/statistiques"><Bars rows={m.revenueTrend} currency/></AdminSection></>;
}
