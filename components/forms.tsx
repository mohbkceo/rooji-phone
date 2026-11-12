'use client';
import {startTransition,useActionState} from 'react';
import type {ActionState} from '@/lib/shared';

export function FormMessage({state}:{state:ActionState}) {
 return <div aria-live="polite">{state.error&&<p className="form-error" role="alert">{state.error}</p>}{state.success&&<p className="form-success" role="status">{state.success}</p>}</div>;
}
export function ActionForm({action,children,label='Enregistrer',className='form',disabled=false}:{action:(state:ActionState,form:FormData)=>Promise<ActionState>;children:React.ReactNode;label?:string;className?:string;disabled?:boolean}){
 const [state,submit,pending]=useActionState(action,{});
 return <form action={submit} className={className} onSubmit={event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter);
  startTransition(()=>submit(data));
 }}>{children}<FormMessage state={state}/><button type="submit" className="button primary" disabled={pending||disabled}>{pending?'En cours…':label}</button></form>;
}
export function Field({label,children}:{label:string;children:React.ReactNode}){
 return <label className="field"><span>{label}</span>{children}</label>;
}
