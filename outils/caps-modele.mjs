/* Formule des plafonds déduits, partagée par deduire-caps.mjs et liste-precision.mjs.
 *
 * Pour chaque attribut : plafond = arrondi(base + a·x + b·y + d·x·y), borné à 25–99,
 * x = poids − poids moyen (lbs), y = envergure − envergure moyenne (pouces).
 * Le réglage cherche (a, b, d) qui laisse la plus grande marge en reproduisant
 * TOUS les corps donnés, par une grille puis deux affinages.
 *
 * Même calcul, au bit près, que l'ancienne version de deduire-caps.mjs (mêmes
 * boucles, même ordre des opérations flottantes, mêmes départages d'égalité) ;
 * seul a·x + b·y est calculé une fois par point avant la boucle sur d.
 * reglerTous() répartit les réglages sur plusieurs cœurs (caps-worker.mjs).
 */
import os from 'node:os';
import { Worker } from 'node:worker_threads';

const iv = v => v >= 99 ? [98.5, 1e9] : v <= 25 ? [-1e9, 25.5] : [v - 0.5, v + 0.5];

function regler(pts) {
  const n = pts.length, X = new Float64Array(n), Y = new Float64Array(n), L = new Float64Array(n), H = new Float64Array(n), AB = new Float64Array(n);
  pts.forEach(([x, y, v], i) => { X[i] = x; Y[i] = y; const [l, h] = iv(v); L[i] = l; H[i] = h; });
  // Marge [lo, hi] laissée à la base pour une pente (a, b) déjà appliquée dans AB.
  const evalueD = d => {
    let lo = -1e9, hi = 1e9;
    for (let i = 0; i < n; i++) {
      const s = AB[i] + d * X[i] * Y[i];
      if (L[i] - s > lo) lo = L[i] - s;
      if (H[i] - s < hi) hi = H[i] - s;
      if (hi < lo - 3) break;
    }
    return [hi - lo, lo, hi];
  };
  const poserAB = (a, b) => { for (let i = 0; i < n; i++) AB[i] = a * X[i] + b * Y[i]; };
  let m0 = -1e9, best = [0, 0, 0], lo0 = 0, hi0 = 0;
  for (let a = -2; a <= 2.0001; a += 0.05) for (let b = -5; b <= 5.0001; b += 0.1) {
    poserAB(a, b);
    for (let d = -0.2; d <= 0.2001; d += 0.01) {
      const [m, lo, hi] = evalueD(d); if (m > m0) { m0 = m; best = [a, b, d]; lo0 = lo; hi0 = hi; }
    }
  }
  for (const [pa, pb, pd] of [[0.01, 0.02, 0.002], [0.002, 0.004, 0.0004]]) {
    const [a0, b0, d0] = best;
    for (let i = -12; i <= 12; i++) for (let j = -12; j <= 12; j++) {
      const a = a0 + i * pa, b = b0 + j * pb;
      poserAB(a, b);
      for (let k = -12; k <= 12; k++) {
        const d = d0 + k * pd;
        const [m, lo, hi] = evalueD(d); if (m > m0) { m0 = m; best = [a, b, d]; lo0 = lo; hi0 = hi; }
      }
    }
  }
  const fini = x => Math.abs(x) < 1e8;
  const base = fini(lo0) && fini(hi0) ? (lo0 + hi0) / 2 : fini(lo0) ? lo0 + 0.5 : hi0 - 0.5;
  return [base, ...best];
}

const r6 = x => +x.toFixed(6);

export function modele(corps, A) {
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

export function predire(m, w, wing) {
  const x = w - m.xm, y = wing - m.ym;
  return m.c.map(k => Math.min(99, Math.max(25, k.length === 1 ? k[0] : Math.floor(k[0] + k[1] * x + k[2] * y + k[3] * x * y + 0.5))));
}

/* Règle, pour chaque taille, le modèle complet et un modèle par corps retiré.
 * groupes : { taille: [corps…] }. Renvoie { taille: { complet, sans: [modèle sans le corps i] } }. */
export async function reglerTous(groupes, A) {
  const travaux = [];
  for (const [h, corps] of Object.entries(groupes)) {
    travaux.push({ h, sans: -1, corps });
    corps.forEach((_, i) => travaux.push({ h, sans: i, corps: corps.filter((__, j) => j !== i) }));
  }
  const res = {};
  for (const h of Object.keys(groupes)) res[h] = { complet: null, sans: new Array(groupes[h].length) };
  const nb = Math.max(1, Math.min(os.cpus().length, travaux.length));
  let suivant = 0;
  await Promise.all(Array.from({ length: nb }, () => new Promise((ok, echec) => {
    const w = new Worker(new URL('./caps-worker.mjs', import.meta.url));
    const donner = () => {
      if (suivant >= travaux.length) { w.terminate(); ok(); return; }
      const t = travaux[suivant++];
      w.postMessage({ h: t.h, sans: t.sans, corps: t.corps, A });
    };
    w.on('message', ({ h, sans, m }) => { if (sans < 0) res[h].complet = m; else res[h].sans[sans] = m; donner(); });
    w.on('error', echec);
    donner();
  })));
  return res;
}
