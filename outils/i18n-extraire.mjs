/* Extrait tout le texte français à traduire, pour la version anglaise du site.
 *
 *   node outils/i18n-extraire.mjs [sortie.json]
 *
 * Deux sources, traitées séparément car elles se traduisent différemment :
 * - PAGES   : le texte visible des fichiers HTML (nœuds de texte et attributs).
 *             Il devient le contenu des pages /en/, générées par i18n-generer.mjs.
 * - SCRIPTS : les chaînes littérales des fichiers .js qui contiennent du français.
 *             Elles sont traduites à l'exécution par la table de traductions.
 *
 * Le fichier produit sert de source unique : chaque entrée garde son emplacement,
 * pour qu'une chaîne oubliée soit repérable, et pour qu'un texte modifié en
 * français ressorte comme non traduit au lieu d'afficher l'ancienne version.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);
const SORTIE = process.argv[2] || 'donnees/i18n-source.json';

const PAGES = ['index.html', 'hub/index.html', 'reference/index.html', 'mon-build/index.html', 'mentions-legales/index.html', '404.html'];
const ATTRS_TEXTE = ['aria-label', 'placeholder', 'title', 'alt', 'content', 'value', 'label', 'data-libelle'];

// Un texte est « français » s'il porte un accent ou un mot outil du français.
const MOTS_FR = /(^|[\s'’(])(le|la|les|un|une|des|du|de|ton|ta|tes|ce|cette|ces|qui|que|quoi|pour|avec|sans|dans|sur|par|plus|moins|est|sont|as|tu|il|elle|on|nous|vous|ils|pas|ne|et|ou|au|aux|son|sa|ses|leur|leurs|chaque|tout|toute|tous|toutes|selon|entre|vers|déjà|encore|jamais|aussi)([\s'’),.:;!?]|$)/i;
const ACCENTS = /[àâäçéèêëîïôöûùüÿœÀÂÄÇÉÈÊËÎÏÔÖÛÙÜŸŒ]/;
/* Un indice explicite est exigé : accent ou mot outil français. Sans cette règle,
   les noms anglais du jeu (« Speed With Ball », « City Alley-Oop 360s ») étaient
   comptés comme du français à traduire, et builds-reels.js pesait 2 270 fausses
   chaînes au lieu de 5. */
const estFrancais = t => t.length >= 2 && /[A-Za-zÀ-ÿ]{2}/.test(t) && (ACCENTS.test(t) || MOTS_FR.test(t));

function textesHtml(fichier) {
  const brut = fs.readFileSync(fichier, 'utf8');
  // Les scripts et styles ne contiennent pas de texte affiché.
  const html = brut.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  const vus = new Set(), sortie = [];
  const ajouter = (texte, ou) => {
    const t = texte.replace(/\s+/g, ' ').trim();
    if (!t || vus.has(t) || !estFrancais(t)) return;
    vus.add(t);
    sortie.push({ texte: t, ou });
  };
  for (const [, t] of html.matchAll(/>([^<>]+)</g)) ajouter(t, 'texte');
  for (const [, attr, val] of html.matchAll(new RegExp(`(${ATTRS_TEXTE.join('|')})="([^"]+)"`, 'g'))) ajouter(val, attr);
  return sortie;
}

function chainesJs(fichier) {
  // Les commentaires français sont retirés d'abord : leurs apostrophes (« l'écran »)
  // ouvrent de fausses chaînes et polluaient l'extraction de textes inexistants.
  const src = fs.readFileSync(fichier, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[\s;{}()])\/\/[^\n]*/g, '$1');
  const vus = new Set(), sortie = [];
  // Littéraux simples, doubles et gabarits sans expression : ceux qui portent du texte affiché.
  for (const [, , contenu] of src.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    const t = contenu.replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t || vus.has(t) || t.includes('${')) continue;
    if (!estFrancais(t)) continue;
    vus.add(t);
    sortie.push({ texte: t });
  }
  return sortie;
}

const pages = {}, scripts = {};
let nbPages = 0, nbScripts = 0;
for (const p of PAGES) {
  const t = textesHtml(p);
  if (t.length) { pages[p] = t; nbPages += t.length; }
}
for (const f of fs.readdirSync('.').filter(f => f.endsWith('.js')).sort()) {
  const c = chainesJs(f);
  if (c.length) { scripts[f] = c; nbScripts += c.length; }
}

fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
fs.writeFileSync(SORTIE, JSON.stringify({
  genere: new Date().toISOString().slice(0, 10),
  note: 'Source unique des textes à traduire. Régénérer après toute modification des textes français.',
  pages, scripts
}, null, 1) + '\n');

console.log(`${nbPages} chaînes dans ${Object.keys(pages).length} pages, ${nbScripts} chaînes dans ${Object.keys(scripts).length} scripts → ${SORTIE}`);
for (const [f, c] of Object.entries(scripts).sort((a, b) => b[1].length - a[1].length).slice(0, 8)) console.log(`  ${String(c.length).padStart(4)}  ${f}`);
