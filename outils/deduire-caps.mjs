/* Génère caps-deduits.js : plafonds DÉDUITS des corps relevés dans le jeu et 2K HQ.
 *
 *   node outils/deduire-caps.mjs
 *
 * Pour chaque taille assez couverte et chaque attribut, on cherche
 *   plafond = arrondi(base + a·x + b·y + d·x·y), borné à 25–99,
 * x = poids − poids moyen (lbs), y = envergure − envergure moyenne (pouces),
 * tel que TOUS les corps relevés de cette taille soient reproduits (marge maximale).
 * Le modèle ne sert qu'à l'INTÉRIEUR des poids et envergures relevés : aux
 * extrêmes, les erreurs dépassent 10 points, on ne s'en sert pas.
 *
 * La précision affichée sur le site est MESURÉE ici : chaque corps intérieur est
 * caché, le modèle est réglé sans lui, puis ses 21 plafonds sont prédits.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hq = JSON.parse(fs.readFileSync(path.join(RACINE, 'donnees', 'caps-2khq.json'), 'utf8'));
const A = hq.ordre;
const MIN_CORPS = 8;

const parH = {};
for (const c of hq.corps) (parH[c.h] ??= []).push(c);

const iv = v => v >= 99 ? [98.5, 1e9] : v <= 25 ? [-1e9, 25.5] : [v - 0.5, v + 0.5];
function regler(pts) {
  const evalue = (a, b, d) => {
    let lo = -1e9, hi = 1e9;
    for (const [x, y, v] of pts) { const [l, h] = iv(v), s = a * x + b * y + d * x * y; if (l - s > lo) lo = l - s; if (h - s < hi) hi = h - s; if (hi < lo - 3) break; }
    return [hi - lo, lo, hi];
  };
  let m0 = -1e9, best = [0, 0, 0], lo0 = 0, hi0 = 0;
  for (let a = -2; a <= 2.0001; a += 0.05) for (let b = -5; b <= 5.0001; b += 0.1) for (let d = -0.2; d <= 0.2001; d += 0.01) {
    const [m, lo, hi] = evalue(a, b, d); if (m > m0) { m0 = m; best = [a, b, d]; lo0 = lo; hi0 = hi; }
  }
  for (const [pa, pb, pd] of [[0.01, 0.02, 0.002], [0.002, 0.004, 0.0004]]) {
    const [a0, b0, d0] = best;
    for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) for (let k = -12; k <= 12; k++) {
      const [m, lo, hi] = evalue(a0 + i * pa, b0 + j * pb, d0 + k * pd); if (m > m0) { m0 = m; best = [a0 + i * pa, b0 + j * pb, d0 + k * pd]; lo0 = lo; hi0 = hi; }
    }
  }
  const fini = x => Math.abs(x) < 1e8;
  const base = fini(lo0) && fini(hi0) ? (lo0 + hi0) / 2 : fini(lo0) ? lo0 + 0.5 : hi0 - 0.5;
  return [base, ...best];
}
const r6 = x => +x.toFixed(6);
function modele(corps) {
  const xm = corps.reduce((s, c) => s + c.w, 0) / corps.length, ym = corps.reduce((s, c) => s + c.wing, 0) / corps.length;
  const c = A.map((_, i) => {
    const pts = corps.map(k => [k.w - xm, k.wing - ym, k.caps[i]]);
    if (pts.every(p => p[2] >= 99)) return [99];
    if (pts.every(p => p[2] <= 25)) return [25];
    return regler(pts).map(r6);
  });
  return { n: corps.length, w: [Math.min(...corps.map(k => k.w)), Math.max(...corps.map(k => k.w))],
    e: [Math.min(...corps.map(k => k.wing)), Math.max(...corps.map(k => k.wing))], xm: r6(xm), ym: r6(ym), c };
}
function predire(m, w, wing) {
  const x = w - m.xm, y = wing - m.ym;
  return m.c.map(k => Math.min(99, Math.max(25, k.length === 1 ? k[0] : Math.floor(k[0] + k[1] * x + k[2] * y + k[3] * x * y + 0.5))));
}

const MODELES = {};
let testes = 0, capsTotal = 0, capsExacts = 0, capsUnPoint = 0, corpsExacts = 0, pire = 0;
for (const h of Object.keys(parH).map(Number).sort((a, b) => a - b)) {
  const corps = parH[h];
  if (corps.length < MIN_CORPS || new Set(corps.map(c => c.w)).size < 3 || new Set(corps.map(c => c.wing)).size < 2) continue;
  MODELES[h] = modele(corps);
  let hT = 0, hE = 0;
  for (const cache of corps) {
    const autres = corps.filter(c => c !== cache);
    const m = modele(autres);
    if (cache.w < m.w[0] || cache.w > m.w[1] || cache.wing < m.e[0] || cache.wing > m.e[1]) continue;
    const p = predire(m, cache.w, cache.wing);
    const ecarts = p.map((v, i) => Math.abs(v - cache.caps[i]));
    testes++; hT++;
    capsTotal += 21; capsExacts += ecarts.filter(e => e === 0).length; capsUnPoint += ecarts.filter(e => e <= 1).length;
    if (ecarts.every(e => e === 0)) { corpsExacts++; hE++; }
    pire = Math.max(pire, ...ecarts);
  }
  console.log(`taille ${h} po : modèle sur ${corps.length} corps, validation ${hE}/${hT} corps intérieurs exacts`);
}
const PRECISION = testes ? { corps: testes, exacts: +(capsExacts / capsTotal * 100).toFixed(1), unPoint: +(capsUnPoint / capsTotal * 100).toFixed(1), pire } : null;
console.log('Précision mesurée :', JSON.stringify(PRECISION));

const contenu = `/* NBA 2K27 Build Lab — Plafonds DÉDUITS des corps relevés
   FICHIER GÉNÉRÉ par outils/deduire-caps.mjs le ${new Date().toISOString().slice(0, 10)} : ne pas modifier à la main.
   CAPS_MODELES[taille] = { n corps relevés, w [poids min, max], e [envergure min, max], xm, ym,
     c : pour chaque attribut [base, a, b, d] (ou [valeur fixe]) }
   Utilisé seulement à l'intérieur des poids et envergures relevés à cette taille.
   CAPS_PRECISION : mesurée en cachant chaque corps intérieur (${PRECISION ? PRECISION.corps : 0} corps). */
const CAPS_ATTRIBUTS=${JSON.stringify(A)};
const CAPS_MODELES=${JSON.stringify(MODELES)};
const CAPS_PRECISION=${JSON.stringify(PRECISION)};
function capsDeduits(h,w,wing){
  const m=CAPS_MODELES[h];
  if(!m||w<m.w[0]||w>m.w[1]||wing<m.e[0]||wing>m.e[1])return null;
  const x=w-m.xm,y=wing-m.ym;
  return Object.fromEntries(CAPS_ATTRIBUTS.map((a,i)=>{const k=m.c[i];
    const v=k.length===1?k[0]:Math.floor(k[0]+k[1]*x+k[2]*y+k[3]*x*y+0.5);
    return [a,Math.min(99,Math.max(25,v))]}));
}
`;
fs.writeFileSync(path.join(RACINE, 'caps-deduits.js'), contenu);
console.log(`caps-deduits.js : ${Object.keys(MODELES).length} tailles modélisées`);
