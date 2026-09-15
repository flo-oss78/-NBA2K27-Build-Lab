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
 * Formule et réglage : caps-modele.mjs (calcul réparti sur tous les cœurs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { predire, reglerTous } from './caps-modele.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const hq = JSON.parse(fs.readFileSync(path.join(RACINE, 'donnees', 'caps-2khq.json'), 'utf8'));
const A = hq.ordre;
const MIN_CORPS = 8;

const parH = {};
for (const c of hq.corps) (parH[c.h] ??= []).push(c);

const tailles = Object.keys(parH).map(Number).sort((a, b) => a - b).filter(h => {
  const corps = parH[h];
  return corps.length >= MIN_CORPS && new Set(corps.map(c => c.w)).size >= 3 && new Set(corps.map(c => c.wing)).size >= 2;
});
const regles = await reglerTous(Object.fromEntries(tailles.map(h => [h, parH[h]])), A);

const MODELES = {};
let testes = 0, capsTotal = 0, capsExacts = 0, capsUnPoint = 0, corpsExacts = 0, pire = 0;
for (const h of tailles) {
  const corps = parH[h];
  MODELES[h] = regles[h].complet;
  let hT = 0, hE = 0;
  corps.forEach((cache, i) => {
    const m = regles[h].sans[i];
    if (cache.w < m.w[0] || cache.w > m.w[1] || cache.wing < m.e[0] || cache.wing > m.e[1]) return;
    const p = predire(m, cache.w, cache.wing);
    const ecarts = p.map((v, j) => Math.abs(v - cache.caps[j]));
    testes++; hT++;
    capsTotal += 21; capsExacts += ecarts.filter(e => e === 0).length; capsUnPoint += ecarts.filter(e => e <= 1).length;
    if (ecarts.every(e => e === 0)) { corpsExacts++; hE++; }
    pire = Math.max(pire, ...ecarts);
  });
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
