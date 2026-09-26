/* Génère une page par badge, en français et en anglais.
 *
 *   node outils/generer-badges.mjs
 *
 * Pourquoi : la page /reference/ construit ses 53 badges en JavaScript. Un
 * moteur de recherche qui la visite ne reçoit qu'un conteneur vide — vérifié,
 * aucun nom de badge n'apparaît dans le HTML servi. Résultat : le site ne
 * reçoit aucun visiteur venu d'une recherche, alors que « badge NBA 2K27 » est
 * exactement ce que les joueurs tapent.
 *
 * Ces pages-là sont du vrai HTML : nom officiel, description du jeu, les
 * quatre paliers avec les attributs exigés, la taille requise. Le JavaScript
 * du site n'est pas nécessaire pour les lire.
 *
 * Aucune page n'est écrite à la main : elles sont réécrites à chaque
 * exécution, et regénérées par le déploiement.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const SITE = 'https://lelabodesbuilds.com';

/* ---------------------------------------------------------------- données */

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('builder-data.js', 'utf8')
  + ';this.B=badgeDefs;this.NOMS=NOMS_ATTRIBUTS_FR;', ctx);
const BADGES = ctx.B;
const NOMS_FR_ATTR = ctx.NOMS;

const FR = JSON.parse(fs.readFileSync('donnees/badges-fr-2khq.json', 'utf8'));
const EN = JSON.parse(fs.readFileSync('donnees/en-jeu.json', 'utf8'));
const frParNom = Object.fromEntries(FR.badges.map(b => [b.en, b]));

const version = (fs.readFileSync('site-config.js', 'utf8').match(/shortVersion:'([^']+)'/) || [, 'V26'])[1];

const PALIERS_FR = ['Bronze', 'Argent', 'Or', 'Hall of Fame'];
const PALIERS_EN = PALIERS_FR.map(p => (EN.paliers && EN.paliers[p]) || p);

function slug(nom) {
  return String(nom).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function taille(pouces) {
  return `${Math.floor(pouces / 12)}'${pouces % 12}"`;
}
function tailleCm(pouces) { return Math.round(pouces * 2.54); }

/* ------------------------------------------------------------------ page */

function page(def, langue) {
  const en = langue === 'en';
  const info = frParNom[def.name] || {};
  const nom = en ? def.name : (info.fr || def.name);
  const autreNom = en ? (info.fr || '') : def.name;
  const categorie = en ? ((EN.categories && EN.categories[def.cat]) || def.cat) : def.cat;
  const description = en
    ? ((EN.badgesDescriptions && EN.badgesDescriptions[def.name]) || '')
    : (info.desc || '');
  const paliers = en ? PALIERS_EN : PALIERS_FR;
  const nomAttr = a => en ? ((EN.attributs && EN.attributs[a]) || a) : (NOMS_FR_ATTR[a] || a);

  const chemin = `/badge/${slug(def.name)}/`;
  const urlFr = SITE + chemin;
  const urlEn = SITE + '/en' + chemin;
  const canonique = en ? urlEn : urlFr;

  // Le tableau des exigences : une ligne par palier, une colonne par attribut.
  const lignes = paliers.map((p, i) => {
    const cases = def.req.map(r => `<td>${r[i + 1] != null ? r[i + 1] : '—'}</td>`).join('');
    return `<tr><th scope="row">${esc(p)}</th>${cases}</tr>`;
  }).join('\n          ');

  const entetes = def.req.map(r => `<th scope="col">${esc(nomAttr(r[0]))}</th>`).join('');

  const regle = def.req.length < 2 ? ''
    : en
      ? (def.logic === 'OR'
        ? '<p class="badge-regle">One of these attributes is enough to reach a tier.</p>'
        : '<p class="badge-regle">Every attribute must reach the value shown.</p>')
      : (def.logic === 'OR'
        ? '<p class="badge-regle">Un seul de ces attributs suffit pour atteindre un palier.</p>'
        : '<p class="badge-regle">Chaque attribut doit atteindre la valeur indiquée.</p>');

  const tailles = (def.minH > 60 || def.maxH < 95)
    ? (en
      ? `<p class="badge-taille">Available from ${taille(def.minH)} to ${taille(def.maxH)} (${tailleCm(def.minH)}–${tailleCm(def.maxH)} cm).</p>`
      : `<p class="badge-taille">Disponible de ${taille(def.minH)} à ${taille(def.maxH)} (${tailleCm(def.minH)} à ${tailleCm(def.maxH)} cm).</p>`)
    : '';

  const aConfirmer = info.certitude === 0
    ? (en ? '<p class="badge-reserve">Description not yet confirmed in-game.</p>'
      : '<p class="badge-reserve">Description pas encore confirmée dans le jeu.</p>')
    : '';

  // Les autres badges de la même catégorie : un moteur de recherche suit ces
  // liens, et un lecteur y trouve la suite de ce qu'il cherchait.
  const voisins = BADGES.filter(b => b.cat === def.cat && b.name !== def.name).slice(0, 8)
    .map(b => {
      const n = en ? b.name : ((frParNom[b.name] || {}).fr || b.name);
      return `<li><a href="${en ? '/en' : ''}/badge/${slug(b.name)}/">${esc(n)}</a></li>`;
    }).join('\n        ');

  const titre = en
    ? `${nom} — NBA 2K27 badge requirements | Le Labo des Builds`
    : `${nom} (${def.name}) — badge NBA 2K27 et ses paliers | Le Labo des Builds`;
  const meta = en
    ? `${nom}: what this NBA 2K27 badge does, and the attribute levels needed for Bronze, Silver, Gold and Hall of Fame.`
    : `${nom} : ce que fait cet insigne NBA 2K27, et les attributs requis pour Bronze, Argent, Or et Hall of Fame.`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: titre.split(' | ')[0],
    description: meta,
    inLanguage: en ? 'en' : 'fr',
    mainEntityOfPage: canonique,
    isPartOf: { '@type': 'WebSite', name: 'Le Labo des Builds', url: SITE }
  };

  const T = en ? {
    accueil: 'Home', badges: 'Badges', effet: 'What it does', debloquer: 'How to unlock it',
    palier: 'Tier', tester: 'Try it in the builder', memeCat: 'Other ' + categorie + ' badges',
    tousBadges: 'All 53 badges', source: 'Official name and description taken from the game (NBA 2K HQ).',
    legal: 'Legal notice and privacy', erreur: 'Report a data error', versAutre: 'Version française', lienAutre: chemin
  } : {
    accueil: 'Accueil', badges: 'Badges', effet: 'Ce qu’il fait', debloquer: 'Comment le débloquer',
    palier: 'Palier', tester: 'Tester dans le builder', memeCat: 'Autres badges ' + categorie,
    tousBadges: 'Les 53 badges', source: 'Nom et description officiels relevés dans le jeu (NBA 2K HQ).',
    legal: 'Mentions légales et confidentialité', erreur: 'Signaler une erreur de données',
    versAutre: 'English version', lienAutre: '/en' + chemin
  };

  const p = en ? '/en' : '';

  return `<!doctype html>
<html lang="${en ? 'en' : 'fr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#060608">
<meta name="color-scheme" content="dark">
<meta name="description" content="${esc(meta)}">
<title>${esc(titre)}</title>

<link rel="canonical" href="${canonique}">
<link rel="alternate" hreflang="fr" href="${urlFr}">
<link rel="alternate" hreflang="en" href="${urlEn}">
<link rel="alternate" hreflang="x-default" href="${urlFr}">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="preload" href="/fonts/BarlowCondensed-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/theme.css">
<link rel="stylesheet" href="/hq.css">

<meta property="og:title" content="${esc(titre.split(' | ')[0])}">
<meta property="og:description" content="${esc(meta)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonique}">
<meta property="og:locale" content="${en ? 'en_GB' : 'fr_FR'}">
<meta property="og:image" content="${SITE}/partage.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Le Labo des Builds">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/partage.png">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>

<body>
<a class="skip-link" href="#main">${en ? 'Skip to content' : 'Aller au contenu'}</a>

<header class="reference-header">
  <div class="reference-brand">
    <div>LE LABO <b>DES&nbsp;BUILDS</b></div>
    <small>NBA 2K27</small>
  </div>
  <nav class="reference-nav" aria-label="${en ? 'Main navigation' : 'Navigation principale'}">
    <a href="${p}/" data-nav="creer">${en ? 'Create' : 'Créer'}</a>
    <a href="${p}/hub/" data-nav="builds">Builds</a>
    <a href="${p}/reference/" data-nav="badges" class="active" aria-current="page">Badges</a>
    <a href="${p}/reference/?onglet=animations" data-nav="animations">Animations</a>
    <a href="${p}/mon-build/" data-nav="monbuild">${en ? 'My build' : 'Mon build'}</a>
  </nav>
  <div class="reference-actions">
    <div id="compteZone" class="compte-zone" hidden></div>
    <a class="lang-switch" href="${T.lienAutre}" hreflang="${en ? 'fr' : 'en'}" lang="${en ? 'fr' : 'en'}" title="${T.versAutre}">${en ? 'FR' : 'EN'}</a>
    <span id="referenceVersion">${version}</span>
  </div>
</header>

<main id="main" class="hq-page-badge">
  <nav class="fil-ariane" aria-label="${en ? 'Breadcrumb' : 'Fil d’Ariane'}">
    <a href="${p}/">${T.accueil}</a> › <a href="${p}/reference/">${T.badges}</a> › <span>${esc(nom)}</span>
  </nav>

  <article class="panel badge-fiche">
    <p class="badge-cat">${esc(categorie)}</p>
    <h1>${esc(nom)}</h1>
    ${autreNom ? `<p class="badge-autre-nom">${en ? 'French name: ' : 'Nom anglais : '}<b>${esc(autreNom)}</b></p>` : ''}

    <h2>${T.effet}</h2>
    <p class="badge-desc">${esc(description)}</p>
    ${aConfirmer}

    <h2>${T.debloquer}</h2>
    <div class="badge-table-zone">
      <table class="badge-table">
        <caption>${esc(en ? `Attribute levels required for ${nom}` : `Attributs requis pour ${nom}`)}</caption>
        <thead><tr><th scope="col">${T.palier}</th>${entetes}</tr></thead>
        <tbody>
          ${lignes}
        </tbody>
      </table>
    </div>
    ${regle}
    ${tailles}

    <p class="badge-action"><a class="hq-pilule hq-pilule-forte" href="${p}/">${T.tester}</a></p>
    <p class="badge-source">${T.source}</p>
  </article>

  <nav class="panel badge-voisins" aria-label="${esc(T.memeCat)}">
    <h2>${esc(T.memeCat)}</h2>
    <ul>
        ${voisins}
    </ul>
    <p><a href="${p}/reference/">${T.tousBadges}</a></p>
  </nav>
</main>

<footer>
  <p>NBA 2K27 Build Lab — ${en ? 'independent tool, public data, no official affiliation with 2K.' : 'outil indépendant, données publiques, aucune affiliation officielle avec 2K.'}</p>
  <p class="footer-legal"><a href="${p}/mentions-legales/">${T.legal}</a> · <a href="mailto:contact@lelabodesbuilds.com">${T.erreur}</a></p>
</footer>

<script src="/site-config.js"></script>
<script src="/compte.js"></script>
<script src="/mesure.js"></script>
</body>
</html>
`;
}

/* --------------------------------------------------------------- écriture */

let ecrites = 0;
const slugs = [];
for (const def of BADGES) {
  const s = slug(def.name);
  slugs.push(s);
  for (const langue of ['fr', 'en']) {
    const dossier = path.join(RACINE, langue === 'en' ? 'en' : '.', 'badge', s);
    fs.mkdirSync(dossier, { recursive: true });
    fs.writeFileSync(path.join(dossier, 'index.html'), page(def, langue), 'utf8');
    ecrites++;
  }
}

/* La liste sert au sitemap : une Function ne peut pas lire builder-data.js,
   qui n'est pas un module. */
fs.writeFileSync('functions/badges-liste.js',
  `/* Généré par outils/generer-badges.mjs — ne pas modifier à la main. */\n`
  + `export const BADGES_SLUGS = ${JSON.stringify(slugs)};\n`, 'utf8');

console.log(`${ecrites} pages de badges générées (${BADGES.length} badges × 2 langues), `
  + `liste écrite dans functions/badges-liste.js`);
