/* Revue rapide du code du site : ce qui ne sert plus, ce qui traîne.
 *
 *   node outils/revue-code.mjs
 *
 * Analyse textuelle volontairement simple — elle signale des pistes, pas des
 * verdicts : une fonction peut être appelée depuis une page HTML ou par un nom
 * calculé. Chaque ligne est donc à vérifier avant de supprimer quoi que ce soit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const SCRIPTS = fs.readdirSync('.').filter(f => f.endsWith('.js') && !['sw.js', 'i18n-en.js'].includes(f));
const PAGES = ['index.html', 'hub/index.html', 'reference/index.html', 'mon-build/index.html', 'mentions-legales/index.html', '404.html'];
const sources = Object.fromEntries(SCRIPTS.map(f => [f, fs.readFileSync(f, 'utf8')]));
const html = PAGES.map(p => fs.readFileSync(p, 'utf8')).join('\n');
const tout = Object.values(sources).join('\n');

const dire = [];

/* 1. Fonctions déclarées et jamais appelées ailleurs. */
for (const [f, s] of Object.entries(sources)) {
  for (const m of s.matchAll(/^function ([a-zA-Z_$][\w$]*)\s*\(/gm)) {
    const nom = m[1];
    // Une fonction peut être appelée, mais aussi passée telle quelle à un
    // addEventListener : on compte toutes les mentions du nom, pas les appels.
    const appels = (tout.match(new RegExp(`\\b${nom}\\b`, 'g')) || []).length;
    const dansHtml = html.includes(nom + '(') || html.includes(`"${nom}"`);
    const expose = tout.includes(`window.${nom}`) || tout.includes(`'${nom}'`) || tout.includes(`"${nom}"`);
    if (appels <= 1 && !dansHtml && !expose) dire.push(`${f} : fonction « ${nom} » déclarée mais jamais appelée`);
  }
}

/* 2. Traces de mise au point oubliées. */
for (const [f, s] of Object.entries(sources)) {
  s.split('\n').forEach((l, i) => {
    if (/console\.(log|debug|table)\s*\(/.test(l) && !/\/\//.test(l.split('console')[0])) dire.push(`${f}:${i + 1} : console.${l.match(/console\.(\w+)/)[1]} laissé dans le code`);
    if (/\b(TODO|FIXME|XXX|HACK)\b/.test(l)) dire.push(`${f}:${i + 1} : ${l.trim().slice(0, 90)}`);
    if (/\bdebugger\b/.test(l)) dire.push(`${f}:${i + 1} : debugger oublié`);
  });
}

/* 3. Identifiants cités dans le JS mais absents des pages. */
const idsHtml = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
const idsJs = new Map();
for (const [f, s] of Object.entries(sources)) {
  for (const m of s.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g)) {
    if (!idsHtml.has(m[1])) idsJs.set(m[1], (idsJs.get(m[1]) || new Set()).add(f));
  }
}
for (const [id, fichiers] of idsJs) {
  // Beaucoup d'éléments sont créés par le JS lui-même : on ne signale que ceux
  // qu'aucun script ne fabrique.
  if (tout.includes(`id="${id}"`) || tout.includes(`id='${id}'`) || tout.includes('id=\\"' + id)) continue;
  dire.push(`#${id} cherché par ${[...fichiers].join(', ')} mais absent des pages`);
}

/* 4. Fichiers jamais chargés par une page ni par le service worker. */
const sw = fs.readFileSync('sw.js', 'utf8');
for (const f of SCRIPTS) {
  if (!html.includes(f) && !sw.includes(f)) dire.push(`${f} : jamais chargé par une page`);
}

/* 5. Styles déclarés mais jamais employés (classes seulement). */
const css = ['theme.css', 'hq.css'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
const classes = new Set([...css.matchAll(/\.([a-z][\w-]{3,})(?=[^\w-])/g)].map(m => m[1]));
const utilisees = new Set([...(tout + html).matchAll(/[\w-]+/g)].map(m => m[0]));
const orphelines = [...classes].filter(c => !utilisees.has(c));
if (orphelines.length) dire.push(`${orphelines.length} classe(s) CSS sans emploi visible : ${orphelines.slice(0, 12).join(', ')}${orphelines.length > 12 ? '…' : ''}`);

if (dire.length) {
  console.log(`${dire.length} point(s) à regarder :\n`);
  dire.forEach(d => console.log('  ' + d));
} else {
  console.log('Rien à signaler.');
}
