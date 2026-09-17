/* Génère la version anglaise du site dans /en/, à partir des pages françaises.
 *
 *   node outils/i18n-generer.mjs
 *
 * Principe : les pages françaises restent la seule source. Chaque page /en/ est
 * fabriquée à partir de son équivalent français, en remplaçant les textes par
 * leur traduction (donnees/en.json) et en préfixant les liens internes par /en.
 * Aucune page anglaise ne se modifie à la main : elle serait écrasée.
 *
 * Pourquoi de vraies pages plutôt qu'une bascule en JavaScript : Google indexe
 * ce qu'il reçoit. Une traduction appliquée après chargement laisserait le site
 * anglais invisible dans la recherche en anglais, donc sans visiteurs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const PAGES = ['index.html', 'hub/index.html', 'reference/index.html', 'mon-build/index.html', 'mentions-legales/index.html', '404.html'];
const SITE = 'https://lelabodesbuilds.com';
const ATTRS_TEXTE = ['aria-label', 'placeholder', 'title', 'alt', 'content', 'value', 'label', 'data-libelle'];
// Liens internes à préfixer. Les fichiers (police, image, script) restent partagés.
const FICHIER = /\.(css|js|png|jpe?g|svg|webmanifest|xml|txt|woff2?|ico)$/;

const dico = JSON.parse(fs.readFileSync('donnees/en.json', 'utf8'));
const manquantes = new Set();

function traduire(texte) {
  const t = texte.replace(/\s+/g, ' ').trim();
  if (!t) return texte;
  // Les espaces de bord séparent le texte de l'élément voisin (« utilisés : <b>106 %</b> ») :
  // les perdre colle les deux mots une fois la page traduite.
  if (dico.textes[t] !== undefined) return texte.match(/^\s*/)[0] + dico.textes[t] + texte.match(/\s*$/)[0];
  // Une chaîne sans traduction est signalée, jamais laissée en français en silence.
  if (/[A-Za-zÀ-ÿ]{2}/.test(t) && /[àâçéèêëîïôöûùüÿœ]|(^| )(le|la|les|un|une|des|du|ton|tes|pour|avec|dans|sans|plus|que|qui|est|sont|ne|pas)( |$)/i.test(t)) manquantes.add(t);
  return texte;
}

function lienAnglais(href) {
  if (!href.startsWith('/') || FICHIER.test(href.split('?')[0])) return href;
  if (href.startsWith('/en/')) return href;
  return '/en' + href;
}

function page(fichier) {
  const brut = fs.readFileSync(fichier, 'utf8');
  const crlf = brut.includes('\r\n');
  let html = brut.replace(/\r\n/g, '\n');

  // Le site s'appelle « Le Labo des Builds » en français et « Build Lab » en
  // anglais. Le nom est remplacé d'un bloc, avant la traduction mot à mot : le
  // nom de l'éditeur, dans les mentions légales, ne doit pas bouger pour autant.
  html = html
    .replace('<div>LE LABO <b>DES&nbsp;BUILDS</b></div>', '<div>BUILD <b>LAB</b></div>')
    .replace(/<meta property="og:site_name" content="[^"]*">/, '<meta property="og:site_name" content="Build Lab">');

  // Les scripts et styles sont protégés : leur contenu n'est pas du texte affiché.
  const coffre = [];
  html = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, m => '@@BLOC' + (coffre.push(m) - 1) + '@@');

  html = html.replace(/>([^<>]+)</g, (m, t) => '>' + traduire(t) + '<');
  for (const attr of ATTRS_TEXTE) {
    html = html.replace(new RegExp(`${attr}="([^"]+)"`, 'g'), (m, v) => `${attr}="${traduire(v)}"`);
  }
  html = html.replace(/href="(\/[^"]*)"/g, (m, h) => `href="${lienAnglais(h)}"`);

  const chemin = fichier === '404.html' ? '/404.html' : '/' + fichier.replace(/index\.html$/, '');
  html = html
    .replace(/<html lang="fr">/, '<html lang="en">')
    .replace(/<meta property="og:locale" content="fr_FR">/, '<meta property="og:locale" content="en_US">')
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${SITE}/en${chemin}">` +
      `\n<link rel="alternate" hreflang="fr" href="${SITE}${chemin}">` +
      `\n<link rel="alternate" hreflang="en" href="${SITE}/en${chemin}">` +
      `\n<link rel="alternate" hreflang="x-default" href="${SITE}${chemin}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${SITE}/en${chemin}">`)
    // Pas de script inline pour annoncer la langue : la CSP du site les interdit
    // (script-src 'self'), et une page /en/ partait alors sans traduction.
    // i18n.js lit <html lang="en">, posé juste au-dessus.
    // Le bouton de langue fait l'aller-retour : « EN » côté français, « FR » ici.
    .replace(/<a class="lang-switch"[^>]*>EN<\/a>/,
      `<a class="lang-switch" href="${chemin}" hreflang="fr" lang="fr" title="Version française">FR</a>`)
    // i18n-en.js porte les traductions, i18n.js les applique à ce que les scripts
    // écrivent : chargés en dernier, après les scripts dont ils traduisent le rendu.
    .replace('</body>', '<script src="/i18n-en.js"></script>\n<script src="/i18n.js"></script>\n</body>');

  html = html.replace(/@@BLOC(\d+)@@/g, (m, i) => coffre[+i]);

  const sortie = fichier === '404.html' ? 'en/404.html' : 'en/' + fichier;
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, crlf ? html.replace(/\n/g, '\r\n') : html);
  return sortie;
}

// Les pages françaises reçoivent en retour leur lien vers l'anglais.
function marquerFrancais(fichier) {
  const brut = fs.readFileSync(fichier, 'utf8');
  const crlf = brut.includes('\r\n');
  let html = brut.replace(/\r\n/g, '\n');
  if (html.includes('hreflang="en"')) return false;
  const chemin = fichier === '404.html' ? '/404.html' : '/' + fichier.replace(/index\.html$/, '');
  html = html.replace(/(<link rel="canonical" href="[^"]*">)/, `$1` +
    `\n<link rel="alternate" hreflang="fr" href="${SITE}${chemin}">` +
    `\n<link rel="alternate" hreflang="en" href="${SITE}/en${chemin}">` +
    `\n<link rel="alternate" hreflang="x-default" href="${SITE}${chemin}">`);
  fs.writeFileSync(fichier, crlf ? html.replace(/\n/g, '\r\n') : html);
  return true;
}

const faites = [];
for (const p of PAGES) { faites.push(page(p)); marquerFrancais(p); }

console.log(`${faites.length} pages anglaises générées : ${faites.join(', ')}`);
if (manquantes.size) {
  console.log(`\n${manquantes.size} chaîne(s) sans traduction (restées en français) :`);
  [...manquantes].slice(0, 30).forEach(t => console.log('  ' + t.slice(0, 100)));
  process.exitCode = 1;
}
