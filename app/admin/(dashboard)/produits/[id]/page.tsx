import {notFound} from 'next/navigation';
import {requireAdmin} from '@/lib/auth';
import {all,get} from '@/lib/db';
import {categories} from '@/lib/catalog';
import {AdminHead,Saved} from '@/components/admin-ui';
import {ProductEditor} from '@/components/product-editor';
import {TextLink} from '@/components/ui';
import type {Product,Variant} from '@/lib/types';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string}>}){
 await requireAdmin();
 const {id}=await params;
 const product=id==='nouveau'?undefined:get<Product>('SELECT * FROM products WHERE id=?',id);
 if(id!=='nouveau'&&!product)notFound();
 const variants=product?all<Variant>('SELECT * FROM variants WHERE product_id=? AND active=1 ORDER BY rowid',product.id):[];
 return <><TextLink href="/admin/produits">Produits</TextLink><AdminHead title={product?.name||'Nouveau produit'}>{product?.status==='published'&&<TextLink href={'/produit/'+product.slug}>Voir en boutique</TextLink>}</AdminHead><Saved show={(await searchParams).saved}/>
 <ProductEditor key={product?.updated||'new'} product={product} variants={variants} categories={categories()}/></>;
}
