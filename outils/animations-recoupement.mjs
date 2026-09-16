/* Reclasse les « désaccords » d'animations à la lumière des attributs communs.
 *
 *   node outils/animations-recoupement.mjs            montre ce qui changerait
 *   node outils/animations-recoupement.mjs --ecrire   applique dans animations.js
 *
 * Pourquoi : la comparaison d'origine confrontait les LISTES de valeurs des deux
 * sources. Or LockerCodes ne publie pas la détente sur les dunks signature.
 * « Standing Dunk 55, Driving Dunk 80 » contre « Standing Dunk 55, Driving Dunk
 * 80, Vertical 60 » était compté comme un désaccord, alors que les deux sources
 * disent exactement la même chose là où elles parlent toutes les deux.
 *
 * Ici on relit la note déjà enregistrée pour chaque entrée en désaccord, on
 * compare attribut par attribut, et on ne garde en désaccord que les vraies
 * contradictions. outils/importer-animations.mjs applique la même règle à la
 * prochaine régénération : ce script ne sert qu'à corriger le fichier existant
 * sans avoir à retélécharger les deux sites.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);
const ECRIRE = process.argv.includes('--ecrire');

const source = fs.readFileSync('animations.js', 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(source + ';this.A=ANIMATIONS;this.S=ANIMATIONS_SOURCE;', ctx);

const accords = [], vrais = [];
for (const a of ctx.A) {
  if (a.v !== 0 || !a.note) continue;
  // « LockerCodes indique Driving Dunk 80, Standing Dunk 55 (6'5" – 6'9") »
  const m = a.note.match(/LockerCodes indique (.+?) \(/);
  if (!m) { vrais.push([a, 'note illisible']); continue; }
  if (/aucun attribut/.test(m[1])) { vrais.push([a, 'LockerCodes ne donne aucun attribut']); continue; }
  const eux = {};
  for (const bout of m[1].split(', ')) {
    const p = bout.match(/^(.+) (\d{1,2})$/);
    if (p) eux[p[1]] = +p[2];
  }
  const noms = Object.keys(eux);
  const communs = noms.filter(k => k in (a.req || {}));
  const memeCouverture = communs.length === noms.length;
  const memesChiffres = communs.length > 0 && communs.every(k => a.req[k] === eux[k]);
  if (memeCouverture && memesChiffres) accords.push(a);
  else vrais.push([a, communs.map(k => `${k} ${a.req[k]} contre ${eux[k]}`).filter((s, i) => a.req[communs[i]] !== eux[communs[i]]).join(', ') || 'attributs différents']);
}

console.log(`${ctx.A.filter(a => a.v === 0).length} entrées étaient classées « sources en désaccord ».`);
console.log(`  ${accords.length} disent en fait la même chose, LockerCodes publiant une colonne de moins :`);
accords.slice(0, 5).forEach(a => console.log(`    ${a.category} / ${a.name}`));
if (accords.length > 5) console.log(`    … et ${accords.length - 5} autres`);
console.log(`  ${vrais.length} restent en désaccord :`);
vrais.forEach(([a, quoi]) => console.log(`    ${a.category} / ${a.name} — ${quoi}`));

if (!ECRIRE) { console.log('\nRien écrit. Relancer avec --ecrire pour appliquer.'); process.exit(0); }

let html = source;
let faits = 0;
for (const a of accords) {
  // Chaque entrée est un objet JSON sur sa ligne : on la retrouve par son nom,
  // sa catégorie et sa note, puis on n'y change que « v ».
  const cle = JSON.stringify(a.note);
  const avant = `"v":0,"note":${cle}`;
  const apres = `"v":2,"note":${JSON.stringify(a.note + ' : mêmes chiffres, sans les attributs que LockerCodes ne publie pas.')}`;
  if (!html.includes(avant)) { console.log(`  (non trouvé dans le fichier : ${a.name})`); continue; }
  html = html.replace(avant, apres);
  faits++;
}
// Les totaux affichés sur le site doivent suivre.
const s = ctx.S;
const neuf = { ...s, recoupees: s.recoupees + faits, desaccords: s.desaccords - faits };
html = html.replace(/const ANIMATIONS_SOURCE=\{.*?\};/s, `const ANIMATIONS_SOURCE=${JSON.stringify(neuf)};`);
fs.writeFileSync('animations.js', html);
console.log(`\nanimations.js : ${faits} entrées reclassées « recoupées ». Recoupées ${neuf.recoupees}, en désaccord ${neuf.desaccords}.`);
