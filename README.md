# NBA 2K27 Build Lab — V24.1

Builder MyPLAYER pour NBA 2K27 : attributs et caps dynamiques, badges, animations,
Cap Breakers, takeovers, validateur, comparateur et hub communautaire.

Site statique + Cloudflare Pages Functions + base D1.

---

## Déployer sur Cloudflare Pages

> **Important : ne déploie pas par glisser-déposer.**
> Le dossier `functions/` est presque toujours ignoré par l'upload manuel du
> dashboard. Sans lui, `/api/*` renvoie la page d'accueil au lieu de JSON et le
> hub communautaire reste bloqué sur « Serveur : connexion… ». Utilise Wrangler
> ou un dépôt Git.

### 1. Créer la base et les tables

```bash
npx wrangler d1 create nba-build-lab
npx wrangler d1 execute nba-build-lab --remote --file=./schema.sql
```

`schema.sql` est complet : il contient déjà les colonnes V24. Les fichiers de
`migrations/` ne servent qu'aux bases créées avant la V24.

### 2. Déclarer la base auprès des Functions

Dashboard Cloudflare → ton projet Pages → **Settings → Functions →
D1 database bindings** :

| Variable name | D1 database |
|---|---|
| `DB` | `nba-build-lab` |

Le nom de variable doit être exactement `DB`, en majuscules. C'est ce nom que
le code lit via `env.DB`.

### 3. Déployer

**Double-clique sur `deployer.cmd`** (ou lance-le depuis un terminal, peu
importe le dossier courant). Le script :

1. se place de lui-même dans le dossier du projet, et refuse de continuer s'il
   n'y trouve pas `wrangler.toml`, `index.html` et `functions/` ;
2. lance les tests sur les fichiers locaux — **rien n'est publié si un test
   échoue** ;
3. signale les modifications non commitées ou non poussées sur GitHub ;
4. déploie avec Wrangler ;
5. relance les tests sur la production, dont un qui vérifie que chaque fichier
   en ligne est identique à celui du dossier.

À la première utilisation, Wrangler demande une connexion : `npx wrangler login`.

La commande manuelle reste possible, **depuis le dossier du projet** :

```bash
npx.cmd wrangler pages deploy . --project-name=nba2k27-build-lab
```

### 4. Contrôler que ça marche

`tester.cmd --prod` vérifie la production sans rien publier. Pour un contrôle
rapide de l'API seule :

```bash
curl https://nba2k27-build-lab.pages.dev/api/builds
```

- `{"builds":[]}` → tout fonctionne, le hub est en ligne.
- `{"error":"D1 database is not configured."}` → les Functions tournent mais
  l'étape 2 n'a pas été faite, ou le déploiement est antérieur au binding.
- Du HTML → le dossier `functions/` n'est pas déployé. Reprends l'étape 3.

Le statut affiché sur le site passe à « Serveur : en ligne » une fois l'API
joignable. Sans base, le site reste utilisable en mode local : les builds sont
stockés dans le navigateur du visiteur et le statut affiche « Serveur : local ».

---

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | Page du builder (`/`) : corps, attributs, validateur, fiche, Cap Breakers |
| — | *Mode **Simple** par défaut : builder, scouting et validateur. Le mode **Expert** ajoute les neuf panneaux de méta-jeu et la page Progression. Le choix est mémorisé pour tout le site.* |
| `trios/index.html` | `/trios/` — les 40 Trios (Signature Blueprints dans le jeu) ; `/blueprints/` y redirige |
| `hub/index.html` | `/hub/` — builds de la communauté et comparateur |
| `reference/index.html` | `/reference/` — tables des badges et animations |
| `progression/index.html` | `/progression/` — loadouts, synergy, takeovers, quêtes |
| `theme.css` | **Système de design complet** (remplace `style.css` + `identity-v22.css`) |
| `builder-data.js` | Tables de référence : attributs, 53 badges, takeovers, coûts. **Chargé avant `app.js`** |
| `validator.js` | Validateur de cohérence (gabarit, caps, badges, animations). **Chargé avant `app.js`** |
| `app.js` | Moteur : attributs, caps, badges, takeovers, animations, jetons, scouting |
| `optimizer.js` | Optimiseur : redistribution des points à coût simulé constant |
| `hub.js` | Build Hub et comparateur. **Chargé après `app.js`, avant `server-client.js`** |
| `style-presets.js` | Les 6 styles de build : cibles d'attributs, badges, animations, takeovers |
| `blueprints.js` | 40 Signature Blueprints (trois athlètes par modèle) |
| `progression.js` | Badge Loadouts, Synergy Fuse/Reaction, perks de Takeover, quêtes |
| `qr.js` | Encodeur QR autonome (mode octet, correction L, versions 1-6) |
| `share.js` | Code de build compact, QR, carte PNG téléchargeable |
| `assist.js` | Assistant 3 questions, annuler/rétablir, build de la semaine |
| `ui.js` | Navigation, panneau de réglages, installation PWA, service worker |
| `animations.js` | Base d'animations (227 entrées) |
| `dna-engine.js` | Build DNA — génération depuis une description en français |
| `v15-intelligence.js` | Identité de build et joueurs similaires |
| `server-client.js` | Client API communauté avec repli local |
| `data-registry.js` / `data-validation.js` | Sources et niveaux de confiance des données |
| `sw.js` | Service worker (réseau d'abord sur le HTML) |
| `_headers` | En-têtes de sécurité et de cache Cloudflare |
| `functions/api/` | API Pages Functions (builds, likes, commentaires) |
| `schema.sql` | Schéma D1 |

---

## Tests

`tester.cmd` (double-clic) ou `node outils/tests.mjs` — environ 20 secondes.

Aucune dépendance à installer : les tests pilotent un vrai Chrome (ou Edge)
invisible via le protocole DevTools, avec un profil vierge à chaque lancement,
pour voir le site comme un premier visiteur (sans cache ni service worker).

| Vérifié | Pourquoi |
|---|---|
| Tous les JS compilent, aucun fichier référencé absent, aucun `id` en double | Erreurs de base qui cassent une page entière |
| Les 5 pages se chargent **sans aucune erreur console**, lue dès le chargement | Les erreurs de démarrage des sous-pages sont passées inaperçues deux fois |
| Le builder construit un curseur par attribut et recalcule | Cœur du site |
| Mode Simple par défaut, Expert révèle tout, le choix suit entre pages | Phase 3 |
| `/reference/` rend chaque badge, animation et takeover de la table | Tables vides si le contexte de build casse |
| Un lien de partage restaure le build à l'identique | Le preset de style l'écrasait |
| « Utiliser ce trio » ouvre le builder avec le bon gabarit | Passerelle entre pages |
| Le hub filtre réellement la liste affichée | Les filtres ont longtemps piloté une liste cachée |

`tester.cmd --prod` ajoute : chaque fichier en ligne est identique au dossier
local, l'API répond (en lecture seule — les tests n'écrivent jamais en base), et
le sitemap liste les cinq pages.

Les tests vérifient des invariants plutôt que des chiffres figés (« chaque badge
de la table est rendu », pas « 53 badges ») : ils ne cassent que si le
comportement casse.

## Développement local

```bash
# Sans backend
python3 -m http.server 8080

# Avec les Functions et D1
npx wrangler pages dev .
```

---

## Honnêteté des données

Le site distingue explicitement deux niveaux :

- **Vérifié** : badges et animations issus de tables publiques recoupées par la communauté.
- **Indicatif** : caps d'attributs et coûts du builder. 2K ne publie pas ses tables
  internes ; le modèle est une simulation, affichée comme telle partout dans l'interface.

Le validateur garantit la cohérence avec les règles **intégrées au site**, pas une
exactitude officielle. Aucune affiliation avec 2K.
