/* Liste courte des corps à relever pour rapprocher la formule des 100 %.
 *
 *   node outils/liste-precision.mjs [fichier-de-sortie.md] [nombre=36]
 *
 * Pour chaque taille modélisée, on règle la formule de deduire-caps.mjs en
 * retirant tour à tour chaque corps relevé (un « comité » de formules). Sur
 * chaque corps autorisé pas encore relevé, ces formules prédisent les 21
 * plafonds : là où elles se contredisent le plus, la formule est incertaine,
 * et c'est là qu'un relevé rapporte le plus. On retient les corps les plus
 * incertains, en évitant deux voisins presque identiques.
 * Même format que liste-a-filmer.mjs (lisible par la page cochable).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { predire, reglerTous } from './caps-modele.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sortie = process.argv[2] || path.join(RACINE, 'liste-precision.md');
const NOMBRE = +(process.argv[3] || 36);

// Même formule que deduire-caps.mjs (caps-modele.mjs), réglée sur tous les cœurs.
const hq = JSON.parse(fs.readFileSync(path.join(RACINE, 'donnees', 'caps-2khq.json'), 'utf8'));
const A = hq.ordre;

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(RACINE, 'builds-reels.js'), 'utf8') + ';this.L=CORPS_LEGAUX;', ctx);
const POSTES = ['PG', 'SG', 'SF', 'PF', 'C'];
const NOM = { PG: 'Meneur de jeu', SG: 'Arrière', SF: 'Ailier', PF: 'Ailier fort', C: 'Pivot' };
const ATTR_FR = { 'Close Shot': 'Tirs de près', 'Driving Layup': 'Double-pas', 'Driving Dunk': 'Dunk en pénétration', 'Standing Dunk': 'Dunk sans élan',
  'Post Control': 'Contrôle au poste', 'Mid-Range': 'Mi-distance', 'Three-Point': 'Tir à 3 pts', 'Free Throw': 'Lancer franc',
  'Pass Accuracy': 'Précision des passes', 'Ball Handle': 'Contrôle du ballon', 'Speed With Ball': 'Vitesse avec ballon',
  'Interior Defense': 'Défense intérieure', 'Perimeter Defense': 'Défense extérieure', 'Steal': 'Interception', 'Block': 'Contre',
  'Offensive Rebound': 'Rebond offensif', 'Defensive Rebound': 'Rebond défensif', 'Speed': 'Vitesse', 'Agility': 'Agilité',
  'Strength': 'Force', 'Vertical': 'Détente' };
const metres = p => (Math.round(p * 2.54) / 100).toFixed(2).replace('.', ',') + ' m';
const pieds = p => `${Math.floor(p / 12)}'${p % 12}"`;
const kilos = lbs => (lbs / 2.2).toFixed(1).replace('.', ',') + ' kg';

const releve = new Set(hq.corps.map(c => `${c.h}|${c.w}|${c.wing}`));
const parH = {};
for (const c of hq.corps) (parH[c.h] ??= []).push(c);

const candidats = [];
// Taille non modélisée (moins de 8 corps) : liste-a-filmer.mjs s'en charge.
const tailles = [...new Set(POSTES.flatMap(p => Object.keys(ctx.L[p]).map(Number)))].sort((a, b) => a - b)
  .filter(h => (parH[h] || []).length >= 8);
const regles = await reglerTous(Object.fromEntries(tailles.map(h => [h, parH[h]])), A);
for (const h of tailles) {
  const corps = parH[h];
  const comite = [...regles[h].sans, regles[h].complet];
  const bornes = POSTES.map(p => ctx.L[p][h]).filter(Boolean);
  const w0 = Math.min(...bornes.map(b => b[0])), w1 = Math.max(...bornes.map(b => b[1]));
  const e0 = Math.min(...bornes.map(b => b[2])), e1 = Math.max(...bornes.map(b => b[3]));
  for (let w = w0; w <= w1; w++) for (let e = e0; e <= e1; e++) {
    if (releve.has(`${h}|${w}|${e}`)) continue;
    const poste = POSTES.find(p => { const b = ctx.L[p][h]; return b && w >= b[0] && w <= b[1] && e >= b[2] && e <= b[3]; });
    if (!poste) continue;
    const preds = comite.map(m => predire(m, w, e));
    let score = 0, pire = 0, attrPire = '';
    A.forEach((a, i) => {
      const v = preds.map(p => p[i]), ecart = Math.max(...v) - Math.min(...v);
      score += ecart;
      if (ecart > pire) { pire = ecart; attrPire = a; }
    });
    if (score > 0) candidats.push({ h, w, e, poste, score, pire, attrPire });
  }
  console.log(`taille ${h} po : ${corps.length} corps relevés, comité de ${comite.length} formules`);
}

// Les plus incertains d'abord, sans deux voisins proches (même taille, ±8 lbs et ±2 po).
candidats.sort((a, b) => b.score - a.score || b.pire - a.pire);
const choisis = [];
for (const c of candidats) {
  if (choisis.length >= NOMBRE) break;
  if (choisis.some(x => x.h === c.h && Math.abs(x.w - c.w) <= 8 && Math.abs(x.e - c.e) <= 2)) continue;
  if (choisis.filter(x => x.h === c.h).length >= 4) continue; // pas plus de 4 par taille
  choisis.push(c);
}

const parPoste = Object.fromEntries(POSTES.map(p => [p, []]));
for (const c of choisis.sort((a, b) => a.h - b.h || a.w - b.w || a.e - b.e)) parPoste[c.poste].push(c);
const lignes = [
  '# Corps à relever pour viser 100 %',
  '',
  `Généré le ${new Date().toISOString().slice(0, 10)} — ${choisis.length} corps choisis là où la formule hésite le plus.`,
  '',
  '**Comment faire**',
  '- Dans le **builder MyPLAYER du jeu** (ou l’appli 2K27), onglet **Attributs**, tableau entier dans l’image.',
  '- **Une capture nette par corps** suffit.',
  '- Le poids se règle à 0,5 kg près : vise la valeur de la liste (±0,5 kg n’est pas grave).',
  '- Chaque corps relevé améliore aussi tous ses voisins.',
  ''
];
for (const p of POSTES) {
  const l = parPoste[p];
  if (!l.length) continue;
  lignes.push(`## ${NOM[p]} — ${l.length} corps`, '', '| ✓ | Taille | Poids | Envergure | Pourquoi |', '|---|---|---|---|---|');
  for (const c of l) lignes.push(`| ☐ | ${metres(c.h)} (${pieds(c.h)}) | ${kilos(c.w)} | ${metres(c.e)} | formule incertaine : jusqu’à ${c.pire} pts d’écart (${ATTR_FR[c.attrPire] || c.attrPire}) |`);
  lignes.push('');
}
fs.writeFileSync(sortie, lignes.join('\n'));
console.log(`${choisis.length} corps → ${sortie}`);
console.log(POSTES.map(p => `${p} ${parPoste[p].length}`).join(', '));
console.log('Plus gros écarts :', choisis.slice().sort((a, b) => b.pire - a.pire).slice(0, 5).map(c => `${c.h}|${c.w}|${c.e} ${c.attrPire} ±${c.pire}`).join(' ; '));
