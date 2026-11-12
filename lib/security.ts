import {createHash,createHmac,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {run,transaction,get} from './db.ts';

const derive = promisify(scrypt);
export const id = () => randomBytes(16).toString('hex');
export const timestamp = (after?:string) => new Date(Math.max(Date.now(),after?Date.parse(after)+1:0)).toISOString();
export const digest = (value:string) => createHash('sha256').update(value).digest('hex');
export class InputError extends Error {}
export function same(a:string,b:string) {
 const x=Buffer.from(a),y=Buffer.from(b);
 return x.length===y.length && timingSafeEqual(x,y);
}
export function secret() {
 const value=process.env.APP_SECRET;
 if (!value || value.length<32) throw Error('APP_SECRET doit contenir au moins 32 caractères.');
 return value;
}
export function capability(scope:string,recordId:string) {
 return createHmac('sha256',secret()).update(scope+':'+recordId).digest('base64url');
}
export const hasCapability=(scope:string,recordId:string,token:string)=>/^[A-Za-z0-9_-]{43}$/.test(token)&&same(capability(scope,recordId),token);
export const tracking=(kind:string,recordId:string,ref:string)=>'/suivi/'+ref+'?t='+capability(kind,recordId);
export const reference=(kind:string)=>({order:'CMD',repair:'REP',product:'DEM'}[kind]??'REF')+'-'+randomBytes(8).toString('hex').toUpperCase();

export async function hashPassword(password:string) {
 const salt=randomBytes(16).toString('hex');
 const result=await derive(password,salt,64) as Buffer;
 return salt+':'+result.toString('hex');
}
export async function verifyPassword(password:string,stored?:string) {
 const [salt,key]=(stored??'00000000000000000000000000000000:'+ '0'.repeat(128)).split(':');
 const result=await derive(password,salt,64) as Buffer;
 return same(key,result.toString('hex')) && !!stored;
}
export function rateLimit(key:string,max:number,seconds:number) {
 const now=Math.floor(Date.now()/1000);
 const count=transaction(()=>{
   const old=get<{count:number;until:number}>('SELECT count,until FROM rate_limits WHERE key=?',key);
   if(old && old.until>now && old.count>=max)return old.count+1;
   const count=old && old.until>now ? old.count+1 : 1;
   const until=old && old.until>now ? old.until : now+seconds;
   run('INSERT INTO rate_limits VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,until=excluded.until',key,count,until);
   if (count===1) run('DELETE FROM rate_limits WHERE rowid IN (SELECT rowid FROM rate_limits WHERE until<=? LIMIT 100)',now);
   return count;
 });
 if(count>max)throw new InputError('Trop de tentatives. Réessayez plus tard.');
}
