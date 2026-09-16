/* Simulation de builds : on joue le site comme un utilisateur, en masse.
 *
 *   node outils/simulation.mjs [nombre]     (défaut : 60 builds)
 *   node outils/simulation.mjs 200 --prod
 *
 * Les tests vérifient des cas choisis ; ici on tire des corps au hasard parmi
 * ceux que le jeu autorise, on construit le build attribut par attribut comme
 * le ferait un joueur, et on vérifie à chaque fois les mêmes invariants :
 *
 *   — aucune erreur signalée par la page ;
 *   — aucune valeur au-dessus de son plafond ;
 *   — les points d'attributs ne dépassent pas 100 % quand c'est le joueur qui monte ;
 *   — rien d'illisible à l'écran (undefined, NaN, [object Object]) ;
 *   — le lien de partage restaure exactement le même build ;
 *   — chaque animation conseillée est accessible avec ce build.
 *
 * Il mesure aussi la VARIÉTÉ des animations conseillées : combien de joueurs
 * différents sont proposés sur l'ensemble des builds. Un site qui conseille le
 * même joueur à tout le monde n'aide personne.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { navigateur, serveurLocal, RACINE, pause } from './navigateur.mjs';

process.chdir(RACINE);

const PROD = process.argv.includes('--prod');
const COMBIEN = +(process.argv.find(a => /^\d+$/.test(a)) || 60);
const URL_PROD = 'https://lelabodesbuilds.com';

/* ---------------------------------------------------------- corps à tester */
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('builds-reels.js', 'utf8') + ';this.CORPS=CORPS_LEGAUX;this.ATTRS=BUILDS_ATTRIBUTS;', ctx);

let graine = 20260917;
const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const entre = (a, b) => a + Math.floor(hasard() * (b - a + 1));
const piocher = t => t[entre(0, t.length - 1)];

// Profils de jeu : un vrai joueur ne monte pas ses 21 attributs au hasard.
const PROFILS = {
  Shooter: ['Three-Point', 'Mid-Range', 'Free Throw', 'Speed With Ball', 'Agility'],
  Slasher: ['Driving Dunk', 'Driving Layup', 'Close Shot', 'Vertical', 'Speed'],
  Playmaker: ['Ball Handle', 'Pass Accuracy', 'Speed With Ball', 'Three-Point', 'Agility'],
  Lockdown: ['Perimeter Defense', 'Steal', 'Agility', 'Speed', 'Three-Point'],
  Big: ['Interior Defense', 'Block', 'Defensive Rebound', 'Offensive Rebound', 'Strength'],
  'Équilibré': ['Close Shot', 'Three-Point', 'Ball Handle', 'Perimeter Defense', 'Speed']
};

function corpsAuHasard() {
  const pos = piocher(Object.keys(ctx.CORPS));
  const tailles = Object.keys(ctx.CORPS[pos]).map(Number);
  const h = piocher(tailles);
  const [pMin, pMax, eMin, eMax] = ctx.CORPS[pos][h];
  return { pos, h, w: entre(pMin, pMax), wing: entre(eMin, eMax), style: piocher(Object.keys(PROFILS)) };
}

/* Les bords du domaine : plus petit et plus grand corps de chaque poste, aux
   poids et envergures extrêmes. C'est là que les formules cassent, pas au milieu. */
function corpsExtremes() {
  const out = [];
  for (const pos of Object.keys(ctx.CORPS)) {
    const tailles = Object.keys(ctx.CORPS[pos]).map(Number).sort((a, b) => a - b);
    for (const h of [tailles[0], tailles[tailles.length - 1]]) {
      const [pMin, pMax, eMin, eMax] = ctx.CORPS[pos][h];
      for (const [w, wing] of [[pMin, eMin], [pMin, eMax], [pMax, eMin], [pMax, eMax]]) {
        for (const style of Object.keys(PROFILS)) out.push({ pos, h, w, wing, style });
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ rapport */
const anomalies = [];
const signaler = (build, quoi) => anomalies.push(`${build.pos} ${build.h}po ${build.w}lbs ${build.wing}po ${build.style} — ${quoi}`);

/* -------------------------------------------------------------- simulation */
const srv = PROD ? null : await serveurLocal();
const base = PROD ? URL_PROD : `http://127.0.0.1:${srv.address().port}`;
const nav = await navigateur();


const conseilsVus = new Map();     // animation conseillée → combien de fois
const joueursVus = new Map();      // joueur cité → combien de fois
let chrono = { total: 0, n: 0, pire: 0, pireBuild: '' };
const variete = { noms: 0, cats: 0, pire: 0, pireMoyenne: 0, n: 0, recordPire: 0, recordOu: '', recordNom: '' };

await nav.ouvrir(base + '/', 1500);

const EXTREMES = process.argv.includes('--extremes') ? corpsExtremes() : null;
const total = EXTREMES ? EXTREMES.length : COMBIEN;
console.log(`${EXTREMES ? 'Corps extrêmes : ' : 'Simulation de '}${total} builds sur ${base}
`);
for (let i = 0; i < total; i++) {
  const b = EXTREMES ? EXTREMES[i] : corpsAuHasard();
  const prioritaires = PROFILS[b.style];

  const r = await nav.evaluer(`
    const attendre = ms => new Promise(r => setTimeout(r, ms));
    const g = id => document.getElementById(id);
    const curseurs = () => [...document.querySelectorAll('#attributeGroups input')];
    const poser = (id, v) => { const e = g(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };

    // 1. Le corps, comme dans le builder.
    poser('position', ${JSON.stringify(b.pos)});
    poser('height', ${b.h});
    poser('weight', ${b.w});
    poser('wing', ${b.wing});
    poser('style', ${JSON.stringify(b.style)});
    await attendre(120);

    // 2. On repart à zéro, puis on monte les attributs du profil comme un joueur :
    //    les prioritaires d'abord, jusqu'à ce que les points soient épuisés.
    curseurs().forEach(x => { x.value = 25; x.dispatchEvent(new Event('input', { bubbles: true })); });
    await attendre(120);
    const debut = performance.now();
    const prio = ${JSON.stringify(prioritaires)};
    for (const nom of prio) {
      const x = curseurs().find(c => c.dataset.name === nom);
      if (x) { x.value = x.max; x.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    for (const x of curseurs()) { if (!prio.includes(x.dataset.name)) { x.value = Math.min(+x.max, 70); x.dispatchEvent(new Event('input', { bubbles: true })); } }
    const duree = performance.now() - debut;
    await attendre(180);

    // 3. Ce que la page affiche.
    const notes = ratings();
    const plafonds = Object.fromEntries(curseurs().map(x => [x.dataset.name, +x.max]));
    const budget = budgetEstime(g('position').value, +g('height').value, +g('weight').value, +g('wing').value, notes);
    const conseils = [...conseilsAnimations(notes, +g('height').value).entries()]
      .filter(([, c]) => c.conseil)
      .map(([cat, c]) => ({ cat, nom: c.conseil.name, req: c.conseil.req, ou: !!c.conseil.ou, minH: c.conseil.minH, maxH: c.conseil.maxH }));
    const texte = document.body.innerText;
    const suspects = (texte.match(/undefined|NaN|\\[object Object\\]|Infinity/g) || []);

    // 4. Le lien de partage doit rendre exactement le même build.
    const code = serializeBuild();
    const avant = JSON.stringify(notes) + '|' + g('position').value + g('height').value + g('weight').value + g('wing').value;
    applyBuild(JSON.parse(decodeURIComponent(escape(atob(code)))));
    await attendre(150);
    const apres = JSON.stringify(ratings()) + '|' + g('position').value + g('height').value + g('weight').value + g('wing').value;

    return {
      notes, plafonds, part: budget ? budget.part : null, conseils, duree,
      score: g('score').textContent, nom: g('buildname').textContent,
      suspects: [...new Set(suspects)], allerRetour: avant === apres,
      badges: g('badgeReachable') ? g('badgeReachable').textContent : null
    };`);

  // --- invariants
  // L'API communauté ne tourne que sur Cloudflare : son absence en local n'est pas un défaut.
  const vraiesErreurs = nav.erreurs.filter(e => PROD || !e.includes("/api/"));
  if (vraiesErreurs.length) signaler(b, `erreur page : ${vraiesErreurs[0].slice(0, 140)}`);
  nav.erreurs.length = 0;

  for (const [nom, v] of Object.entries(r.notes)) {
    if (v > r.plafonds[nom]) signaler(b, `${nom} ${v} dépasse son plafond ${r.plafonds[nom]}`);
    if (!Number.isInteger(v) || v < 25 || v > 99) signaler(b, `${nom} = ${v}`);
  }
  if (r.part !== null && r.part > 1.0001) signaler(b, `points d'attributs à ${Math.round(r.part * 100)} % alors que le joueur les a montés un par un`);
  if (r.suspects.length) signaler(b, `affiché à l'écran : ${r.suspects.join(', ')}`);
  if (!r.allerRetour) signaler(b, 'le lien de partage ne restaure pas le même build');
  if (!/^\d+$/.test(r.score || '')) signaler(b, `note affichée : « ${r.score} »`);
  if (!r.nom) signaler(b, 'nom de build vide');

  for (const c of r.conseils) {
    if (b.h < c.minH || b.h > c.maxH) signaler(b, `animation conseillée hors taille : ${c.nom} (${c.minH}-${c.maxH})`);
    // Le jeu accepte « Mi-distance OU 3 pts » sur les tirs : un seul suffit alors.
    const exigences = Object.entries(c.req || {});
    const satisfaite = ([attr, need]) => (r.notes[attr] ?? 0) >= need;
    const manque = c.ou && exigences.length > 1
      ? (exigences.some(satisfaite) ? null : exigences.map(([a, n]) => `${a} ${n}`).join(' ou '))
      : (exigences.every(satisfaite) ? null : exigences.filter(e => !satisfaite(e)).map(([a, n]) => `${a} ${n}`).join(', '));
    if (manque) signaler(b, `animation conseillée inaccessible : ${c.nom} demande ${manque}`);
    conseilsVus.set(c.nom, (conseilsVus.get(c.nom) || 0) + 1);
  }

  // Variété vue par UN joueur : sur ses catégories, combien de noms différents,
  // et combien de fois revient le nom le plus proposé ?
  if (r.conseils.length) {
    const parNom = new Map();
    r.conseils.forEach(c => parNom.set(c.nom, (parNom.get(c.nom) || 0) + 1));
    const pire = Math.max(...parNom.values());
    variete.noms += parNom.size;
    variete.cats += r.conseils.length;
    variete.pire = Math.max(variete.pire, pire);
    variete.pireMoyenne += pire;
    variete.n++;
    if (pire > variete.recordPire) { variete.recordPire = pire; variete.recordOu = `${b.pos} ${b.h}po ${b.style}`; variete.recordNom = [...parNom.entries()].sort((x, y) => y[1] - x[1])[0][0]; }
  }

  chrono.total += r.duree; chrono.n++;
  if (r.duree > chrono.pire) { chrono.pire = r.duree; chrono.pireBuild = `${b.pos} ${b.h}po`; }

  if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${total} builds simulés\r`);
}

nav.fermer();
if (srv) srv.close();

/* ------------------------------------------------------------------ sortie */
console.log(`\n${total} builds simulés.\n`);
console.log(`Recalcul du build (21 attributs montés) : ${Math.round(chrono.total / chrono.n)} ms en moyenne, ${Math.round(chrono.pire)} ms au pire (${chrono.pireBuild}).`);

console.log(`
Variété pour UN joueur : ${(variete.noms / variete.n).toFixed(1)} noms différents sur ${(variete.cats / variete.n).toFixed(1)} catégories en moyenne.`);
console.log(`Le nom le plus proposé revient ${(variete.pireMoyenne / variete.n).toFixed(1)} fois en moyenne, ${variete.recordPire} au pire (${variete.recordNom}, ${variete.recordOu}).`);

const tri = [...conseilsVus.entries()].sort((a, b) => b[1] - a[1]);
const totalConseils = tri.reduce((t, [, n]) => t + n, 0);
console.log(`\nAnimations conseillées : ${tri.length} différentes sur ${totalConseils} conseils.`);
console.log('Les plus répétées :');
tri.slice(0, 10).forEach(([nom, n]) => console.log(`  ${String(Math.round(n / totalConseils * 100)).padStart(3)} %  ${nom} (${n}×)`));

if (anomalies.length) {
  console.log(`\n${anomalies.length} anomalie(s) :`);
  const vues = new Set();
  for (const a of anomalies) {
    const cle = a.replace(/^[^—]+— /, '');
    if (vues.has(cle)) continue;
    vues.add(cle);
    console.log('  ' + a);
  }
  console.log(`\n(${vues.size} anomalies distinctes)`);
  process.exitCode = 1;
} else {
  console.log('\nAucune anomalie.');
}
