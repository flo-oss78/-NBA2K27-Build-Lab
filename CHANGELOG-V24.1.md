# Changelog V24.1 — Correctifs

Audit complet du code V24. Aucune fonctionnalité retirée ; les correctifs
rendent opérationnel ce qui était déjà écrit mais inactif.

## Bug bloquant : la fiche de build n'arrivait jamais en base

La V24 a ajouté une fiche de build (description, étiquettes, modes de jeu,
joueur d'inspiration, lien NBA 2K HQ, guide Cap Breaker) et une page publique
`/b/<id>` conçue pour l'afficher. La chaîne était rompue en trois endroits :

| Maillon | État | Correctif |
|---|---|---|
| `server-client.js` | La fiche restait dans le `localStorage`, la publication ne l'envoyait pas | `publishCurrent()` joint désormais `build.meta` |
| `functions/api/builds.js` | L'`INSERT` ignorait les 9 colonnes de la migration 0003 | Les colonnes sont écrites et validées |
| `functions/api/builds/[id].js` | Le `PATCH` ne modifiait que `name` et `style` | La fiche est modifiable après publication |

Conséquence avant correctif : toute page `/b/<id>` s'affichait sans description,
sans étiquette, sans lien d'import et sans guide Cap Breaker — c'est-à-dire sans
rien de ce qui faisait l'intérêt de la V24.

## Autres correctifs

- **Date invalide dans les données structurées.** `functions/b/[id].js`
  multipliait `created_at` par 1000 alors que la valeur est déjà en
  millisecondes, produisant une date située vers l'an 57 000 dans le JSON-LD.
- **Modes affichés bruts.** La page publique montrait `park`, `rec` au lieu de
  « Park (3v3) », « REC (5v5) ».
- **Versions incohérentes.** `site-config.js` annonçait V24 tandis que
  `index.html`, `sw.js` et le README affichaient V23 ou V23.1.
- **`schema.sql` incomplet.** Il décrivait la base d'avant la V24 : une
  installation neuve produisait une base sans les colonnes de la fiche.

## Nouveautés

- **Sitemap dynamique** (`functions/sitemap.xml.js`). Le sitemap statique ne
  listait que la page d'accueil ; les pages `/b/<id>`, seules réellement
  indexables, en étaient absentes. Le fichier statique a été supprimé : sur
  Cloudflare Pages, un fichier statique masque une Function de même chemin.
- **Filtre par mode de jeu** sur `GET /api/builds?mode=park`.
- **Tri `trending`** exposé par l'API, adossé à l'index `idx_builds_trending`.
- **Champ `url`** dans les réponses de l'API, pour lier vers la page publique.

## Sécurité

Le lien NBA 2K HQ est désormais validé côté serveur, pas seulement dans le
navigateur : HTTPS obligatoire et domaine `nba.2k.com` strict. Un lien comme
`https://nba.2k.com.exemple-malveillant.com/x` est rejeté — la vérification
porte sur le nom d'hôte, pas sur une recherche de texte.

Les étapes du guide Cap Breaker sont filtrées contre la liste officielle des
attributs et le gain est borné entre 1 et 5.

## Vérifications effectuées

- Contrôle syntaxique des 26 fichiers JavaScript : aucune erreur.
- Tous les symboles importés depuis `_utils.js` existent bien.
- 25 colonnes dans l'`INSERT`, 25 paramètres, toutes présentes au schéma.
- `INSERT` complet testé sur la base D1 de production, puis ligne supprimée.
- Validation testée : doublons d'étiquettes supprimés, mode inconnu rejeté,
  attribut inventé écarté, gain 99 ramené à 5, domaines usurpés refusés,
  JSON corrompu en base dégradé sans exception.
