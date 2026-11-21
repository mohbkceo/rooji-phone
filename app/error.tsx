'use client';
import {ErrorRecovery} from '@/components/error-recovery';
export default function ErrorPage({reset}:{reset:()=>void}){
 return <main id="contenu" tabIndex={-1}><ErrorRecovery reset={reset}/></main>;
}
