# Changelog V23.1 — Alignement NBA 2K27 + ergonomie

Suite de la V23. Tout ce qui suit est nouveau ou remanié.

## A. Systèmes alignés sur NBA 2K27

### Signature Blueprints (nouvelle section `#blueprints`)
2K27 remplace les Pro-Tuned et les templates NBA par des Signature Blueprints :
des modèles façonnés chacun par **trois comparaisons d'athlètes NBA et WNBA**,
mêlant leurs attributs et leurs animations.

- 40 blueprints répartis sur les cinq postes
- filtres par poste, par discipline, et recherche par nom de joueur
- un clic règle gabarit, 22 attributs, style, badges, animations et takeovers
- chaque blueprint est automatiquement ramené dans le budget indicatif sans
  toucher à ses six attributs piliers
- **honnêteté :** 2K ne publie pas la table officielle des blueprints. La
  bibliothèque reproduit le principe à partir des profils publics des joueurs,
  et le dit explicitement sous la section.

### Rebond devient la sixième discipline
2K27 compte six disciplines : Shooting, Finishing, Playmaking, Defense,
Rebounding et Physicals (nouveau). Le moteur rangeait encore le rebond dans
Défense — incohérent avec son propre planificateur de jetons qui affichait
déjà six disciplines.

- `Offensive Rebound` et `Defensive Rebound` forment un groupe séparé
- couleur violette dédiée, barre dans le résumé, axe dans Build Intelligence
- la note est une moyenne **pondérée** (Rebond à 0,6) : un guard n'est plus
  puni comme s'il devait prendre 10 rebonds
- l'échelle de grades a été recalibrée sur la nouvelle distribution

### Badge Loadouts (nouvelle section `#loadouts`)
Nouveau en 2K27 : on sauvegarde plusieurs combinaisons de badges et on change
l'actif avant l'engagement pour contrer la taille ou le style d'un adversaire.

- jusqu'à 4 loadouts nommés, 20 slots chacun
- seuls les badges réellement accessibles avec le build sont proposés
- un loadout se nettoie tout seul si le build change et perd un badge

### Synergy : Fuse et Reaction (nouvelle section `#synergy`)
Le système compte **16 emplacements** répartis entre Fuse Badges et Reaction
Badges, qui poussent les badges au-delà de leur potentiel de base jusqu'au tier
Legend. L'ancienne jauge de synergie était un pourcentage abstrait.

- deux colonnes distinctes, alimentées par le loadout actif
- les slots gagnés en spécialisation s'ajoutent au total (16 → 22 au maximum)

### Takeover : 5 slots et perks (section `#takeoverPro` remaniée)
Chaque emplacement reçoit un takeover et un perk parmi les trois du jeu :
Accelerator accélère le remplissage de la jauge, Longevity prolonge la capacité
active, Overdrive augmente les bonus d'attributs.

### Quêtes de spécialisation (nouvelle section `#quests`)
Six pistes de 10 quêtes, donnant cosmétiques, Cap Breakers et **un slot de
Synergy permanent au niveau 10**. Tracker cochable, relié au planificateur de
Synergy.

## B. Partage

### Code de build compact
Le build entier (gabarit + main forte + style + 22 attributs) est empaqueté sur
**179 bits → 31 caractères**. L'URL de partage fait 64 caractères au lieu de
plusieurs centaines.

### QR code
2K27 permet de préparer un build sur mobile et de le partager par QR code. Même
principe ici : encodeur QR écrit from scratch (mode octet, correction L,
versions 1 à 6), sans aucune dépendance externe.

*Vérification :* validé par un décodeur indépendant écrit séparément — syndromes
Reed-Solomon nuls et texte identique après aller-retour, sur 7 cas couvrant les
versions 1 à 6, les 8 masques et l'UTF-8 accentué.

### Carte de build en PNG
Le bouton « Fiche build » lançait `window.print()`. Il génère maintenant une
image 1080×1350 (format post) : note, disciplines colorées, badges clés et QR
code intégré. Plus un téléchargement du QR seul.

## C. Ergonomie

- **Assistant en 3 questions** : rôle, zone de tir, gabarit → trois blueprints
  proposés. Proposé une seule fois, puis rappelable à volonté.
- **Annuler / rétablir** : boutons dans la carte Attributs, plus `Ctrl+Z` et
  `Ctrl+Maj+Z`. Couvre sliders, steppers, presets, blueprints et optimiseur.
- **Build de la semaine** dans le hub, calculé sur les 7 derniers jours.
- **Statut de test NBA2KLab** sur chaque badge : `✓` testé, `·` test en attente.
  NBA2KLab teste ses jumpers en Hall of Fame, sans boosts, sans badges et sans
  shot meter, sur une station automatisée. Le site ne cherche pas à refaire ça
  et renvoie vers eux depuis le pied de page.

## D. Bugs corrigés

| # | Problème | Correctif |
|---|---|---|
| 33 | **`bodyCaps()` partait en récursion infinie** dès que la taille dépassait 7'0". `minWing = h+2` dépassait le maximum du slider d'envergure, la valeur restait clampée, et la fonction se rappelait sans fin → dépassement de pile et page figée. Bug présent depuis l'origine, atteignable en glissant simplement le curseur de taille. | Bornage de `minWing`/`maxWing` sur les limites réelles du slider, et récursion seulement si la valeur a effectivement changé. |
| 34 | L'envergure était plafonnée à 7'2" alors que la taille montait à 7'4". Un pivot ne pouvait pas avoir une envergure cohérente. | Plage portée à 8'0", côté interface **et** côté validation API. |
| 35 | Les presets dépassaient tous le budget (1046 à 1176 pour 1000). | Rééquilibrés à 975, avec un plancher de 45 par attribut pour éviter les trous absurdes. |
| 36 | `renderSynergy()` et `renderTakeoverLoadout()` de `app.js` écrivaient dans des éléments sans vérifier leur existence. | Lectures protégées. |
| 37 | Cocher un badge dans un loadout re-rendait toute la liste, faisant perdre la position de défilement. | Bascule en place. |

## E. Vérification

Chrome headless, 430×932 et 1280×900 : **0 erreur JavaScript**, 0 ID dupliqué,
0 débordement horizontal, 0 image cassée.

Parcours testés de bout en bout : application d'un blueprint, bascule de badges
dans un loadout, affectation Fuse/Reaction, takeover + perk, 10 quêtes cochées →
slot de Synergy gagné (16 → 17), annuler/rétablir, aller-retour du codec
compact (31 caractères, 22 attributs identiques), modale de partage avec QR,
génération de la carte 1080×1350, assistant complet jusqu'à l'application du
blueprint recommandé.
