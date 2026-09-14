/* Régénère animations.js à partir des tables publiques NBA 2K27.
 *
 *   node outils/importer-animations.mjs
 *
 * - Source principale : NBA2KLab, dont la page embarque la table complète
 *   (données © NBA2KLab, reprises avec citation et lien sur le site).
 * - Recoupement : LockerCodes, qui annonce ses tables « vérifiées sur la
 *   version du jeu ». Chaque entrée garde le résultat dans « v » :
 *     2  mêmes tailles et mêmes exigences dans les deux sources
 *     1  NBA2KLab seul (LockerCodes n'a pas la ligne, ou la pagine)
 *     0  sources en désaccord : la valeur NBA2KLab est gardée, l'autre notée
 * - jeu : animation équipée sur un vrai MyPLAYER (captures du 14 septembre
 *   2026). Le script échoue si la table la rend inaccessible à ce build.
 *
 * Le script s'arrête sur toute donnée incohérente plutôt que de l'écrire.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const NBA2KLAB = 'https://www.nba2klab.com/animation-requirements';
const LOCKERCODES = 'https://www.lockercodes.io/nba-2k/animation-requirements/';
const AUJOURDHUI = new Date().toISOString().slice(0, 10);
const pause = ms => new Promise(r => setTimeout(r, ms));

// Pages LockerCodes. La valeur est la catégorie NBA2KLab quand LockerCodes
// écrit le nom seul ; null quand il écrit « <animation> <catégorie> ».
const PAGES_LC = {
  'all-dribble-moves/behind-the-back': null, 'all-dribble-moves/breakdown-combo': null,
  'all-dribble-moves/combo-moves': 'Combo Move', 'all-dribble-moves/crossover': null,
  'all-dribble-moves/dribble-style': 'Dribble Style', 'all-dribble-moves/escape-moves': null,
  'all-dribble-moves/hesitation': null, 'all-dribble-moves/in-and-out': 'In and Out',
  'all-dribble-moves/misdirection': null, 'all-dribble-moves/signature-size-up': 'Signature Size-Up',
  'all-dribble-moves/spin': 'Spin', 'all-dribble-moves/stepback': null, 'all-dribble-moves/triple-threat': null,
  'all-dunks/alley-oops': null, 'all-dunks/contact-dunks': null, 'all-dunks/dunk-packages': null,
  'all-dunks/signature-dunks': 'Signature Dunks - Players',
  'all-shot-animations/dribble-pull-ups': 'Dribble Pull-Up', 'all-shot-animations/go-to-shots': 'Go-To Shot',
  'all-shot-animations/hop-jumpers': 'Hop Jumper', 'all-shot-animations/spin-jumpers': 'Spin Jumper',
  'jumpshots': 'Jumper Base', 'layups': 'Layup Style', 'motion-styles': 'Motion Style',
  'pass-styles': 'Pass Style', 'post-moves': null
};

// Build réel (arrière 1,91 m) et animations qu'il a équipées dans le jeu.
const BUILD_JEU = { h: 75, r: { 'Driving Layup': 53, 'Mid-Range': 88, 'Three-Point': 94, 'Pass Accuracy': 75, 'Ball Handle': 86, 'Speed With Ball': 77 } };
const JEU = [
  ['Pass Style', 'Ja Morant'], ['Dribble Style', 'James Harden'], ['Crossover', 'Jordan Poole'],
  ['Between Legs Cross', 'Jayson Tatum'], ['Signature Size-Up', 'Zach LaVine'], ['Breakdown Combo', 'Jordan Poole'],
  ['Breakdown Moving Combo', 'Paul George'], ['Crossover Escape', 'Jimmy Butler'], ['Hesitation Escape', 'James Harden'],
  ['Between Legs Escape', 'James Harden'], ['Behind the Back Escape', 'Coby White'], ['Dribble Pull-Up', 'Buddy Hield'],
  ['Spin Jumper', 'Kyrie Irving'], ['Hop Jumper', 'Trae Young'], ['Go-To Shot', 'Malaki Branham'], ['Layup Style', 'Default Small']
];

function pouces(t) {
  const m = String(t).match(/(\d+)'\s*(\d+)/);
  if (!m) throw new Error('taille illisible : ' + t);
  return +m[1] * 12 + +m[2];
}
function note(v) {
  if (v === '' || v == null || v === 'Any') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 99) throw new Error('exigence illisible : ' + v);
  return n;
}
function exigences(paires) {
  const req = {};
  for (const [k, v] of paires) { const n = note(v); if (n != null) req[k] = n; }
  return req;
}
// curl plutôt que fetch() : LockerCodes refuse (403) le client HTTP de Node,
// mais sert normalement curl, livré avec Windows 10+ et macOS.
function telecharger(url) {
  const r = spawnSync('curl', ['-sSL', '--fail', '-A', UA, '-H', 'Accept-Language: en-US', url],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.error) throw new Error(`curl introuvable : ${r.error.message}`);
  if (r.status !== 0) throw new Error(`${url} : ${r.stderr.trim() || 'échec curl ' + r.status}`);
  return r.stdout;
}
const decode = s => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const valeurs = arr => [...new Set(arr)].sort((x, y) => x - y).join(',');
const taille = t => `${Math.floor(t / 12)}'${t % 12}"`;

// Même règle que animationManques() dans animations.js.
function accessible(a, r, h) {
  if (h < a.minH || h > a.maxH) return false;
  const e = Object.entries(a.req);
  return a.ou ? e.some(([k, v]) => (r[k] ?? 0) >= v) : e.every(([k, v]) => (r[k] ?? 0) >= v);
}

/* ---------------------------------------------------------------- NBA2KLab */
const html = await telecharger(NBA2KLAB);
const brut = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (!brut) throw new Error('NBA2KLab : données introuvables, la page a changé.');
const d = JSON.parse(brut[1]).props.pageProps.initialData;
for (const cle of ['finishing', 'dribbling', 'shooting', 'motionStyles', 'jumpers']) {
  if (!Array.isArray(d[cle]) || !d[cle].length) throw new Error(`NBA2KLab : famille « ${cle} » absente.`);
}

const A = [];
function ajoute(category, name, minH, maxH, req, ou) {
  const group = /^Post /.test(category) ? 'Poste'
    : ['Finition', 'Dribble', 'Passe', 'Tir', 'Déplacement'].find(g => GROUPE[g](category));
  const a = { category, group, name: String(name).trim(), req, minH: pouces(minH), maxH: pouces(maxH) };
  if (ou) a.ou = true;
  if (a.minH > a.maxH) throw new Error(`${category} / ${name} : taille ${minH} > ${maxH}`);
  A.push(a);
}
const FAMILLE = new Map();
const GROUPE = {
  Finition: c => FAMILLE.get(c) === 'finishing', Dribble: c => FAMILLE.get(c) === 'dribbling' && c !== 'Pass Style',
  Passe: c => c === 'Pass Style', Tir: c => FAMILLE.get(c) === 'shooting' || c === 'Jumper Base', Déplacement: c => c === 'Motion Style'
};
d.finishing.forEach(x => FAMILLE.set(x.Dunks_and_Layups, 'finishing'));
d.dribbling.forEach(x => FAMILLE.set(x.dribble_move, 'dribbling'));
d.shooting.forEach(x => FAMILLE.set(x.type, 'shooting'));

for (const x of d.finishing) ajoute(x.Dunks_and_Layups, x.Animation_Name, x.Minimum_Height, x.Maximum_Height,
  exigences([['Driving Layup', x.Driving_Layup], ['Standing Dunk', x.Standing_Dunk], ['Driving Dunk', x.Driving_Dunk], ['Post Control', x.Post_Control], ['Vertical', x.Vertical]]));
for (const x of d.dribbling) ajoute(x.dribble_move, x.animation_name, x.minimum_height, x.maximum_height,
  exigences([['Ball Handle', x.ball_handle], ['Speed With Ball', x.speed_with_ball], ['Pass Accuracy', x.pass_accuracy]]));
for (const x of d.shooting) {
  const req = exigences([['Mid-Range', x.mid], ['Three-Point', x.three]]);
  ajoute(x.type, x.animation_name, x.minimum_height, x.maximum_height, req, Object.keys(req).length > 1);
}
for (const x of d.motionStyles) ajoute('Motion Style', x.animation_name, x.minimum_height, x.maximum_height,
  exigences([['Speed', x.speed], ['Agility', x.agility]]));
for (const x of d.jumpers) {
  const n = note(x.rating);
  ajoute('Jumper Base', x.animation_name, x.minimum_height, x.maximum_height, n == null ? {} : { 'Mid-Range': n, 'Three-Point': n }, n != null);
}

// Doublons : identiques, on n'en garde qu'un ; différents, on s'arrête.
const parId = new Map();
for (const a of [...A]) {
  const id = a.category + ' / ' + a.name;
  if (!parId.has(id)) { parId.set(id, a); continue; }
  if (JSON.stringify(parId.get(id)) !== JSON.stringify(a)) throw new Error(`Deux entrées différentes pour ${id}`);
  A.splice(A.indexOf(a), 1);
}
console.log(`NBA2KLab : ${A.length} animations`);

/* ------------------------------------------------------------- LockerCodes */
const parCle = new Map();
const range = (k, a) => { if (!parCle.has(k)) parCle.set(k, []); parCle.get(k).push(a); };
for (const a of A) {
  a.v = 1;
  range(norm(a.name + ' ' + a.category), a);
  range(norm(a.name + ' ' + a.category.replace(/^.* - /, '')), a);
}
let lignesLC = 0, identiques = 0, desaccords = 0;
const sansCorrespondance = [], datesLC = new Set();
for (const [page, cat] of Object.entries(PAGES_LC)) {
  const h = await telecharger(LOCKERCODES + page);
  await pause(1000);
  const date = decode(h).match(/Verified against the NBA 2K27 game build on ([A-Za-z]+) (\d+), (\d{4})/);
  if (date) {
    const MOIS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const i = MOIS.indexOf(date[1]);
    if (i < 0) throw new Error('LockerCodes : mois illisible « ' + date[1] + ' »');
    datesLC.add(`${date[2]} ${FR[i]} ${date[3]}`);
  }
  for (const t of h.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const rows = [...t[0].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(c => decode(c[1])));
    const entete = rows[0] || [];
    for (const r of rows.slice(1)) {
      if (r.length < 3) continue;
      lignesLC++;
      const tailles = r.filter(c => /\d'\s*\d+/.test(c)).map(pouces);
      const exig = r.map((c, i) => [entete[i], c]).slice(1).filter(([, c]) => /^\d{1,2}$/.test(c) && +c > 0)
        .map(([e, c]) => [String(e || '').replace(/^\S+\s+/, ''), +c]);
      let cands = parCle.get(norm(r[0])) || [];
      if (!cands.length && cat) cands = A.filter(a => a.category === cat && norm(a.name) === norm(r[0]));
      // Dernier recours (alley-oops : le nom LockerCodes est déjà le nom complet) :
      // un seul homonyme exact de même taille, sinon on ne devine pas.
      if (!cands.length) {
        const homonymes = A.filter(a => norm(a.name) === norm(r[0]) && a.minH === tailles[0] && a.maxH === tailles[1]);
        if (homonymes.length === 1) cands = homonymes;
      }
      if (!cands.length) { sansCorrespondance.push(`${page} : ${r[0]}`); continue; }
      const memeTaille = cands.filter(a => a.minH === tailles[0] && a.maxH === tailles[1]);
      const ident = memeTaille.find(a => valeurs(Object.values(a.req)) === valeurs(exig.map(([, v]) => v)));
      if (ident) { if (ident.v !== 0) ident.v = 2; identiques++; continue; }
      const cible = memeTaille[0] || cands[0];
      cible.v = 0; desaccords++;
      cible.note = `LockerCodes indique ${exig.length ? exig.map(([e, v]) => `${e} ${v}`).join(', ') : 'aucun attribut'}` +
        ` (${tailles.map(taille).join(' – ')})`;
    }
  }
}
console.log(`LockerCodes : ${lignesLC} lignes, ${identiques} identiques, ${desaccords} en désaccord, ${sansCorrespondance.length} sans correspondance`);
if (sansCorrespondance.length) console.log('  ' + sansCorrespondance.join('\n  '));
if (!datesLC.size) throw new Error('LockerCodes : date de vérification introuvable, la page a changé.');

/* ------------------------------------------------------ Vérifiées en jeu */
for (const [category, name] of JEU) {
  const a = A.find(x => x.category === category && x.name === name);
  if (!a) throw new Error(`Animation équipée en jeu absente de la table : ${category} / ${name}`);
  if (!accessible(a, BUILD_JEU.r, BUILD_JEU.h)) throw new Error(`La table rend inaccessible une animation équipée en jeu : ${category} / ${name} ${JSON.stringify(a.req)}`);
  a.jeu = true;
}

/* ---------------------------------------------------------------- Écriture */
const compte = v => A.filter(a => a.v === v).length;
const SOURCE = {
  genere: AUJOURDHUI, total: A.length, recoupees: compte(2), nba2klabSeul: compte(1), desaccords: compte(0),
  sources: [
    { nom: 'NBA2KLab', url: NBA2KLAB, role: 'table complète NBA 2K27', date: AUJOURDHUI, mention: 'Données © NBA2KLab, reprises avec citation.' },
    { nom: 'LockerCodes', url: LOCKERCODES, role: 'recoupement ligne par ligne', date: [...datesLC].join(', '), mention: 'Tables annoncées vérifiées sur la version du jeu du ' + [...datesLC].join(', ') + '.' }
  ],
  regleTir: 'Tirs : le jeu demande Mi-distance OU 3 pts. Un Spin Jumper Kyrie Irving (90) a été équipé avec 88 à mi-distance et 94 à 3 pts.',
  jeu: { date: '2026-09-14', build: 'arrière 1,91 m, GNR 96', animations: JEU.length }
};
const cles = ({ category, group, name, req, minH, maxH, ou, v, note: n, jeu }) =>
  JSON.stringify({ category, group, name, req, minH, maxH, ...(ou ? { ou } : {}), v, ...(n ? { note: n } : {}), ...(jeu ? { jeu } : {}) });

const contenu = `/* NBA 2K27 Build Lab — Exigences des animations
   FICHIER GÉNÉRÉ par outils/importer-animations.mjs le ${AUJOURDHUI} : ne pas modifier à la main.

   Source : NBA2KLab (${NBA2KLAB}), données © NBA2KLab reprises avec citation.
   Recoupement : LockerCodes, ${[...datesLC].join(', ')}.
   v = 2 identique dans les deux sources · 1 NBA2KLab seul · 0 sources en désaccord (voir note)
   jeu = animation équipée sur un vrai MyPLAYER compatible
   ou = exigence satisfaite par l'un OU l'autre attribut (tirs) */
const ANIMATIONS_SOURCE=${JSON.stringify(SOURCE)};
const ANIMATIONS=[
${A.map(cles).join(',\n')}
];

/* Libellés de l'écran « Animations en match » du jeu en français, relevés sur
   une capture du 14 septembre 2026. Les autres catégories gardent le nom anglais. */
const ANIMATION_CATEGORIES_FR={
  'Pass Style':'Style de passes','Dribble Style':'Style de dribbles','Crossover':'Crossover',
  'Between Legs Cross':'Crossover entre les jambes','Signature Size-Up':'Sizeup personnalisé',
  'Breakdown Combo':'Combo Breakdown','Breakdown Moving Combo':'Combo Breakdown en mouvement',
  'Crossover Escape':'Crossover (dégagement)','Hesitation Escape':'Hésitation (dégagement)',
  'Between Legs Escape':'Dégagement entre les jambes','Behind the Back Escape':'Dégagement dans le dos',
  'Dribble Pull-Up':'Dribble plus tir en suspension','Spin Jumper':'Tir après un dribble renversé',
  'Hop Jumper':'Hop Jumper','Go-To Shot':'Tir signature','Jumper Base':'Tir en suspension (base)'
};
function nomCategorieAnimation(c){return ANIMATION_CATEGORIES_FR[c]||c}

/* Ce qui manque au build pour une animation : liste de [attribut, points].
   Pour une exigence « ou », seul l'attribut le plus proche compte. */
function animationManques(a,r){
  const e=Object.entries(a.req||{});
  if(a.ou&&e.length>1){
    const ecart=Math.min(...e.map(([k,v])=>Math.max(0,v-(r[k]??0))));
    return ecart?[[e.map(([k])=>k).join(' ou '),ecart]]:[];
  }
  return e.filter(([k,v])=>(r[k]??0)<v).map(([k,v])=>[k,v-(r[k]??0)]);
}
function animationAccessible(a,r,h){return h>=a.minH&&h<=a.maxH&&animationManques(a,r).length===0}
`;
fs.writeFileSync(path.join(RACINE, 'animations.js'), contenu);
console.log(`animations.js écrit : ${A.length} animations (${compte(2)} recoupées, ${compte(1)} NBA2KLab seul, ${compte(0)} en désaccord, ${JEU.length} confirmées en jeu)`);
