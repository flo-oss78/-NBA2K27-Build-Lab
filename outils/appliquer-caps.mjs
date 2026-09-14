/* Réapplique les plafonds relevés (donnees/caps-2khq.json) à builds-reels.js,
 * sans retélécharger LockerCodes ni NBA2KLab.
 *
 *   node outils/appliquer-caps.mjs
 *
 * importer-builds.mjs relit tout depuis Internet (plusieurs milliers de pages) :
 * pour ajouter des corps relevés dans 2K HQ ou dans le jeu, on recalcule
 * seulement CAPS_CORPS, avec exactement les mêmes règles que l'import :
 * - Signature Blueprint officiel : plafonds exacts ;
 * - sinon, minimum garanti = note la plus haute vue dans un build réel du corps ;
 * - plafonds relevés : exacts, ils priment, et le fichier est refusé si un build
 *   réel dépasse un de ses plafonds (erreur de lecture ou de conversion).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FICHIER = path.join(RACINE, 'builds-reels.js');
let source = fs.readFileSync(FICHIER, 'utf8');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(source + ';this.R=BUILDS_REELS;this.A=BUILDS_ATTRIBUTS;this.S=BUILDS_SOURCE;', ctx);
const ATTRS = [...ctx.A];

const capsCorps = {};
for (const b of ctx.R) {
  const cle = `${b[2]}|${b[3]}|${b[4]}`;
  const c = capsCorps[cle] ??= [0, new Array(21).fill(25)];
  if (c[0]) continue;
  if (b[7]) { capsCorps[cle] = [1, [...b[7]]]; continue; }
  b[6].forEach((n, i) => { if (n > c[1][i]) c[1][i] = n; });
}

const capsHQ = JSON.parse(fs.readFileSync(path.join(RACINE, 'donnees', 'caps-2khq.json'), 'utf8'));
if (capsHQ.ordre.join() !== ATTRS.join()) throw new Error('caps-2khq.json : ordre des attributs différent');
const vus = new Map();
for (const c of capsHQ.corps) {
  const cle = `${c.h}|${c.w}|${c.wing}`;
  if (c.caps.length !== 21 || c.caps.some(n => !Number.isInteger(n) || n < 25 || n > 99)) throw new Error(`caps-2khq.json : plafonds invalides pour ${cle}`);
  // Le plafond ne dépend que du corps : deux relevés du même corps doivent concorder.
  if (vus.has(cle) && vus.get(cle) !== c.caps.join()) throw new Error(`caps-2khq.json : deux relevés différents pour le corps ${cle}`);
  vus.set(cle, c.caps.join());
  for (const b of ctx.R) {
    if (`${b[2]}|${b[3]}|${b[4]}` !== cle) continue;
    b[6].forEach((n, i) => { if (n > c.caps[i]) throw new Error(`caps-2khq.json : « ${b[5]} » a ${ATTRS[i]} ${n} au-dessus du plafond relevé ${c.caps[i]} (${cle})`); });
  }
  capsCorps[cle] = [1, [...c.caps]];
}

const ligneCaps = /^const CAPS_CORPS=.*;$/m, ligneSource = /^const BUILDS_SOURCE=.*;$/m;
if (!ligneCaps.test(source) || !ligneSource.test(source)) throw new Error('builds-reels.js : lignes CAPS_CORPS ou BUILDS_SOURCE introuvables');
const sourceJSON = JSON.parse(JSON.stringify(ctx.S));
const hq = sourceJSON.sources.find(s => s.nom === 'App NBA 2K HQ');
if (hq) hq.role = `plafonds exacts de ${vus.size} corps, relevés dans le builder officiel (donnees/caps-2khq.json)`;
source = source.replace(ligneCaps, `const CAPS_CORPS=${JSON.stringify(capsCorps)};`)
               .replace(ligneSource, `const BUILDS_SOURCE=${JSON.stringify(sourceJSON)};`);
fs.writeFileSync(FICHIER, source);
console.log(`Plafonds connus : ${Object.keys(capsCorps).length} corps, dont ${Object.values(capsCorps).filter(c => c[0]).length} exacts (${vus.size} corps relevés)`);
