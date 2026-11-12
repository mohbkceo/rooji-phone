import {requireAdmin} from '@/lib/auth';
import {OrderDetail} from '@/components/admin-details';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{saved?:string}>}){
 await requireAdmin();
 return <OrderDetail id={(await params).id} saved={(await searchParams).saved}/>;
}
