import {privateMetadata} from '@/lib/seo';
export const metadata=privateMetadata;
export const dynamic='force-dynamic';
export default function Layout({children}:{children:React.ReactNode}){return children;}
