import {cookies,headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {get,run} from './db';
import {digest,id,rateLimit} from './security';
import type {User} from './types';

const cookieName='roudji_session';
export async function currentUser() {
 const token=(await cookies()).get(cookieName)?.value;
 if(!token || !/^[a-f0-9]{64}$/.test(token))return;
 return get<User>('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.digest=? AND s.expires>?',digest(token),Date.now());
}
export async function requireAdmin() {
 const user=await currentUser();
 if(!user || user.role!=='admin')redirect('/admin/connexion');
 return user;
}
export async function newSession(user:User) {
 const store=await cookies();
 const existing=store.get(cookieName)?.value;
 if(existing)run('DELETE FROM sessions WHERE digest=?',digest(existing));
 run('DELETE FROM sessions WHERE expires<=?',Date.now());
 const token=id()+id(), maxAge=user.role==='admin'?8*60*60:30*24*60*60;
 run('INSERT INTO sessions VALUES(?,?,?)',digest(token),user.id,Date.now()+maxAge*1000);
 store.set(cookieName,token,{path:'/',httpOnly:true,sameSite:'lax',secure:process.env.COOKIE_SECURE!=='false',maxAge});
}
export async function clearSession() {
 const store=await cookies(), token=store.get(cookieName)?.value;
 if(token)run('DELETE FROM sessions WHERE digest=?',digest(token));
 store.delete(cookieName);
}
export async function throttle(scope:string,identifier?:string) {
 const header=process.env.CLIENT_IP_HEADER;
 const ip=header?(await headers()).get(header)?.trim().slice(0,80):undefined;
 const limits=scope==='auth'?[30,100,8]:scope==='upload'?[240,320,200]:[45,200,15];
 if(ip)rateLimit(scope+':ip:'+digest(ip),limits[0],900);
 else rateLimit(scope+':global',limits[1],900);
 if(identifier)rateLimit(scope+':id:'+digest(identifier),limits[2],900);
}
