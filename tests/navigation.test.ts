import assert from 'node:assert/strict';
import {test} from 'node:test';
import {isListForDetail, navigationDirection, pathnameOf, previousEntryHref, routeHref} from '../lib/navigation';

test('catalog and admin detail returns accept only relevant list origins, retaining the URL', () => {
 const filtered = '/catalogue?q=Apple&stock=1&tri=price-asc&page=2';
 assert.equal(isListForDetail(filtered, '/produit/iphone?variante=bleu'), true);
 assert.equal(isListForDetail('/categorie/smartphones?q=pro', '/produit/iphone'), true);
 assert.equal(isListForDetail('/nouveautes?page=2', '/produit/iphone'), true);
 assert.equal(isListForDetail('/reparation', '/produit/iphone'), false);
 assert.equal(isListForDetail('/admin/produits?statut=published', '/admin/produits/123'), true);
 assert.equal(isListForDetail('/admin/commandes?q=CMD', '/admin/reparations/123'), false);
 assert.equal(isListForDetail('/admin/produits-archive', '/admin/produits/123'), false);
 assert.equal(isListForDetail('/compte', '/suivi/REP-123'), true);
 assert.equal(pathnameOf(filtered), '/catalogue');
 assert.equal(routeHref(new URL('https://example.test/catalogue?marque=Test%20HTTP&stock=1')), '/catalogue?marque=Test+HTTP&stock=1');
 assert.equal(routeHref(new URL('https://example.test/catalogue?marque=Test+HTTP&stock=1')), '/catalogue?marque=Test+HTTP&stock=1');
});

test('direction follows known parent relationships in both directions', () => {
 for (const [parent, child] of [
  ['/catalogue?stock=1', '/produit/iphone'], ['/categorie/smartphones', '/produit/iphone'],
  ['/catalogue', '/categorie/smartphones'], ['/panier', '/commande'],
  ['/admin', '/admin/commandes'], ['/admin/commandes?page=2', '/admin/commandes/123'],
  ['/compte', '/suivi/REP-123'],
 ]) {
  assert.equal(navigationDirection(parent, child), 'forward', parent + ' → ' + child);
  assert.equal(navigationDirection(child, parent), 'backward', child + ' → ' + parent);
 }
});

test('sibling, filter-only, authentication and unrelated transitions stay neutral', () => {
 for (const [from, to] of [
  ['/catalogue', '/catalogue?stock=1'], ['/catalogue?page=2', '/catalogue?page=1'],
  ['/catalogue', '/reparation'], ['/', '/catalogue'], ['/produit/a', '/produit/b'],
  ['/categorie/smartphones', '/categorie/accessoires'], ['/admin/produits', '/admin/commandes'],
  ['/admin', '/admin/connexion'], ['/admin/connexion', '/admin'], ['/produit/iphone', '/commande'],
 ]) assert.equal(navigationDirection(from, to), 'neutral', from + ' → ' + to);
});

test('adjacent history context accepts same-origin URLs and rejects external or unavailable entries', () => {
 const entries = [{index: 0, url: 'https://example.test/catalogue?stock=1'}, {index: 1, url: 'https://example.test/produit/a'}];
 assert.equal(previousEntryHref(entries, 1, 'https://example.test'), '/catalogue?stock=1');
 assert.equal(previousEntryHref(entries, 0, 'https://example.test'), undefined);
 assert.equal(previousEntryHref(entries, 1, 'https://different.test'), undefined);
 assert.equal(previousEntryHref([{index: 0, url: null}], 1, 'https://example.test'), undefined);
});
