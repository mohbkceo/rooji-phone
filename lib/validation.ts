import {z} from 'zod';
import {fr} from 'zod/locales';
import {InputError} from './security.ts';

z.config(fr());

export const optional=(max:number)=>z.string().trim().max(max).default('');
export const required=(max:number)=>z.string().trim().min(1).max(max);
export const email=z.string().trim().toLowerCase().max(150).pipe(z.email());
export const phone=z.string().trim().max(30).transform(s=>s.replace(/[\s().-]/g,''))
 .transform(s=>s.startsWith('00213')?'+213'+s.slice(5):s.startsWith('0')?'+213'+s.slice(1):s)
 .refine(s=>/^\+213[1-9]\d{7,8}$/.test(s),'Numéro algérien invalide.');
export const contact=z.object({name:required(100),phone});
export const positiveInteger=(max:number)=>z.coerce.number().int().min(1).max(max);
export const priceInput=z.string().trim().regex(/^\d{1,8}(?:[.,]\d{1,2})?$/,'Montant invalide.').transform(s=>Math.round(Number(s.replace(',','.'))*100));
export function parse<T>(schema:z.ZodType<T>,data:unknown):T {
 const result=schema.safeParse(data);
 if(!result.success)throw new InputError(result.error.issues[0]?.message || 'Vérifiez les champs du formulaire.');
 return result.data;
}
export function object(form:FormData) {
 return Object.fromEntries(form.entries());
}
export function json(value:unknown) {
 if(typeof value!=='string')throw new InputError('Données invalides.');
 try{return JSON.parse(value);}catch{throw new InputError('Données invalides.');}
}
