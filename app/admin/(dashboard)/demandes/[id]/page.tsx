import {requireAdmin} from '@/lib/auth';
import {RequestDetail} from '@/components/admin-details';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string}>}){
 await requireAdmin();
 return <RequestDetail kind="product" id={(await params).id} saved={(await searchParams).saved}/>;
}
