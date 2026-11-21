'use client';
import {startTransition,useActionState,useEffect,useRef,useState} from 'react';
import {issues} from '@/lib/shared';
import {submitRequest} from '@/app/actions';
import {ActionForm,Field,FormMessage} from './forms';
import {useUnsavedForm} from './use-unsaved-form';
type Identity={name:string;phone:string};

export function RepairForm({identity,dropoff}:{identity?:Identity;dropoff:boolean}){
 const [step,setStep]=useState(0);
 const [review,setReview]=useState({device:'',issue:''});
 const [state,submit,pending]=useActionState(submitRequest.bind(null,'repair'),{});
 const form=useRef<HTMLFormElement>(null);
 const previousStep=useRef(step);
 useUnsavedForm(form,true,pending);
 useEffect(()=>{
  if(previousStep.current===step)return;
  previousStep.current=step;
  form.current?.querySelector<HTMLElement>('[data-step="'+step+'"] [data-step-heading]')?.focus();
 },[step]);
 const labels=['Appareil','Problème','Contact'];
 function go(){
  const fields=form.current?.querySelectorAll<HTMLInputElement|HTMLSelectElement>('[data-step="'+step+'"] input, [data-step="'+step+'"] select');
  if(fields&&Array.from(fields).every(input=>input.reportValidity())){
   if(step===1&&form.current){const data=new FormData(form.current);setReview({device:[data.get('brand'),data.get('model')].join(' '),issue:String(data.get('issue')||'')});}
   setStep(step+1);
  }
 }
 return <form ref={form} action={submit} aria-busy={pending} className="form panel [&_legend]:mb-4 [&_legend]:text-lg [&_legend]:font-semibold [&_fieldset>.field]:mb-3 [&_fieldset>.form-grid]:mb-3" onSubmit={event=>{
  event.preventDefault();
  if(step<2){go();return;}
  const data=new FormData(event.currentTarget);
  startTransition(()=>submit(data));
 }}>
  <ol className="grid grid-cols-3 gap-2 border-b border-line pb-4">{labels.map((label,i)=><li key={label} aria-current={i===step?'step':undefined} className="flex min-w-0 flex-col items-start gap-1 text-sm font-medium text-muted aria-[current=step]:font-semibold aria-[current=step]:text-brand-deep min-[460px]:flex-row min-[460px]:items-center"><button type="button" className="flex min-h-11 items-center gap-2 text-start disabled:cursor-default disabled:opacity-100" disabled={i>=step||pending} onClick={()=>setStep(i)} aria-label={i<step?'Modifier : '+label:undefined}><span className={`grid size-6 shrink-0 place-items-center rounded-full ${i<=step?'bg-brand-tint text-brand-deep':'bg-surface'}`}>{i+1}</span>{label}</button></li>)}</ol>
  <fieldset hidden={step!==0} data-step="0"><legend><span tabIndex={-1} data-step-heading role="heading" aria-level={2}>Votre appareil</span></legend><div className="form-grid"><Field label="Marque"><input name="brand" required={step===0} maxLength={60} placeholder="Apple, Samsung…"/></Field><Field label="Modèle"><input name="model" required={step===0} maxLength={80}/></Field></div></fieldset>
  <fieldset hidden={step!==1} data-step="1"><legend><span tabIndex={-1} data-step-heading role="heading" aria-level={2}>Quel est le problème ?</span></legend><div className="mb-4 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 md:grid-cols-2 xl:grid-cols-3">{issues.map((issue,i)=><label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-control px-2 py-1.5 text-sm wrap-anywhere has-checked:border-brand has-checked:bg-brand-tint has-checked:text-brand-deep" key={issue}><input type="radio" name="issue" value={issue} required={step===1&&i===0}/><span>{issue}</span></label>)}</div>
   <Field label="Description (facultatif)"><textarea name="description" rows={3} maxLength={600}/></Field><Field label="Photos (facultatif, 3 max.)"><input name="photos" type="file" multiple accept="image/png,image/jpeg,image/webp"/></Field>
  </fieldset>
  <fieldset hidden={step!==2} data-step="2"><legend><span tabIndex={-1} data-step-heading role="heading" aria-level={2}>Vos coordonnées</span></legend><dl className="repair-review mb-4"><div><dt>Appareil</dt><dd>{review.device}</dd></div><div><dt>Problème</dt><dd>{review.issue}</dd></div></dl><div className="form-grid"><Field label="Nom"><input name="name" required={step===2} autoComplete="name" maxLength={100} defaultValue={identity?.name}/></Field><Field label="Téléphone"><input name="phone" required={step===2} type="tel" autoComplete="tel" maxLength={30} defaultValue={identity?.phone}/></Field></div><Field label="Dépôt"><select name="arrangement">{dropoff&&<option>Dépôt en boutique</option>}<option>À convenir</option></select></Field></fieldset>
  <FormMessage state={state}/>
  <div className="actions">{step>0&&<button type="button" className="button secondary" onClick={()=>setStep(step-1)}>Retour</button>}
   <button type="button" className="button primary" hidden={step===2} onClick={event=>{event.preventDefault();go();}}>Continuer</button><button type="submit" className="button primary" hidden={step<2} disabled={pending}>{pending?'Envoi…':'Envoyer la demande'}</button></div>
 </form>;
}
export function ProductRequestForm({identity,model,variant}:{identity?:Identity;model:string;variant:string}){
 return <div className="panel"><ActionForm protect action={submitRequest.bind(null,'product')} label="Envoyer la demande">
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
