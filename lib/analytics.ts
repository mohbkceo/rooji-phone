import {all,get} from './db';

const day=86400000;
export const localDay=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Algiers',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
const validDay=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const shift=(date:string,days:number)=>new Date(Date.parse(date)+days*day).toISOString().slice(0,10);
export function rangeFor(period:string,from='',to=''){
 const today=localDay(new Date());
 const custom=period==='custom'&&validDay(from)&&validDay(to)&&from<=to&&(Date.parse(to)-Date.parse(from))/day<=365;
 const start=custom?from:shift(today,period==='today'?0:period==='7'? -6:-29);
 const end=custom?to:today;
 const iso=(date:string)=>new Date(date+'T00:00:00+01:00').toISOString();
 return {start,end,from:iso(start),until:iso(shift(end,1)),invalid:period==='custom'&&!custom};
}
type Datum={label:string;value:number};
export function analytics(range:{from:string;until:string}){
 const {from,until}=range;
 const created='created>=? AND created<?', delivered=`FROM orders o JOIN history h ON h.record_id=o.id AND h.state='Livrée' WHERE o.state='Livrée' AND h.id=(SELECT MIN(a.id) FROM history a WHERE a.record_id=o.id AND a.state='Livrée') AND h.${created.replace(' AND created',' AND h.created')}`;
 const orderCount=get<{n:number}>('SELECT COUNT(*) AS n FROM orders WHERE '+created,from,until)?.n??0;
 const {revenue=0,deliveredCount=0}=get<{revenue:number;deliveredCount:number}>('SELECT COALESCE(SUM(o.total),0) AS revenue,COUNT(*) AS deliveredCount '+delivered,from,until)??{};
 const count=(kind:string)=>get<{n:number}>('SELECT COUNT(*) AS n FROM requests WHERE kind=? AND '+created,kind,from,until)?.n??0;
 const bucket=range.until.slice(0,4)!==range.from.slice(0,4)||Date.parse(until)-Date.parse(from)>day*45?'%Y-%m':'%Y-%m-%d';
 const revenueTrend=all<Datum>(`SELECT strftime(?,h.created,'+1 hour') AS label,SUM(o.total) AS value ${delivered} GROUP BY label ORDER BY label`,bucket,from,until);
 const orderTrend=all<Datum>(`SELECT strftime(?,created,'+1 hour') AS label,COUNT(*) AS value FROM orders WHERE ${created} GROUP BY label ORDER BY label`,bucket,from,until);
 const popular=all<Datum>(`SELECT i.title AS label,SUM(i.quantity) AS value FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.state<>'Annulée' AND o.created>=? AND o.created<? GROUP BY i.title ORDER BY value DESC LIMIT 6`,from,until);
 const repairs=all<Datum>(`SELECT json_extract(details,'$.issue') AS label,COUNT(*) AS value FROM requests WHERE kind='repair' AND ${created} GROUP BY label ORDER BY value DESC`,from,until);
 const states=all<Datum>(`SELECT state AS label,COUNT(*) AS value FROM orders WHERE ${created} GROUP BY state ORDER BY value DESC`,from,until);
 return {orderCount,revenue,deliveredCount,average:deliveredCount?Math.round(revenue/deliveredCount):0,repairCount:count('repair'),requestCount:count('product'),revenueTrend,orderTrend,popular,repairs,states};
}
