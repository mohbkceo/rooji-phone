'use client';

import {useCallback, useEffect, useRef, useState, type RefObject} from 'react';

const approvedExits = new WeakSet<Event>();

/** Native confirmations cover link exits and document unload without trapping history. */
export function useUnsavedForm(form: RefObject<HTMLFormElement | null>, enabled: boolean, pending: boolean) {
 const [dirty, setDirty] = useState(false);
 const baseline = useRef('');
 const signature = useCallback(() => form.current ? JSON.stringify(Array.from(new FormData(form.current), ([key, value]) =>
  [key, typeof value === 'string' ? value : [value.name, value.size, value.lastModified]])) : '', [form]);
 const markSaved = useCallback(() => {baseline.current = signature();setDirty(false);}, [signature]);
 useEffect(() => {
  if (!enabled || !form.current) return;
  baseline.current = signature();
  const changed = () => setDirty(signature() !== baseline.current);
  const node = form.current;
  node.addEventListener('input', changed);
  node.addEventListener('change', changed);
  const observer = new MutationObserver(changed);
  observer.observe(node, {attributes: true, attributeFilter: ['value'], childList: true, subtree: true});
  return () => {node.removeEventListener('input', changed);node.removeEventListener('change', changed);observer.disconnect();};
 }, [enabled, form, signature]);
 useEffect(() => {
  if (!enabled || !dirty || pending) return;
  const unload = (event: BeforeUnloadEvent) => {event.preventDefault();event.returnValue = '';};
  const leave = (event: MouseEvent) => {
   if (approvedExits.has(event) || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
   if (!link || link.download || link.target && link.target !== '_self') return;
   const url = new URL(link.href);
   // External document exits use beforeunload; tel/mail links do not discard the form.
   if (url.origin !== location.origin) return;
   if (url.pathname === location.pathname && url.search === location.search) return;
   if (!confirm('Quitter cette page ? Les modifications non enregistrées seront perdues.')) {
    event.preventDefault();event.stopImmediatePropagation();
   } else approvedExits.add(event);
  };
  window.addEventListener('beforeunload', unload);
  document.addEventListener('click', leave, true);
  return () => {window.removeEventListener('beforeunload', unload);document.removeEventListener('click', leave, true);};
 }, [enabled, dirty, pending]);
 return markSaved;
}
