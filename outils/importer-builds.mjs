/* Régénère builds-reels.js : builds complets réels, corps autorisés et budget estimé.
 *
 *   node outils/importer-builds.mjs
 *
 * Pourquoi un budget ESTIMÉ : la règle du jeu (« potentiel 99 », coût de chaque
 * point selon les plafonds du corps) n'est pas publique. On la reconstitue sur
 * des builds réels à 99 et on publie la marge d'erreur mesurée, jamais une
 * précision qu'on n'a pas.
 *
 * Sources :
 * - LockerCodes, noms de builds avec un exemple complet à 99 (/nba-2k/build-names),
 *   lus lentement (robots.txt : Allow /) ;
 * - NBA2KLab, 40 Signature Blueprints officiels 2K et table des corps autorisés
 *   par poste et par taille (page myplayer-builder).
 *
 * Modèle : par poste, coût = Σ w[a] · (exp(k·(note−25)) − 1) + termes de taille,
 * poids et envergure, ajusté pour que les builds du poste dépensent tous le même
 * budget. La marge est l'écart que 95 % des builds ne dépassent pas sur des
 * corps jamais vus (validation croisée par corps, 5 plis, graine fixe).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const LC_NOMS = 'https://www.lockercodes.io/nba-2k/build-names';
const LAB_BLUEPRINTS = 'https://www.nba2klab.com/signature-blueprints';
const LAB_BUILDER = 'https://www.nba2klab.com/myplayer-builder';
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const K = 0.05, MIN_GROUPE = 80, PLIS = 5;
const ATTRS = ['Close Shot', 'Driving Layup', 'Driving Dunk', 'Standing Dunk', 'Post Control', 'Mid-Range', 'Three-Point',
  'Free Throw', 'Pass Accuracy', 'Ball Handle', 'Speed With Ball', 'Interior Defense', 'Perimeter Defense', 'Steal', 'Block',
  'Offensive Rebound', 'Defensive Rebound', 'Speed', 'Agility', 'Strength', 'Vertical'];
const POSTES = { 'Point Guard': 'PG', 'Shooting Guard': 'SG', 'Small Forward': 'SF', 'Power Forward': 'PF', 'Center': 'C' };
const pause = ms => new Promise(r => setTimeout(r, ms));

// curl plutôt que fetch() : LockerCodes refuse le client HTTP de Node (403).
function telecharger(url) {
  const r = spawnSync('curl', ['-sSL', '--fail', '-A', UA, '-H', 'Accept-Language: en-US', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`curl introuvable : ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${url} : ${r.stderr.trim() || 'échec curl ' + r.status}`);
  return r.stdout;
}
const nextData = html => {
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('données Next.js introuvables, la page a changé');
  return JSON.parse(m[1]).props.pageProps;
};
const decode = s => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const pouces = t => { const m = String(t).match(/(\d+)'\s*(\d+)/); if (!m) throw new Error('taille illisible : ' + t); return +m[1] * 12 + +m[2]; };

/* ------------------------------------------------------ Corps autorisés */
// Référence : la table du builder LockerCodes, « vérifiée sur chaque corps légal
// du jeu ». Elle vit dans un module JavaScript au nom changeant : on la cherche
// parmi les modules chargés par la page du builder.
const LC_BUILDER = 'https://www.lockercodes.io/nba-2k/myplayer-builder';
const pageBuilder = telecharger(LC_BUILDER);
const modules = [...new Set([...pageBuilder.matchAll(/_app\/immutable\/(?:chunks|nodes|entry)\/[\w.-]+\.js/g)].map(m => m[0]))];
let tableLC = null;
for (const m of modules) {
  const js = telecharger('https://www.lockercodes.io/' + m);
  if (js.includes('minHeightInches') && js.includes('wingspan:{min:')) { tableLC = js; break; }
  await pause(300);
}
if (!tableLC) throw new Error('LockerCodes : table des corps introuvable, le builder a changé.');
const litteral = tableLC.match(/var e=(\[\{position:[\s\S]*?\}\]\}\])/);
if (!litteral) throw new Error('LockerCodes : format de la table des corps inconnu.');
const tableCorps = new Function(`return ${litteral[1]}`)(); // objet littéral pur : ni appel ni variable
const corps = {};
for (const p of tableCorps) {
  if (!['PG', 'SG', 'SF', 'PF', 'C'].includes(p.position)) throw new Error('poste inconnu : ' + p.position);
  for (const b of p.bodies) (corps[p.position] ??= {})[b.heightInches] = [b.weight.min, b.weight.max, b.wingspan.min, b.wingspan.max];
}
const legal = (pos, h, w, wing) => { const c = corps[pos]?.[h]; return !!c && w >= c[0] && w <= c[1] && wing >= c[2] && wing <= c[3]; };
console.log('Corps autorisés :', Object.entries(corps).map(([p, t]) => `${p} ${Math.min(...Object.keys(t))}-${Math.max(...Object.keys(t))} po`).join(', '));
// Recoupement avec NBA2KLab, pour information.
const ecartsCorps = [];
for (const x of nextData(telecharger(LAB_BUILDER)).capsDropDowns) {
  const pos = POSTES[x.position], lc = corps[pos]?.[+x.height], lab = [+x.weightMin, +x.weightMax, +x.wingMin, +x.wingMax];
  if (!lc) ecartsCorps.push(`${pos} ${x.height} po absent de LockerCodes`);
  else if (lc.join() !== lab.join()) ecartsCorps.push(`${pos} ${x.height} po : LockerCodes ${lc.join('/')} · NBA2KLab ${lab.join('/')}`);
}
console.log(`Corps : ${ecartsCorps.length} écart(s) avec NBA2KLab`);
ecartsCorps.slice(0, 12).forEach(e => console.log('  ' + e));

/* ------------------------------------------------------ Builds LockerCodes */
const builds = [], vus = new Set();
let illegaux = 0;
for (let page = 1; page < 200; page++) {
  const html = telecharger(`${LC_NOMS}?page=${page}`);
  for (const m of html.matchAll(/href="\/nba-2k\/myplayer-builder\?b=([A-Z]{1,2})\.(\d+)\.(\d+)\.(\d+)\.([\d-]+)[^"]*"[^>]*>([^<]+)</g)) {
    const [, pos, h, w, wing, notes, nom] = m, v = notes.split('-').map(Number);
    const cle = `${pos}.${h}.${w}.${wing}.${notes}`;
    if (vus.has(cle) || v.length !== 21 || v.some(n => !Number.isInteger(n) || n < 25 || n > 99)) continue;
    if (!legal(pos, +h, +w, +wing)) { illegaux++; continue; }
    vus.add(cle);
    builds.push({ s: 'lc', pos, h: +h, w: +w, wing: +wing, nom: decode(nom), v });
  }
  if (!html.includes(`page=${page + 1}"`)) break;
  await pause(1500);
}
console.log(`LockerCodes : ${builds.length} builds complets (${illegaux} écartés : corps hors table)`);
if (builds.length < 1000) throw new Error('trop peu de builds LockerCodes, la page a changé ?');

/* ------------------------------------------------------ Blueprints officiels */
const bp = nextData(telecharger(LAB_BLUEPRINTS)).builds;
const blueprints = [];
for (const x of bp) {
  const v = ATTRS.map(a => x.attributes[a.replace('Mid-Range', 'Mid-Range Shot').replace('Three-Point', 'Three-Point Shot')]?.[0]);
  if (v.some(n => !Number.isInteger(n))) throw new Error('Blueprint illisible : ' + x.id);
  const caps = ATTRS.map(a => x.attributes[a.replace('Mid-Range', 'Mid-Range Shot').replace('Three-Point', 'Three-Point Shot')]?.[1]);
  blueprints.push({ s: 'bp', pos: x.position, h: pouces(x.height), w: +x.weight, wing: pouces(x.wingspan), nom: x.archetype, v,
    ...(caps.every(Number.isInteger) ? { caps } : {}) });
}
console.log(`NBA2KLab : ${blueprints.length} Signature Blueprints, dont ${blueprints.filter(b => b.caps).length} avec leurs plafonds`);

/* ------------------------------------------------------ Budget estimé */
const tous = [...builds, ...blueprints];
// Variables : les 21 notes (coût croissant), puis le corps. Validé en mettant
// de côté des corps entiers : taille, poids et envergure divisent l'erreur par
// trois par rapport à un modèle par poste et par taille sur les seules notes.
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
// Ajuste w pour que X·w soit constant : données centrées, Trois points fixé à 1.
// Un point d'attribut ne peut pas « rendre » du budget : les coûts des notes
// négatifs sont retirés un à un (mis à zéro) jusqu'à ce qu'il n'en reste aucun.
// Sans cette contrainte, mettre tous les attributs à 99 restait « dans le budget ».
// Les termes de corps (taille, poids, envergure) restent libres.
function ajuster(S) {
  const X = S.map(f), n = X[0].length, m = X.length, moy = new Array(n).fill(0), REF = 6;
  X.forEach(x => x.forEach((v, i) => moy[i] += v / m));
  const actifs = new Set([...Array(n).keys()].filter(i => i !== REF));
  for (let tour = 0; tour < 30; tour++) {
    const idx = [...actifs];
    const A = idx.map(() => new Array(idx.length).fill(0)), b = new Array(idx.length).fill(0);
    for (const x of X) {
      const c = x.map((v, i) => v - moy[i]);
      for (let a = 0; a < idx.length; a++) { const ca = c[idx[a]]; if (!ca) continue; b[a] -= ca * c[REF]; for (let q = 0; q < idx.length; q++) A[a][q] += ca * c[idx[q]]; }
    }
    for (let a = 0; a < idx.length; a++) A[a][a] += 1e-3 * m;
    const s = resoudre(A, b), w = new Array(n).fill(0); w[REF] = 1; idx.forEach((i, a) => w[i] = s[a]);
    const negatifs = idx.filter(i => i < 21 && w[i] < 0);
    if (!negatifs.length) {
      const budget = X.reduce((t, x) => t + x.reduce((u, v, i) => u + v * w[i], 0), 0) / m;
      return { w, budget };
    }
    negatifs.forEach(i => actifs.delete(i));
  }
  throw new Error('ajustement du budget : pas de solution à coûts positifs');
}
const ecart = (b, mod) => f(b).reduce((u, v, i) => u + v * mod.w[i], 0) / mod.budget - 1;
let graine = 42; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
// Marge = écart que 95 % des builds ne dépassent pas, sur des CORPS jamais vus :
// tous les builds d'un même corps tombent dans le même pli.
function marge(S) {
  const corpsDe = b => `${b.h}|${b.w}|${b.wing}`;
  const corps = [...new Set(S.map(corpsDe))].sort(() => hasard() - 0.5);
  const pli = new Map(corps.map((c, i) => [c, i % PLIS])), erreurs = [];
  for (let p = 0; p < PLIS; p++) {
    const mod = ajuster(S.filter(b => pli.get(corpsDe(b)) !== p));
    for (const b of S) if (pli.get(corpsDe(b)) === p) erreurs.push(Math.abs(ecart(b, mod)));
  }
  erreurs.sort((a, b) => a - b);
  return erreurs[Math.floor(erreurs.length * 0.95)];
}
const modeles = {};
const groupes = {};
for (const b of tous) (groupes[b.pos] ??= []).push(b);
for (const [pos, S] of Object.entries(groupes)) {
  if (S.length < MIN_GROUPE) throw new Error(`${pos} : ${S.length} builds, trop peu pour estimer un budget`);
  const mod = ajuster(S);
  modeles[pos] = { n: S.length, budget: +mod.budget.toFixed(4), marge: +marge(S).toFixed(4), w: mod.w.map(x => +x.toFixed(6)) };
}
for (const [cle, m] of Object.entries(modeles).sort()) console.log(`budget ${cle.padEnd(6)} n=${String(m.n).padStart(4)} marge ±${(m.marge * 100).toFixed(1)} %`);

/* ------------------------------------------------------ Plafonds connus par corps */
// Le plafond est le même pour un corps quel que soit le poste (LockerCodes).
// Blueprints : plafonds exacts publiés. Ailleurs : le vrai plafond est AU MOINS
// la note la plus haute vue dans un build réel de ce corps.
const capsCorps = {};
for (const b of tous) {
  const cle = `${b.h}|${b.w}|${b.wing}`;
  const c = capsCorps[cle] ??= [0, new Array(21).fill(25)];
  if (c[0]) continue;
  if (b.caps) { capsCorps[cle] = [1, [...b.caps]]; continue; }
  b.v.forEach((n, i) => { if (n > c[1][i]) c[1][i] = n; });
}
// Plafonds officiels relevés dans le builder de l'app 2K HQ (vidéo de
// l'utilisateur, 14 septembre 2026) : exacts, ils priment sur tout le reste.
// On refuse le fichier si un build réel dépasse un de ses plafonds : ce serait
// une erreur de lecture ou de conversion.
const capsHQ = JSON.parse(fs.readFileSync(path.join(RACINE, 'donnees', 'caps-2khq.json'), 'utf8'));
if (capsHQ.ordre.join() !== ATTRS.join()) throw new Error('caps-2khq.json : ordre des attributs différent');
for (const c of capsHQ.corps) {
  const cle = `${c.h}|${c.w}|${c.wing}`;
  if (c.caps.length !== 21 || c.caps.some(n => !Number.isInteger(n) || n < 25 || n > 99)) throw new Error(`caps-2khq.json : plafonds invalides pour ${cle}`);
  for (const b of tous) {
    if (`${b.h}|${b.w}|${b.wing}` !== cle) continue;
    b.v.forEach((n, i) => { if (n > c.caps[i]) throw new Error(`caps-2khq.json : « ${b.nom} » a ${ATTRS[i]} ${n} au-dessus du plafond relevé ${c.caps[i]} (${cle})`); });
  }
  capsCorps[cle] = [1, [...c.caps]];
}
console.log(`Plafonds connus : ${Object.keys(capsCorps).length} corps, dont ${Object.values(capsCorps).filter(c => c[0]).length} exacts (${capsHQ.corps.length} relevés dans 2K HQ)`);

/* ------------------------------------------------------ Écriture */
const SOURCE = {
  genere: AUJOURDHUI, builds: builds.length, blueprints: blueprints.length, k: K,
  sources: [
    { nom: 'LockerCodes', url: LC_NOMS, role: 'builds complets à 99 (exemples de noms de build)' },
    { nom: 'NBA2KLab', url: LAB_BLUEPRINTS, role: 'Signature Blueprints officiels 2K' },
    { nom: 'LockerCodes', url: LC_BUILDER, role: 'corps autorisés par poste et par taille (vérifiés dans le jeu)' },
    { nom: 'NBA2KLab', url: LAB_BUILDER, role: 'recoupement des corps autorisés' },
    { nom: 'App NBA 2K HQ', url: 'https://nba.2k.com/2k27/features/myplayer-builder/', role: `plafonds exacts de ${capsHQ.corps.length} corps, relevés dans le builder officiel (donnees/caps-2khq.json)` }
  ],
  ecartsCorps: ecartsCorps.length,
  avertissement: 'Points d’attributs estimés en comparant ton build à ces builds réels : le jeu ne publie pas son calcul exact.'
};
const ligne = b => JSON.stringify([b.s, b.pos, b.h, b.w, b.wing, b.nom, b.v, ...(b.caps ? [b.caps] : [])]);
const contenu = `/* NBA 2K27 Build Lab — Builds réels, corps autorisés et budget estimé
   FICHIER GÉNÉRÉ par outils/importer-builds.mjs le ${AUJOURDHUI} : ne pas modifier à la main.

   BUILDS_REELS : [source, poste, taille (po), poids (lbs), envergure (po), nom, 21 notes, plafonds?]
     source « lc » = exemple complet LockerCodes, « bp » = Signature Blueprint officiel (NBA2KLab)
     notes dans l'ordre de BUILDS_ATTRIBUTS
   CORPS_LEGAUX[poste][taille] = [poids min, poids max, envergure min, envergure max]
   BUDGET_MODELES[poste] = { n, budget, marge, w } ; w : 21 notes puis taille, poids/10, envergure
   CAPS_CORPS[« taille|poids|envergure »] = [1 exacts (Blueprint) ou 0 minimum observé, 21 plafonds] */
const BUILDS_SOURCE=${JSON.stringify(SOURCE)};
const BUILDS_ATTRIBUTS=${JSON.stringify(ATTRS)};
const CORPS_LEGAUX=${JSON.stringify(corps)};
const BUDGET_MODELES=${JSON.stringify(modeles)};
const CAPS_CORPS=${JSON.stringify(capsCorps)};
const BUILDS_REELS=[
${tous.map(ligne).join(',\n')}
];

/* Budget estimé d'un build : part du budget d'un build réel complet (1 = 100 %),
   avec la marge mesurée du groupe utilisé. null si le poste est inconnu. */
function budgetEstime(pos,h,w,wing,notes){
  const m=BUDGET_MODELES[pos]; if(!m)return null;
  // Part du budget DÉPENSABLE : 0 % tout à 25, 100 % pour un build complet à 99.
  // Les termes de corps sont la part fixe ; la marge est ramenée à la même échelle.
  const corps=m.w[21]*h+m.w[22]*w/10+m.w[23]*wing, dispo=m.budget-corps;
  if(!(dispo>0))return null;
  const notesCout=BUILDS_ATTRIBUTS.reduce((t,a,i)=>t+m.w[i]*(Math.exp(${K}*((notes[a]??25)-25))-1),0);
  return {part:notesCout/dispo,marge:m.marge*m.budget/dispo,groupe:pos,n:m.n};
}
/* Plafonds connus pour un corps : exacts (Blueprint officiel) ou minimum garanti
   (note la plus haute vue dans un build réel de ce corps). null si inconnu. */
function capsConnus(h,w,wing){
  const c=CAPS_CORPS[h+'|'+w+'|'+wing]; if(!c)return null;
  return {exacts:c[0]===1,caps:Object.fromEntries(BUILDS_ATTRIBUTS.map((a,i)=>[a,c[1][i]]))};
}
/* Corps autorisé par le jeu pour ce poste ? Renvoie les bornes, ou null. */
function corpsLegal(pos,h){const c=CORPS_LEGAUX[pos]&&CORPS_LEGAUX[pos][h];return c?{poidsMin:c[0],poidsMax:c[1],envMin:c[2],envMax:c[3]}:null}
/* Les builds réels les plus proches : même poste, taille à ±1 pouce, distance sur les notes. */
function buildsProches(pos,h,notes,combien){
  const cible=BUILDS_ATTRIBUTS.map(a=>notes[a]??25);
  return BUILDS_REELS.filter(b=>b[1]===pos&&Math.abs(b[2]-h)<=1)
    .map(b=>({b,d:Math.sqrt(b[6].reduce((t,v,i)=>t+(v-cible[i])**2,0)/21)+Math.abs(b[2]-h)*2}))
    .sort((x,y)=>x.d-y.d).slice(0,combien||6);
}
`;
fs.writeFileSync(path.join(RACINE, 'builds-reels.js'), contenu);
console.log(`builds-reels.js écrit : ${tous.length} builds, ${Object.keys(modeles).length} modèles de budget`);
