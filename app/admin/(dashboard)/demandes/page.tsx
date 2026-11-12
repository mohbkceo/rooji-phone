import {AdminList} from '@/components/admin-lists';
import type {SearchParams} from '@/components/catalog-page';
import {requireAdmin} from '@/lib/auth';
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){await requireAdmin();return <AdminList kind="product" params={await searchParams}/>;}
