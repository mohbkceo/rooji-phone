import {requireAdmin} from '@/lib/auth';
import {categories,settings} from '@/lib/catalog';
import {adminCategory,adminSettings} from '@/app/actions';
import {AdminHead} from '@/components/admin-ui';
import {ActionForm,Field} from '@/components/forms';
import {SinglePhoto} from '@/components/photo-editor';
import {asDzd} from '@/lib/shared';
export const metadata={title:'Paramètres'};
export default async function Page(){
 await requireAdmin();
 const s=settings();
 return <><AdminHead title="Paramètres"/>
 <ActionForm action={adminSettings} className="form product-editor">
 <section className="panel"><h2>Page d’accueil</h2><Field label="Titre de la bannière"><input name="heroTitle" maxLength={90} defaultValue={s.heroTitle} required/></Field><Field label="Lien du bouton"><input name="heroLink" maxLength={145} defaultValue={s.heroLink} required/></Field><div className="form-grid"><div><h3>Photo de la bannière</h3><SinglePhoto name="heroImage" initial={s.heroImage}/><Field label="Description de la photo"><input name="heroAlt" maxLength={150} defaultValue={s.heroAlt}/></Field></div><div><h3>Photo de l’atelier</h3><SinglePhoto name="repairImage" initial={s.repairImage}/><Field label="Description de la photo"><input name="repairAlt" maxLength={150} defaultValue={s.repairAlt}/></Field></div></div></section>
 <section className="panel"><h2>Boutique</h2><div className="form-grid"><Field label="Téléphone"><input name="phone" type="tel" maxLength={32} defaultValue={s.phone}/></Field><Field label="E-mail"><input name="email" type="email" maxLength={150} defaultValue={s.email}/></Field><Field label="Adresse"><input name="address" maxLength={250} defaultValue={s.address}/></Field><Field label="Ville"><input name="city" maxLength={100} defaultValue={s.city}/></Field><Field label="Instagram"><input name="instagram" type="url" maxLength={250} defaultValue={s.instagram}/></Field><Field label="Facebook"><input name="facebook" type="url" maxLength={250} defaultValue={s.facebook}/></Field></div><Field label="Horaires"><textarea name="hours" rows={2} maxLength={200} defaultValue={s.hours}/></Field></section>
 <section className="panel"><h2>Remise et informations</h2><div className="form-grid"><label className="check"><input name="pickup" type="checkbox" defaultChecked={s.pickup}/> Retrait en boutique</label><label className="check"><input name="delivery" type="checkbox" defaultChecked={s.delivery}/> Paiement à la livraison</label></div><Field label="Tarif de livraison (DA)"><input name="deliveryFee" inputMode="decimal" defaultValue={asDzd(s.deliveryFee)} required/></Field>
 <Field label="Livraison"><textarea name="deliveryText" rows={3} maxLength={4500} defaultValue={s.deliveryText}/></Field><Field label="Retours"><textarea name="returnsText" rows={3} maxLength={4500} defaultValue={s.returnsText}/></Field><Field label="Mentions légales"><textarea name="legalText" rows={4} maxLength={7000} defaultValue={s.legalText}/></Field></section>
 </ActionForm>
 <section className="panel admin-section product-editor"><h2>Catégories</h2>{[...categories(),{id:'',slug:'',name:'',image:''}].map(c=><details key={c.id||'new'} className="category-settings"><summary>{c.name||'Ajouter une catégorie'}</summary><ActionForm action={adminCategory} label={c.id?'Enregistrer':'Ajouter'}><input type="hidden" name="id" value={c.id}/><Field label="Nom"><input name="name" required maxLength={75} defaultValue={c.name}/></Field><SinglePhoto name="image" initial={c.image}/></ActionForm></details>)}</section></>;
}
