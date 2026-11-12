import {all} from '@/lib/db';
import {AdminHead,OrdersTable,RequestsTable,ListFilter,AdminPageLinks} from './admin-ui';
import {first,type SearchParams} from './catalog-page';
import {orderStates,repairStates,requestStates} from '@/lib/shared';
import type {Order,RequestRecord} from '@/lib/types';

const definitions={
 order:{title:'Commandes',path:'/admin/commandes',states:orderStates},
 repair:{title:'Réparations',path:'/admin/reparations',states:repairStates},
 product:{title:'Demandes produit',path:'/admin/demandes',states:requestStates},
};
export function AdminList({kind,params}:{kind:keyof typeof definitions;params:SearchParams}){
 const {title,path,states}=definitions[kind],q=first(params.q).trim().slice(0,100),state=first(params.statut);
 const rawPage=Number(first(params.page)),page=Number.isInteger(rawPage)?Math.min(10000,Math.max(1,rawPage)):1;
 const filters:string[]=[],args:(string|number)[]=[];
 if(kind!=='order'){filters.push('kind=?');args.push(kind);}
 if(q){filters.push('(instr(lower(ref),lower(?))>0 OR instr(lower(name),lower(?))>0 OR instr(phone,?)>0'+(kind==='order'?'':' OR instr(lower(details),lower(?))>0')+')');args.push(q,q,q);if(kind!=='order')args.push(q);}
 if(state&&(states as readonly string[]).includes(state)){filters.push('state=?');args.push(state);}
 const where=filters.length?' WHERE '+filters.join(' AND '):'';
 const rows=all<Order|RequestRecord>('SELECT * FROM '+(kind==='order'?'orders':'requests')+where+' ORDER BY created DESC,id LIMIT 31 OFFSET ?',...args,(page-1)*30);
 return <><AdminHead title={title}/><section className="panel admin-section"><ListFilter action={path} q={q} state={state} states={states}/>
 {kind==='order'?<OrdersTable orders={rows.slice(0,30) as Order[]}/>:<RequestsTable kind={kind} records={rows.slice(0,30) as RequestRecord[]}/>}
 <AdminPageLinks path={path} page={page} more={rows.length>30} q={q} state={state}/></section></>;
}
