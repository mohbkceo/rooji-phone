'use client';
import {startTransition,useActionState,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight} from 'lucide-react';
import {issues} from '@/lib/shared';
import {submitRequest} from '@/app/actions';
import {ActionForm,Field,FormMessage} from './forms';
type Identity={name:string;phone:string};

export function RepairForm({identity,dropoff}:{identity?:Identity;dropoff:boolean}){
 const [step,setStep]=useState(0);
 const [state,submit,pending]=useActionState(submitRequest.bind(null,'repair'),{});
 const form=useRef<HTMLFormElement>(null);
 const labels=['Appareil','Problème','Contact'];
 function go(){
  const fields=form.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-step="'+step+'"] input, [data-step="'+step+'"] select');
  if(fields&&Array.from(fields).every(input=>input.reportValidity()))setStep(step+1);
 }
 return <form ref={form} action={submit} className="form panel [&_legend]:mb-4 [&_legend]:text-lg [&_legend]:font-semibold [&_fieldset>.field]:mb-3 [&_fieldset>.form-grid]:mb-3" onSubmit={event=>{
  event.preventDefault();
  if(step<2){go();return;}
  const data=new FormData(event.currentTarget);
  startTransition(()=>submit(data));
 }}>
  <ol className="grid grid-cols-3 gap-2 border-b border-line pb-4">{labels.map((label,i)=><li key={label} aria-current={i===step?'step':undefined} className="flex min-w-0 flex-col items-start gap-1 text-xs font-medium text-muted aria-[current=step]:font-semibold aria-[current=step]:text-brand-deep min-[460px]:flex-row min-[460px]:items-center"><span className={`grid size-6 shrink-0 place-items-center rounded-full ${i<=step?'bg-brand-tint text-brand-deep':'bg-surface'}`}>{i+1}</span>{label}</li>)}</ol>
  <fieldset hidden={step!==0} data-step="0"><legend>Votre appareil</legend><div className="form-grid"><Field label="Marque"><input name="brand" required={step===0} maxLength={60} placeholder="Apple, Samsung…"/></Field><Field label="Modèle"><input name="model" required={step===0} maxLength={80}/></Field></div></fieldset>
  <fieldset hidden={step!==1} data-step="1"><legend>Quel est le problème ?</legend><div className="mb-4 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">{issues.map((issue,i)=><label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-control px-2 py-1.5 text-sm wrap-anywhere has-checked:border-brand has-checked:bg-brand-tint has-checked:text-brand-deep" key={issue}><input type="radio" name="issue" value={issue} required={step===1&&i===0}/><span>{issue}</span></label>)}</div>
   <Field label="Description (facultatif)"><textarea name="description" rows={3} maxLength={600}/></Field><Field label="Photos (facultatif, 3 max.)"><input name="photos" type="file" multiple accept="image/png,image/jpeg,image/webp"/></Field>
  </fieldset>
  <fieldset hidden={step!==2} data-step="2"><legend>Vos coordonnées</legend><div className="form-grid"><Field label="Nom"><input name="name" required={step===2} autoComplete="name" maxLength={100} defaultValue={identity?.name}/></Field><Field label="Téléphone"><input name="phone" required={step===2} type="tel" autoComplete="tel" maxLength={30} defaultValue={identity?.phone}/></Field></div><Field label="Dépôt"><select name="arrangement">{dropoff&&<option>Dépôt en boutique</option>}<option>À convenir</option></select></Field></fieldset>
  <FormMessage state={state}/>
  <div className="actions">{step>0&&<button type="button" className="button secondary" onClick={()=>setStep(step-1)}><ArrowLeft size={16}/> Retour</button>}
   {step<2?<button type="button" className="button primary" onClick={go}>Continuer <ArrowRight size={16}/></button>:<button type="submit" className="button primary" disabled={pending}>{pending?'Envoi…':'Envoyer la demande'}</button>}</div>
 </form>;
}
export function ProductRequestForm({identity,model,variant}:{identity?:Identity;model:string;variant:string}){
 return <div className="panel"><ActionForm action={submitRequest.bind(null,'product')} label="Envoyer la demande">
  <Field label="Produit ou modèle"><input name="product" required maxLength={110} defaultValue={model}/></Field>
  <div className="form-grid"><Field label="Variante (facultatif)"><input name="variant" maxLength={100} defaultValue={variant}/></Field><Field label="Quantité"><input name="quantity" type="number" min="1" max="20" required defaultValue={1}/></Field></div>
  <Field label="Photo (facultatif)"><input name="photos" type="file" accept="image/png,image/jpeg,image/webp"/></Field>
  <div className="form-grid"><Field label="Nom"><input name="name" required maxLength={100} autoComplete="name" defaultValue={identity?.name}/></Field><Field label="Téléphone"><input name="phone" type="tel" required maxLength={30} autoComplete="tel" defaultValue={identity?.phone}/></Field></div>
  <Field label="Détails (facultatif)"><textarea name="description" rows={3} maxLength={600}/></Field>
 </ActionForm></div>;
}
export function CopyLink(){
 const [status,setStatus]=useState('');
 return <><button type="button" className="button secondary" onClick={async()=>{
  try{const url=new URL(window.location.href);url.searchParams.delete('new');await navigator.clipboard.writeText(url.href);setStatus('Lien copié.');}
  catch{setStatus('Copiez le lien depuis la barre d’adresse.');}
 }}>Copier le lien de suivi</button><span className="muted" role="status">{status}</span></>;
}
