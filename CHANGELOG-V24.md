# Changelog V24 — Comparaison avec my2kbuilds et intégration

## Ce que my2kbuilds fait mieux (et qui est maintenant intégré)

| Leur atout | Ce qui a été fait |
|---|---|
| **Une page web par build**, indexée par Google, avec Open Graph et données structurées | Nouvelle Function `functions/b/[id].js` : chaque build publié a son URL `/b/<id>`, rendue côté serveur, avec titre, description, canonical, OG et JSON-LD. Un site en page unique n'indexe rien du tout. |
| **QR d'import NBA 2K HQ** — scanner importe le build *dans le jeu* | Champ « lien d'import NBA 2K HQ » dans la fiche de build. Le créateur colle le lien officiel généré par l'app 2K, le site en fait un QR scannable. **Le site ne fabrique pas ce lien** : seul 2K peut produire ce format. Un lien qui ne vient pas de `nba.2k.com` est refusé avec un avertissement. |
| **Badges affichés par discipline** avec compteur « accessibles / total » et pastilles colorées | Nouvelle section « Badges accessibles — vue par discipline » : les 53 badges rangés dans les six disciplines, écussons colorés par palier, barrés si hors de portée, avec les emplacements planifiés. |
| **Guide Cap Breaker ordonné**, écrit par le créateur (CB #1, CB #2…) | Nouvelle section « Guide Cap Breaker » : on ajoute les étapes dans l'ordre, on les réordonne, on les supprime. L'ancien planificateur montrait le résultat ; celui-ci montre le chemin. |
| **Étiquettes** : modes de jeu (Park, REC, Pro-Am, 1v1), styles de jeu, « Inspiré par » | Panneau « Fiche de build » avec modes, jusqu'à 3 styles de jeu, joueur d'inspiration et description. Les étiquettes s'affichent sous le panneau de style et sur la page publique. |
| **Onglets Featured / Latest / Trending / Top** | Onglets Tendances / Récents / Top / Mes builds dans le hub. Le score de tendance divise l'engagement par l'ancienneté, donc un build récent qui décolle passe devant un ancien qui dort. |
| **XP, niveaux, classement des contributeurs** | Système d'XP à 10 niveaux (Rookie → Legend) et 12 succès. Plafond quotidien par type d'événement pour éviter le farm de clics. Notifications discrètes. |
| **Badge « Quality build » / « Verified »** | Étiquette de qualité sur les cartes du hub, calculée à partir de la validation, de la note et du nombre de badges. |
| Abréviations d'attributs sur les cartes (3PT, PDEF, STL…) | Reprises sur les cartes du hub : les trois meilleurs attributs en un coup d'œil. |

## Ce que ton site garde d'unique

- **Signature Blueprints** : 40 modèles à trois athlètes. Leur assistant ne fait pas ça.
- **Build DNA** : décrire son joueur en français et obtenir des compromis.
- **Matching joueurs NBA/WNBA** et identité de build.
- **Assistant en 3 questions** pour débutants complets.
- **Annuler / rétablir** sur tout le builder.
- **Distinction explicite vérifié / indicatif** partout dans l'interface.
- **Français**, là où my2kbuilds est en anglais et allemand.
- **Aucun compte requis** : tout est local sauf la publication.

## Ce qu'ils ont et qui n'a pas été copié

- **Comptes utilisateurs et profils publics.** Ça demande une authentification, une modération et une politique de données. Hors périmètre pour l'instant.
- **Tests de jumpers.** NBA2KLab a une station de test automatisée ; ni eux ni toi ne pouvez improviser ça. Le pied de page renvoie vers NBA2KLab.
- **Support 2K26 en parallèle.** Ton site est mono-version, c'est plus simple à maintenir.

## Base de données

`migrations/0003_v24_build_meta.sql` ajoute `author`, `description`, `tags_json`,
`modes_json`, `inspired_by`, `hq_link`, `cb_plan_json`, `season`, `slug`, plus deux index.

```bash
npx wrangler d1 execute nba-build-lab --remote --file=./migrations/0003_v24_build_meta.sql
```

À lancer **avant** de déployer, sinon la page `/b/<id>` ne trouvera pas les colonnes.

## Nouveaux fichiers

`community.js` (XP, succès, onglets du hub), `build-sheet.js` (grille de badges,
guide Cap Breaker, étiquettes, lien HQ), `functions/b/[id].js` (page publique),
`migrations/0003_v24_build_meta.sql`.

## Vérification

Chrome headless 430×932 : **0 erreur JavaScript**, 0 débordement horizontal.
Testé : profil et niveaux, 4 onglets du hub, grille de 53 badges sur 6 disciplines
(22 accessibles sur le build par défaut), gain d'XP à l'application d'un blueprint,
ajout et réordonnancement d'étapes Cap Breaker, étiquettes de mode et de style,
génération du QR depuis un lien `nba.2k.com`, et **refus d'un lien d'un autre
domaine** avec avertissement.
