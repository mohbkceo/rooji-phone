'use client';

import Link from 'next/link';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import {createContext, Suspense, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {adminSections, isListForDetail, navigationDirection, pathnameOf, previousEntryHref, routeHref} from '@/lib/navigation';
import {animateNavigation} from '@/lib/motion';

type Snapshot = {y: number; focusHref?: string};
type Intent = {href: string; from: string; kind: 'push' | 'pop'};
const NavigationContext = createContext<{previous?: string}>({});

function RouteObserver({commit}: {commit: (href: string) => void}) {
 const pathname = usePathname(), params = useSearchParams();
 const query = params.toString();
 useEffect(() => {commit(pathname + (query ? '?' + query : ''));}, [pathname, query, commit]);
 return null;
}

/** Observe Next's navigation; never wrap history methods or create history entries. */
export function NavigationProvider({children}: {children: React.ReactNode}) {
 const current = useRef('');
 const intent = useRef<Intent | undefined>(undefined);
 const snapshots = useRef(new Map<string, Snapshot>());
 const animation = useRef<Animation | undefined>(undefined);
 const settle = useRef<(() => void) | undefined>(undefined);
 const [previous, setPrevious] = useState<string>();

 const save = useCallback((focusHref?: string) => {
  if (!current.current) return;
  snapshots.current.set(current.current, {y: window.scrollY, focusHref: focusHref || snapshots.current.get(current.current)?.focusHref});
  if (snapshots.current.size > 40) snapshots.current.delete(snapshots.current.keys().next().value!);
 }, []);

 useEffect(() => {
  const click = (event: MouseEvent) => {
   if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
   if (!link || link.download || link.target && link.target !== '_self') return;
   const url = new URL(link.href);
   const href = routeHref(url);
   if (url.origin !== location.origin || href === current.current) return;
   save(link.getAttribute('href') || undefined);
   intent.current = {href, from: current.current, kind: 'push'};
  };
  const pop = () => {
   save();
   intent.current = {href: routeHref(new URL(location.href)), from: current.current, kind: 'pop'};
  };
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => {if (media.matches) animation.current?.cancel();};
  document.addEventListener('click', click, true);
  window.addEventListener('popstate', pop);
  media.addEventListener('change', reduce);
  return () => {
   document.removeEventListener('click', click, true);
   window.removeEventListener('popstate', pop);
   media.removeEventListener('change', reduce);
   animation.current?.cancel();
   settle.current?.();
  };
 }, [save]);

 const commit = useCallback((href: string) => {
  if (href === current.current) return;
  const from = current.current, pending = intent.current;
  const arrived = pending?.href === href ? pending : undefined;
  current.current = href;
  intent.current = undefined;
  // The optional standard Navigation API can identify an adjacent same-origin entry
  // after Forward or refresh. Older engines use the witnessed Next Link push only.
  const navigation = (window as Window & {navigation?: {
   currentEntry?: {index: number}; entries: () => {index: number; url: string | null}[];
  }}).navigation;
  let nativePrevious: string | undefined;
  try {
   if (navigation?.currentEntry && typeof navigation.entries === 'function') nativePrevious = previousEntryHref(navigation.entries(), navigation.currentEntry.index, location.origin);
  } catch { /* History metadata is an enhancement; the captured origin remains usable. */ }
  setPrevious(nativePrevious || (arrived?.kind === 'push' ? arrived.from : undefined));
  animation.current?.cancel();
  settle.current?.();
  if (!from) return;

  const snapshot = arrived?.kind === 'pop' ? snapshots.current.get(href) : undefined;
  let frame = 0;
  const finish = () => {
   const main = document.getElementById('contenu');
   const heading = main?.querySelector<HTMLElement>('h1');
   if (!main || !heading?.getClientRects().length || main.querySelector('[data-route-loading]')) return;
   observer.disconnect();
   const samePage = pathnameOf(from) === pathnameOf(href);
   frame = requestAnimationFrame(() => {
    // Respect explicit in-page destinations, including the search shortcut.
    if (location.hash) {
     let hash = location.hash.slice(1);
     try {hash = decodeURIComponent(hash);} catch { /* A malformed hash must not interrupt navigation. */ }
     const target = document.getElementById(hash);
     if (target) {
      target.scrollIntoView();
      (target.querySelector<HTMLElement>('input, button, a') || target).focus({preventScroll: true});
     }
     return;
    }
    const originLink = snapshot?.focusHref && Array.from(main.querySelectorAll<HTMLAnchorElement>('a[href]'))
     .find(link => link.getAttribute('href') === snapshot.focusHref);
    const target = originLink || (samePage ? main.querySelector<HTMLElement>('[data-results-heading]') : null) || heading;
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.tabIndex = -1;
    target.focus({preventScroll: true});
    if (snapshot) window.scrollTo({top: snapshot.y, behavior: 'instant'});
    else if (!samePage) window.scrollTo({top: 0, behavior: 'instant'});

    if (samePage) return;
    const direction = navigationDirection(from, href);
    main.dataset.navigation = direction;
    animation.current = animateNavigation(main, direction, matchMedia('(prefers-reduced-motion: reduce)').matches, getComputedStyle(main).direction === 'rtl');
   });
  };
  // A loading boundary may commit before the streamed destination. Focus it only when ready.
  const observer = new MutationObserver(finish);
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden']});
  settle.current = () => {observer.disconnect();cancelAnimationFrame(frame);};
  finish();
 }, []);

 return <NavigationContext.Provider value={{previous}}>
  <Suspense fallback={null}><RouteObserver commit={commit}/></Suspense>
  {children}
 </NavigationContext.Provider>;
}

/** A real previous relevant list when witnessed; a canonical parent on direct entry. */
export function BackLink({fallback, children = 'Retour aux résultats'}: {fallback: string; children?: React.ReactNode}) {
 const {previous} = useContext(NavigationContext);
 const pathname = usePathname(), router = useRouter();
 const canReturn = !!previous && isListForDetail(previous, pathname);
 return <Link className="back-link" href={canReturn ? previous : fallback} onNavigate={event => {
  if (canReturn) {event.preventDefault();router.back();}
 }}>{canReturn && pathnameOf(previous) === '/compte' ? 'Retour à mon compte' : children}</Link>;
}

export function AdminWayfinding({title}: {title: string}) {
 const pathname = usePathname();
 const [, , section, detail] = pathname.split('/');
 if (!section) return null;
 const label = adminSections[section];
 if (!label) return null;
 const parent = '/admin/' + section;
 return <div className="wayfinding">
  {detail && <BackLink fallback={parent}>Retour · {label}</BackLink>}
  <nav className="breadcrumbs" aria-label="Fil d’Ariane">
   <ol><li><Link href="/admin">Administration</Link></li>
    {detail ? <><li><Link href={parent}>{label}</Link></li><li aria-current="page">{title}</li></> : <li aria-current="page">{title}</li>}
   </ol>
  </nav>
 </div>;
}

export function ShopUtilityLink({href, label, children}: {href: string; label: string; children: React.ReactNode}) {
 const path = usePathname();
 const active = href === '/compte' ? ['/compte', '/connexion', '/inscription'].includes(path) : path === href;
 const searchHere = href === '/catalogue#recherche' && path === '/catalogue';
 return <Link className="icon-link" href={searchHere ? '#recherche' : href} aria-label={label} aria-current={path === href ? 'page' : undefined} data-active={active || undefined} onNavigate={() => {
  if (searchHere) requestAnimationFrame(() => {
   document.getElementById('recherche')?.scrollIntoView();
   document.querySelector<HTMLInputElement>('#recherche input[type="search"]')?.focus({preventScroll: true});
  });
 }}>{children}</Link>;
}
