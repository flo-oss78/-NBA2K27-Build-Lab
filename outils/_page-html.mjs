/* Ossature commune aux pages générées (fiches de badges, pages d'animations).
 *
 * Ces pages existent d'abord pour être lisibles sans JavaScript : la page
 * /reference/ construit tout son contenu dans le navigateur, et un moteur de
 * recherche n'y trouvait ni un nom de badge ni un nom d'animation.
 *
 * L'en-tête et le pied de page sont ici, en un seul exemplaire : deux copies
 * finiraient par diverger, et le site afficherait deux navigations
 * différentes selon la page où l'on tombe.
 */
import fs from 'node:fs';

export const SITE = 'https://lelabodesbuilds.com';

export const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export function slug(nom) {
  return String(nom).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function versionCourte() {
  return (fs.readFileSync('site-config.js', 'utf8').match(/shortVersion:'([^']+)'/) || [, 'V26'])[1];
}

export function taillePieds(pouces) {
  return `${Math.floor(pouces / 12)}'${pouces % 12}"`;
}
export function tailleCm(pouces) { return Math.round(pouces * 2.54); }

/* Rend une page complète. `corps` est le contenu de <main>, déjà échappé. */
export function page({ langue, titre, meta, chemin, jsonld, corps, navActive, classeMain }) {
  const en = langue === 'en';
  const p = en ? '/en' : '';
  const urlFr = SITE + chemin;
  const urlEn = SITE + '/en' + chemin;
  const canonique = en ? urlEn : urlFr;
  const actif = n => n === navActive ? ' class="active" aria-current="page"' : '';

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
    <a href="${p}/" data-nav="creer"${actif('creer')}>${en ? 'Create' : 'Créer'}</a>
    <a href="${p}/hub/" data-nav="builds"${actif('builds')}>Builds</a>
    <a href="${p}/reference/" data-nav="badges"${actif('badges')}>Badges</a>
    <a href="${p}/reference/?onglet=animations" data-nav="animations"${actif('animations')}>Animations</a>
    <a href="${p}/mon-build/" data-nav="monbuild"${actif('monbuild')}>${en ? 'My build' : 'Mon build'}</a>
  </nav>
  <div class="reference-actions">
    <div id="compteZone" class="compte-zone" hidden></div>
    <a class="lang-switch" href="${en ? chemin : '/en' + chemin}" hreflang="${en ? 'fr' : 'en'}" lang="${en ? 'fr' : 'en'}" title="${en ? 'Version française' : 'English version'}">${en ? 'FR' : 'EN'}</a>
    <span id="referenceVersion">${versionCourte()}</span>
  </div>
</header>

<main id="main" class="${classeMain}">
${corps}
</main>

<footer>
  <p>NBA 2K27 Build Lab — ${en ? 'independent tool, public data, no official affiliation with 2K.' : 'outil indépendant, données publiques, aucune affiliation officielle avec 2K.'}</p>
  <nav class="footer-plan" aria-label="${en ? 'Site map' : 'Plan du site'}">
    <div>
      <b>${en ? 'Create' : 'Créer'}</b>
      <a href="${p}/">Builder</a>
      <a href="${p}/hub/?onglet=trios">${en ? 'Trios' : 'Trios'}</a>
      <a href="${p}/mon-build/">${en ? 'My build' : 'Mon build'}</a>
    </div>
    <div>
      <b>${en ? 'Understand' : 'Comprendre'}</b>
      <a href="${p}/reference/">${en ? 'All 53 badges' : 'Les 53 badges'}</a>
      <a href="${p}/animations/">${en ? 'Animations by category' : 'Les animations par catégorie'}</a>
      <a href="${p}/hub/?onglet=reels">${en ? 'Real builds' : 'Builds réels'}</a>
    </div>
    <div>
      <b>${en ? 'Community' : 'Communauté'}</b>
      <a href="${p}/hub/">${en ? 'Published builds' : 'Builds publiés'}</a>
    </div>
  </nav>
  <p class="footer-legal"><a href="${p}/mentions-legales/">${en ? 'Legal notice and privacy' : 'Mentions légales et confidentialité'}</a> · <a href="mailto:contact@lelabodesbuilds.com">${en ? 'Report a data error' : 'Signaler une erreur de données'}</a></p>
</footer>

<script src="/site-config.js"></script>
<script src="/compte.js"></script>
<script src="/mesure.js"></script>
</body>
</html>
`;
}
