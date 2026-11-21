/** Explicit information relationships, not URL depth or a fabricated history. */
export type MotionDirection = 'forward' | 'backward' | 'neutral';

export const adminSections: Record<string, string> = {
 produits: 'Produits', commandes: 'Commandes', reparations: 'Réparations',
 demandes: 'Demandes produit', clients: 'Clients', statistiques: 'Statistiques', parametres: 'Paramètres',
};

export function pathnameOf(href: string) {
 return href.split(/[?#]/, 1)[0];
}

/** Match the router's query serialization, including equivalent %20 / + spaces. */
export function routeHref(url: URL) {
 const query = url.searchParams.toString();
 return url.pathname + (query ? '?' + query : '');
}

export function previousEntryHref(entries: {index: number; url: string | null}[], index: number, origin: string) {
 const previous = entries.find(entry => entry.index === index - 1)?.url;
 if (!previous) return;
 try {
  const url = new URL(previous);
  if (url.origin === origin) return url.pathname + url.search;
 } catch { /* Unavailable or invalid entries cannot establish a safe Back destination. */ }
}

export function isListForDetail(list: string, detail: string) {
 const from = pathnameOf(list), to = pathnameOf(detail);
 if (to.startsWith('/produit/')) return from === '/catalogue' || from === '/nouveautes' || /^\/categorie\/[^/]+$/.test(from);
 if (/^\/admin\/[^/]+\/[^/]+$/.test(to)) return from === to.slice(0, to.lastIndexOf('/'));
 if (to.startsWith('/suivi/')) return from === '/suivi' || from === '/compte';
 return false;
}

function isParent(parent: string, child: string) {
 return isListForDetail(parent, child)
  || (parent === '/catalogue' && child.startsWith('/categorie/'))
  || (parent === '/panier' && child === '/commande')
  || (parent === '/admin' && /^\/admin\/[^/]+$/.test(child) && child.slice(7) in adminSections);
}

export function navigationDirection(from: string, to: string): MotionDirection {
 const a = pathnameOf(from), b = pathnameOf(to);
 if (a === b) return 'neutral';
 if (isParent(a, b)) return 'forward';
 if (isParent(b, a)) return 'backward';
 return 'neutral';
}
