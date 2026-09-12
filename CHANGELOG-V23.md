# Changelog V23

Deux chantiers : **corriger les défauts de la V22**, puis **refondre le design**
sur la maquette de référence.

---

## A. Bugs corrigés

### Bloquants

| # | Problème | Correctif |
|---|---|---|
| 1 | `renderBreakers()` utilisait la variable `x` hors de sa portée → `ReferenceError` à **chaque clic** sur les boutons +/− des Cap Breakers. La fonctionnalité était entièrement cassée. | Résolution de l'attribut via `inputs.find()` sur l'`id` du bouton. |
| 2 | 4 IDs en double (`heroScore`, `heroName`, `heroMeta`, `badgeUnlocked`) entre le hero et l'`aside` legacy. `getElementById` renvoyait le premier : le compteur de la section Badges restait figé sur « 0 débloqués ». | IDs rendus uniques. Les champs fantômes sont devenus une vraie carte « Résumé du build ». |
| 3 | Conséquence du #2 : `unlockedBadgeCount()` lisait l'élément mort → tous les builds **publiés sur le serveur déclaraient 0 badge**. | Corrigé par #2. |
| 4 | Les 53 icônes de badges étaient **hotlinkées sur `2kratings.com`** → images cassées, dépendance à un tiers, requêtes externes. | Écussons SVG/CSS locaux par palier (Bronze / Argent / Or / HOF). Zéro requête externe. |

### Affichage et logique

| # | Problème | Correctif |
|---|---|---|
| 5 | Le coût affichait « Coût simulé : Coût simulé : 1153 » (label écrit à la fois en HTML et en JS). | Le JS n'écrit plus que la valeur. |
| 6 | Budget dépassé (1153 / 1000) sans aucun signal visuel, et le validateur le marquait comme neutre. | État `over` : jauge orange → rouge, et `✕` dans le validateur. |
| 7 | `applyStyle()` faisait `icon.textContent = emoji`, ce qui **écrasait l'icône SVG** du style sélectionné. | L'icône SVG est réinjectée par style. |
| 8 | Le `<select>` « Profil » était masqué par le CSS mais son `<label>` restait visible. | Devenu « Archétype », visible et fonctionnel, synchronisé avec le bandeau de styles. |
| 9 | Débordement horizontal de la barre de navigation sur mobile (grille `112px 1fr auto` + `gap:30px`). | En-tête sur deux lignes, nav défilante sans débordement de page. |
| 10 | Le sélecteur « Main forte » n'était lu nulle part : ni sauvegardé, ni partagé, ni exporté. | Intégré à `serialize()`, `apply()` et `exportBuild()`. |
| 11 | Options « Droit / Gauche » au lieu de « Droite / Gauche ». | Corrigé. |
| 12 | Taille, poids et envergure en unités impériales uniquement. | Affichage double : `6'6" (198 cm)`, `180 lbs (82 kg)`. |
| 13 | Seul le style *Slasher* avait des badges et animations curés ; les 5 autres tombaient sur un fallback générique. | Les 6 styles ont désormais 15 badges et 10 animations recommandés. |
| 14 | Les boutons `#optimize` et `#reset`, câblés en JS sans `?.`, n'avaient aucune interface. | Boutons réels dans la carte « Résumé du build ». |
| 15 | Boutons « Simple / Expert » et « Voir tous » présents mais non câblés. | Câblés dans `ui.js`. |
| 16 | Aucun retour visuel sur l'écart entre la valeur actuelle et la base du build. | Deltas `+13 / −8` affichés à côté de chaque note, comme sur la maquette. |
| 17 | Le guide rapide se trouvait **après `</footer>`**, hors du flux principal. | Replacé dans `<main>`. |
| 18 | Aucun `aria-current`, pas de lien d'évitement, contrastes de focus faibles. | `aria-current` sur l'onglet actif, skip link, `:focus-visible` visible partout. |
| 19 | 30 cibles tactiles sous 32 px sur mobile. | Minimum 36 px, 44 px pour les champs. |

### Infrastructure

| # | Problème | Correctif |
|---|---|---|
| 20 | Le service worker était **cache-first sur tout, HTML compris** : après chaque déploiement Cloudflare, les visiteurs restaient bloqués sur l'ancienne version. | Réseau d'abord pour les navigations, stale-while-revalidate pour les assets. |
| 21 | `cache.addAll(SHELL)` échouait **entièrement** si un seul fichier manquait, empêchant l'installation du SW. Et `identity-v22.css` / `dna-engine.js` étaient absents de la liste. | `Promise.all` tolérant aux échecs, liste à jour. |
| 22 | Pas de favicon → 404 sur chaque visite. | `favicon.svg`. |
| 23 | `apple-mobile-web-app-capable` déprécié sans son remplaçant. | `mobile-web-app-capable` ajouté. |
| 24 | Aucun en-tête de sécurité ni politique de cache. | `_headers` : CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, cache par type. |
| 25 | 92 Ko de `style.css` + 24 Ko de `identity-v22.css` saturé de `!important` en conflit. | Un seul `theme.css`, **zéro `!important`**. |
| 26 | Fichiers de sauvegarde livrés en production (`index.v22-backup.html`, `identity-v22.backup.css`, 11 `README-V*.md`). | Retirés du paquet de déploiement. |

### Backend (Pages Functions)

| # | Problème | Correctif |
|---|---|---|
| 27 | `POST /api/builds` construisait la réponse depuis un objet sans `views`, `likes`, `rating_count` → le client recevait `undefined` et les affichait. | Compteurs initialisés à 0. |
| 28 | `PATCH /api/builds/:id` avec un style vide **effaçait** le style existant (contrairement au nom, qui avait un repli). | Repli sur la valeur courante. |
| 29 | La table `api_rate_limits` grossissait indéfiniment, aucune purge. | Purge opportuniste des compartiments de plus d'une heure. |
| 30 | Le filtre « Avec Cap Breakers » de l'interface n'existait pas côté API. | Paramètre `capBreakers=1` implémenté. |
| 31 | Une seule requête d'incrément de vues en échec faisait échouer toute la réponse `GET /builds/:id`. | Incrément non bloquant. |
| 32 | Un attribut absent du payload invalidait tout le build. | Valeur par défaut 25 (plancher du builder). |

---

## B. Refonte du design

Langage visuel repris de la maquette de référence.

**Couleurs** — fond navy `#050A12`, cartes `#0C1520`, bordures `#1C2B3D` à 1 px,
action bleu `#1D8BFF` → cyan `#22D3EE`, succès vert `#22E08A`.
Une couleur par famille d'attributs : Finition bleu, Tir vert, Organisation orange,
Défense rouge, Rebond violet, Physique ambre.

**Structure** — le builder devient la page d'accueil, dans l'ordre de la maquette :
bandeau de 6 styles → panneau « Style sélectionné » → 1. Corps du joueur →
2. Attributs → 3. Meilleurs badges → 4. Animations recommandées → 5. Takeovers conseillés.

**Ergonomie**
- Bandeau de styles : grille 3×2 sur mobile, 6 colonnes sur desktop (il était coupé horizontalement).
- En-tête sur deux lignes : marque + version + réglages, puis navigation défilante.
- Builder sur deux colonnes au-delà de 1000 px, une seule en dessous.
- Icônes SVG au trait à la place des emojis système (💾 ↩ 🔗 🪪 🏃).
- Écussons hexagonaux pour les badges, anneaux colorés pour les takeovers.
- Onglet actif suivi automatiquement pendant le défilement.
- `prefers-reduced-motion` respecté, feuille d'impression pour la fiche build.

**Fichiers**
- Ajoutés : `theme.css`, `style-presets.js`, `ui.js`, `favicon.svg`, `_headers`
- Supprimés : `style.css`, `identity-v22.css`, `identity-v22.backup.css`,
  `index.v22-backup.html`, `README-V17` à `README-V22`

---

## C. Vérification

Testé sous Chrome headless, viewport 430 × 932 et 1280 × 900 :

- 0 erreur JavaScript, 0 avertissement bloquant
- 0 ID dupliqué
- 0 débordement horizontal
- 0 image cassée
- Toutes les listes se remplissent : 53 badges, 227 animations, 22 Cap Breakers,
  11 takeovers, 6 disciplines, 18 badges recommandés, 10 animations recommandées
- Parcours validés : changement de style ×5, +/− Cap Breakers, steppers d'attribut,
  optimiseur, panneau de réglages, sliders de gabarit, filtres badges
