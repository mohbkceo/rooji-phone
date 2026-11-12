import {Empty} from './ui';
import {money} from '@/lib/shared';
export function Metrics({values}:{values:[string,string|number][]}) {
 return <div className="metrics">{values.map(([title,value])=><div className="panel metric" key={title}><span>{title}</span><strong>{value}</strong></div>)}</div>;
}
export function Bars({rows,currency=false}:{rows:{label:string;value:number}[];currency?:boolean}){
 if(!rows.length)return <Empty title="Pas de données sur cette période."/>;
 const max=Math.max(1,...rows.map(r=>r.value));
 return <ul className="bars">{rows.map(r=><li key={r.label}><div><span>{r.label}</span><strong>{currency?money(r.value):r.value}</strong></div><div className="bar-track" aria-hidden="true"><i style={{width:r.value/max*100+'%'}}/></div></li>)}</ul>;
}
