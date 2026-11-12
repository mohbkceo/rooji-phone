# Vérifications de livraison

| Vérification | Résultat |
| --- | --- |
| `npm test` | 10 tests réussis. Le catalogue, la livraison à tarif configuré, le stock concurrent, l’idempotence, les annulations, les devis, la conversion, les statistiques, les liens privés et la validation des PNG sont couverts. |
| `npm run build` et `npm run typecheck` | Compilation de production et vérification TypeScript réussies. |
| `npm run test:http` | Trois scénarios réussis sur le serveur de production autonome. Connexion administrateur, upload PNG, publication, filtrage, HTML produit et sitemap. Réparation invitée, confidentialité de la photo, diagnostic et acceptation du devis. Demande produit, conversion, livraison, statistiques et séparation des rôles. |
| Navigateur | Sélection d’une variante, panier, commande invitée, total et confirmation avec lien privé vérifiés. Accueil et demande de réparation testés à 375 px sans défilement horizontal. |
| `npm audit --omit=dev` | Aucune vulnérabilité connue signalée au moment de la vérification. |

Les tests utilisent des données et des comptes temporaires. La livraison comprend uniquement les fichiers source, les photographies éditoriales et la configuration. Les pages, le sitemap et le JSON-LD ont été vérifiés localement. Le déploiement public, le lancement sur Docker, la validation externe du balisage et les mesures Lighthouse et Core Web Vitals sur un domaine de production restent à effectuer.
