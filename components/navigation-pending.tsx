'use client';
import {useLinkStatus} from 'next/link';

export function NavigationPending() {
 const {pending} = useLinkStatus();
 return <><span className="navigation-pending" data-pending={pending || undefined} aria-hidden="true"/>
  <span className="sr-only" role="status">{pending ? 'Chargement…' : ''}</span></>;
}
