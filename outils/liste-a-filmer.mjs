/* Prépare la liste des corps à filmer dans le builder MyPLAYER du jeu.
 *
 *   node outils/liste-a-filmer.mjs [fichier-de-sortie.md]
 *
 * Pour chaque taille autorisée : les 4 coins (poids min/max × envergure min/max)
 * et le corps du milieu, pris sur l'ensemble des postes (les plafonds ne
 * dépendent pas du poste). Les corps déjà relevés sont retirés. Chaque corps
 * est rangé sous le premier poste qui l'autorise, pour filmer poste par poste.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sortie = process.argv[2] || path.join(RACINE, 'liste-a-filmer.md');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(RACINE, 'builds-reels.js'), 'utf8') + ';this.L=CORPS_LEGAUX;', ctx);
const hq = JSON.parse(fs.readFileSync(path.join(RACINE, 'donnees', 'caps-2khq.json'), 'utf8'));
const releve = new Set(hq.corps.map(c => `${c.h}|${c.w}|${c.wing}`));

const POSTES = ['PG', 'SG', 'SF', 'PF', 'C'];
const NOM = { PG: 'Meneur de jeu', SG: 'Arrière', SF: 'Ailier', PF: 'Ailier fort', C: 'Pivot' };
const metres = p => (Math.round(p * 2.54) / 100).toFixed(2).replace('.', ',') + ' m';
const pieds = p => `${Math.floor(p / 12)}'${p % 12}"`;
const kilos = lbs => (lbs / 2.2).toFixed(1).replace('.', ',') + ' kg';
const autorise = (pos, h, w, e) => { const b = ctx.L[pos][h]; return b && w >= b[0] && w <= b[1] && e >= b[2] && e <= b[3]; };

const tailles = [...new Set(POSTES.flatMap(p => Object.keys(ctx.L[p]).map(Number)))].sort((a, b) => a - b);
const parPoste = Object.fromEntries(POSTES.map(p => [p, []]));
let total = 0, dejaFaits = 0;
for (const h of tailles) {
  const bornes = POSTES.map(p => ctx.L[p][h]).filter(Boolean);
  const w0 = Math.min(...bornes.map(b => b[0])), w1 = Math.max(...bornes.map(b => b[1]));
  const e0 = Math.min(...bornes.map(b => b[2])), e1 = Math.max(...bornes.map(b => b[3]));
  const wm = Math.round((w0 + w1) / 2), em = Math.round((e0 + e1) / 2);
  // Coins, puis milieux des bords et centre : la grille 3 × 3 poids × envergure.
  // Les coins bornent la formule ; les milieux la corrigent là où elle devine.
  const cibles = [[w0, e0, 'poids min, envergure min'], [w0, e1, 'poids min, envergure max'], [w1, e0, 'poids max, envergure min'], [w1, e1, 'poids max, envergure max'],
    [wm, em, 'milieu'], [wm, e0, 'poids moyen, envergure min'], [wm, e1, 'poids moyen, envergure max'], [w0, em, 'poids min, envergure moyenne'], [w1, em, 'poids max, envergure moyenne']];
  const vus = new Set();
  for (let [w, e, role] of cibles) {
    const cle = `${h}|${w}|${e}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    if (releve.has(cle)) { dejaFaits++; continue; }
    // Le corps milieu doit exister pour au moins un poste ; sinon on le décale vers un poste qui l'autorise.
    // Un corps écarté (relevé contradictoire) est à refaire sous un autre poste que la première fois.
    const ecarte = (hq.ecartes || []).find(c => `${c.h}|${c.w}|${c.wing}` === cle);
    let poste = POSTES.find(p => autorise(p, h, w, e) && !(ecarte && ecarte.poste === p)) || POSTES.find(p => autorise(p, h, w, e));
    if (ecarte && poste) role += ` — à refaire en ${NOM[poste]} (relevé précédent contradictoire)`;
    let ww = w, ee = e;
    if (!poste) {
      for (const p of POSTES) { const b = ctx.L[p][h]; if (!b) continue; ww = Math.min(b[1], Math.max(b[0], w)); ee = Math.min(b[3], Math.max(b[2], e)); if (!releve.has(`${h}|${ww}|${ee}`)) { poste = p; break; } }
      if (!poste) continue;
    }
    parPoste[poste].push({ h, w: ww, e: ee, role });
    total++;
  }
}

const lignes = [
  '# Corps à filmer dans le builder du jeu',
  '',
  `Généré le ${new Date().toISOString().slice(0, 10)} — ${total} corps (${dejaFaits} déjà relevés retirés de la liste).`,
  '',
  '**Comment filmer**',
  '- Dans le **builder MyPLAYER du jeu** (pas 2K HQ : son tableau s’affiche avec jusqu’à 1 s de retard).',
  '- Onglet **Attributs** visible, tableau entier dans l’image, écran net.',
  '- Règle le corps, puis **reste immobile 2 secondes** avant de passer au suivant.',
  '- Le poids se règle à 0,5 kg près : vise la valeur de la liste (±0,5 kg n’est pas grave, dis-le-moi simplement).',
  '- Les tailles et envergures peuvent s’afficher avec 1 cm d’écart (ex. 1,85 m / 1,86 m).',
  '- Pas besoin de tout faire d’un coup : chaque corps filmé rend le builder plus exact.',
  ''
];
for (const p of POSTES) {
  const l = parPoste[p];
  if (!l.length) continue;
  lignes.push(`## ${NOM[p]} — ${l.length} corps`, '', '| ✓ | Taille | Poids | Envergure | Pourquoi |', '|---|---|---|---|---|');
  for (const c of l) lignes.push(`| ☐ | ${metres(c.h)} (${pieds(c.h)}) | ${kilos(c.w)} | ${metres(c.e)} | ${c.role} |`);
  lignes.push('');
}
fs.writeFileSync(sortie, lignes.join('\n'));
console.log(`${total} corps à filmer → ${sortie}`);
console.log(POSTES.map(p => `${p} ${parPoste[p].length}`).join(', '));
