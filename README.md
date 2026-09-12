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

```bash
npx wrangler login
npx wrangler pages deploy . --project-name=nbabuildlab
```

Vérifie que `functions` apparaît dans la liste des fichiers envoyés.

### 4. Contrôler que ça marche

```bash
curl https://nbabuildlab.pages.dev/api/builds
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
| `index.html` | Structure de la page, un seul écran par section |
| `theme.css` | **Système de design complet** (remplace `style.css` + `identity-v22.css`) |
| `app.js` | Moteur : attributs, caps, badges, takeovers, validateur, hub, comparateur |
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
