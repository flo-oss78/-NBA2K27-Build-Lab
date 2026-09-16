/* Recalibre le modèle de points d'attributs (BUDGET_MODELES de builds-reels.js).
 *
 *   node outils/budget-modele.mjs            compare plusieurs planchers, n'écrit rien
 *   node outils/budget-modele.mjs --ecrire   réécrit BUDGET_MODELES dans builds-reels.js
 *
 * Pourquoi cet outil séparé de importer-builds.mjs : celui-ci retélécharge tout
 * (builds, blueprints, corps) et dépend de deux sites. Ici on repart des builds
 * déjà dans builds-reels.js — même méthode, mêmes données, sans réseau.
 *
 * Ce qu'il change : l'ajustement d'origine met à ZÉRO les attributs dont le coût
 * ressort négatif. Deux d'entre eux (Mi-distance, Lancers francs) devenaient donc
 * gratuits : on pouvait les monter à 99 sans rien dépenser, alors que le jeu les
 * fait payer comme les autres. Un plancher strictement positif les fait payer.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const K = 0.05, PLIS = 5, MIN_GROUPE = 80;
const ECRIRE = process.argv.includes('--ecrire');
// Plancher retenu : 0,1, choisi en comparant les marges (voir la sortie sans
// --ecrire). Il fait payer les 21 attributs sans rien coûter en précision —
// seul le pivot passe de ±5,6 à ±6,1 %. Plus haut (0,139 puis 0,2), l'ajustement
// se dégrade nettement ; plus bas, deux attributs restent gratuits.
const PLANCHER = 0.1;

const source = fs.readFileSync('builds-reels.js', 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(source + ';this.B=BUILDS_REELS;this.A=BUILDS_ATTRIBUTS;this.M=BUDGET_MODELES;', ctx);
const BUILDS = ctx.B.map(b => ({ pos: b[1], h: b[2], w: b[3], wing: b[4], v: b[6] }));

const f = b => [...b.v.map(n => Math.exp(K * (n - 25)) - 1), b.h, b.w / 10, b.wing];

function resoudre(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]]; const d = M[c][c]; if (Math.abs(d) < 1e-12) continue;
    for (let j = c; j <= n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) { if (r === c) continue; const q = M[r][c]; if (!q) continue; for (let j = c; j <= n; j++) M[r][j] -= q * M[c][j]; }
  }
  return M.map(r => r[n]);
}

/* Même ajustement que importer-builds.mjs, à une différence près : un coût
   d'attribut sous le plancher n'est pas supprimé, il est FIXÉ au plancher et
   son effet passe au second membre — le reste du modèle s'ajuste autour. */
function ajuster(S, plancher) {
  const X = S.map(f), n = X[0].length, m = X.length, moy = new Array(n).fill(0), REF = 6;
  X.forEach(x => x.forEach((v, i) => moy[i] += v / m));
  const fixes = new Map();                    // attribut → coût imposé
  for (let tour = 0; tour < 40; tour++) {
    const idx = [...Array(n).keys()].filter(i => i !== REF && !fixes.has(i));
    const A = idx.map(() => new Array(idx.length).fill(0)), b = new Array(idx.length).fill(0);
    for (const x of X) {
      const c = x.map((v, i) => v - moy[i]);
      // Ce que les coûts déjà fixés expliquent est retiré de la cible.
      let impose = 0;
      for (const [i, val] of fixes) impose += val * c[i];
      for (let a = 0; a < idx.length; a++) {
        const ca = c[idx[a]]; if (!ca) continue;
        b[a] -= ca * (c[REF] + impose);
        for (let q = 0; q < idx.length; q++) A[a][q] += ca * c[idx[q]];
      }
    }
    for (let a = 0; a < idx.length; a++) A[a][a] += 1e-3 * m;
    const s = resoudre(A, b), w = new Array(n).fill(0);
    w[REF] = 1;
    for (const [i, val] of fixes) w[i] = val;
    idx.forEach((i, a) => w[i] = s[a]);
    const sous = idx.filter(i => i < 21 && w[i] < plancher);
    if (!sous.length) {
      const budget = X.reduce((t, x) => t + x.reduce((u, v, i) => u + v * w[i], 0), 0) / m;
      return { w, budget };
    }
    sous.forEach(i => fixes.set(i, plancher));
  }
  throw new Error('ajustement du budget : pas de solution');
}

const ecart = (b, mod) => f(b).reduce((u, v, i) => u + v * mod.w[i], 0) / mod.budget - 1;

let graine = 42; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
function marge(S, plancher) {
  graine = 42;
  const corpsDe = b => `${b.h}|${b.w}|${b.wing}`;
  const corps = [...new Set(S.map(corpsDe))].sort(() => hasard() - 0.5);
  const pli = new Map(corps.map((c, i) => [c, i % PLIS])), erreurs = [];
  for (let p = 0; p < PLIS; p++) {
    const mod = ajuster(S.filter(b => pli.get(corpsDe(b)) !== p), plancher);
    for (const b of S) if (pli.get(corpsDe(b)) === p) erreurs.push(Math.abs(ecart(b, mod)));
  }
  erreurs.sort((a, b) => a - b);
  return erreurs[Math.floor(erreurs.length * 0.95)];
}

const groupes = {};
for (const b of BUILDS) (groupes[b.pos] ??= []).push(b);

function modeles(plancher) {
  const out = {};
  for (const [pos, S] of Object.entries(groupes)) {
    if (S.length < MIN_GROUPE) throw new Error(`${pos} : ${S.length} builds, trop peu`);
    const mod = ajuster(S, plancher);
    out[pos] = { n: S.length, budget: +mod.budget.toFixed(4), marge: +marge(S, plancher).toFixed(4), w: mod.w.map(x => +x.toFixed(6)) };
  }
  return out;
}

// Ce qu'un plancher coûte en précision, et ce qu'il rapporte : le nombre
// d'attributs qui restent gratuits.
const ORDRE = ['PG', 'SG', 'SF', 'PF', 'C'];
function resume(nom, m) {
  const lignes = ORDRE.filter(p => m[p]).map(p => {
    const gratuits = m[p].w.slice(0, 21).filter(x => x <= 0).length;
    return `${p} ±${(m[p].marge * 100).toFixed(1)} %${gratuits ? ` (${gratuits} gratuit${gratuits > 1 ? 's' : ''})` : ''}`;
  });
  console.log(`${nom.padEnd(18)} ${lignes.join('  ')}`);
}

if (!ECRIRE) {
  console.log('Marge de l’estimation par poste, selon le coût plancher imposé :\n');
  resume('actuel (fichier)', ctx.M);
  for (const p of [0, 0.05, 0.1, 0.139, 0.2]) resume(`plancher ${p}`, modeles(p));
  console.log('\nRien n’a été écrit. Relancer avec --ecrire pour appliquer le plancher retenu (' + PLANCHER + ').');
} else {
  const m = modeles(PLANCHER);
  resume(`plancher ${PLANCHER}`, m);
  const bloc = `const BUDGET_MODELES=${JSON.stringify(m)};`;
  const neuf = source.replace(/const BUDGET_MODELES=\{.*?\};/s, bloc);
  if (neuf === source) throw new Error('bloc BUDGET_MODELES introuvable dans builds-reels.js');
  fs.writeFileSync('builds-reels.js', neuf);
  console.log('builds-reels.js : BUDGET_MODELES réécrit.');
}
