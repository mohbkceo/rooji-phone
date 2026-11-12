import {all,get} from './db';
import {currentUser} from './auth';
import {hasCapability} from './security';
import type {History,Order,RequestRecord} from './types';

export async function lookup(ref:string,token='') {
 if(!/^(CMD|REP|DEM)-[0-9A-F]{16}$/.test(ref))return;
 const order=ref.startsWith('CMD');
 const record=order?get<Order>('SELECT * FROM orders WHERE ref=?',ref):get<RequestRecord>('SELECT * FROM requests WHERE ref=?',ref);
 if(!record)return;
 const kind='kind' in record?record.kind:'order';
 const user=await currentUser();
 if(!hasCapability(kind,record.id,token) && (!user || user.role!=='admin' && user.id!==record.user_id))return;
 return record;
}
export const history=(recordId:string)=>all<History>('SELECT state,note,created FROM history WHERE record_id=? ORDER BY id DESC',recordId);
