/* Tests de fumée — NBA 2K27 Build Lab
 *
 *   node outils/tests.mjs          fichiers locaux : contrôles statiques + navigateur
 *   node outils/tests.mjs --prod   production : fichiers en ligne = fichiers locaux,
 *                                  API en lecture seule + navigateur
 *
 * Aucune dépendance : un vrai Chrome (ou Edge) est piloté en mode invisible via
 * le protocole DevTools, avec le WebSocket natif de Node. Chaque lancement part
 * d'un profil vierge — pas de cache, pas de service worker, pas de localStorage —
 * pour voir le site comme un premier visiteur.
 *
 * Ces tests vérifient des invariants plutôt que des chiffres figés : « chaque
 * badge de la table est rendu » plutôt que « 53 badges ». Ils restent valables
 * quand le contenu évolue, et ne cassent que si le comportement casse.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const PROD = process.argv.includes('--prod');
const URL_PROD = 'https://nba2k27-build-lab.pages.dev';
const PAGES = [
  { chemin: '/',             fichier: 'index.html',             nav: 'Builder' },
  { chemin: '/hub/',         fichier: 'hub/index.html',         nav: 'Builds' },
  { chemin: '/reference/',   fichier: 'reference/index.html',   nav: 'Badges & animations' },
  { chemin: '/progression/', fichier: 'progression/index.html', nav: 'Progression' }
];

// Build réel recopié du jeu (arrière 1,91 m, GNR 96) : sert de témoin.
const BUILD_JEU = { position: 'SG', height: 75, weight: 185, wing: 78, style: 'Équilibré', hand: 'Droite',
  attrs: { 'Close Shot': 48, 'Driving Layup': 53, 'Driving Dunk': 94, 'Standing Dunk': 38, 'Post Control': 42,
           'Mid-Range': 88, 'Three-Point': 94, 'Free Throw': 77, 'Pass Accuracy': 75, 'Ball Handle': 86,
           'Speed With Ball': 77, 'Interior Defense': 44, 'Perimeter Defense': 91, 'Steal': 84, 'Block': 45,
           'Offensive Rebound': 27, 'Defensive Rebound': 51, 'Speed': 87, 'Agility': 85, 'Strength': 52,
           'Vertical': 80, 'Stamina': 94 } };
const ATTRIBUTS = Object.keys(BUILD_JEU.attrs);

const pause = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ rapport */
const resultats = [];
async function test(nom, fn) {
  const debut = Date.now();
  try {
    await fn();
    resultats.push({ nom, ok: true });
    console.log(`  \u2713 ${nom} \x1b[2m(${Date.now() - debut} ms)\x1b[0m`);
  } catch (e) {
    resultats.push({ nom, ok: false, erreur: e.message });
    console.log(`  \x1b[31m\u2717 ${nom}\x1b[0m\n      ${e.message.split('\n').join('\n      ')}`);
  }
}
function verifier(condition, message) { if (!condition) throw new Error(message); }
function section(titre) { console.log(`\n\x1b[1m${titre}\x1b[0m`); }

/* -------------------------------------------------------- contrôles statiques */
function fichiersJs() {
  const racine = fs.readdirSync('.').filter(f => f.endsWith('.js'));
  const fonctions = [];
  (function parcourir(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) parcourir(p); else if (p.endsWith('.js')) fonctions.push(p);
    }
  })('functions');
  return { racine, fonctions };
}

async function testsStatiques() {
  section('Contrôles statiques');

  await test('tous les fichiers JavaScript se compilent', () => {
    const { racine, fonctions } = fichiersJs();
    const echecs = [];
    for (const f of racine) {
      const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
      if (r.status !== 0) echecs.push(`${f} : ${r.stderr.split('\n').find(l => l.trim()) || 'erreur'}`);
    }
    for (const f of fonctions) {
      const r = spawnSync(process.execPath, ['--input-type=module', '--check'],
                          { input: fs.readFileSync(f, 'utf8'), encoding: 'utf8' });
      if (r.status !== 0) echecs.push(`${f} : ${r.stderr.split('\n').find(l => l.trim()) || 'erreur'}`);
    }
    verifier(!echecs.length, echecs.join('\n'));
  });

  await test('les pages ne référencent aucun fichier absent', () => {
    const manquants = [];
    for (const p of PAGES) {
      const html = fs.readFileSync(p.fichier, 'utf8');
      for (const [, ref] of html.matchAll(/(?:src|href)="(\/[^"#?]+)"/g)) {
        const cible = ref.endsWith('/') ? ref.slice(1) + 'index.html' : ref.slice(1);
        if (ref !== '/' && !fs.existsSync(cible)) manquants.push(`${p.fichier} → ${ref}`);
      }
    }
    verifier(!manquants.length, manquants.join('\n'));
  });

  await test('aucun id en double ni ancre morte', () => {
    const problemes = [];
    for (const p of PAGES) {
      const html = fs.readFileSync(p.fichier, 'utf8');
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
      const doublons = ids.filter((id, i) => ids.indexOf(id) !== i);
      if (doublons.length) problemes.push(`${p.fichier} : id en double ${[...new Set(doublons)].join(', ')}`);
      for (const [, a] of html.matchAll(/href="#([^"]+)"/g)) {
        if (!ids.includes(a)) problemes.push(`${p.fichier} : ancre morte #${a}`);
      }
    }
    verifier(!problemes.length, problemes.join('\n'));
  });

  await test('le service worker met en cache chaque script et chaque page', () => {
    const sw = fs.readFileSync('sw.js', 'utf8');
    const absents = [];
    for (const p of PAGES) if (!sw.includes(`'${p.chemin}'`)) absents.push(`page ${p.chemin}`);
    const scripts = [...fs.readFileSync('index.html', 'utf8').matchAll(/src="\/([^"]+\.js)"/g)].map(m => m[1]);
    for (const s of scripts) if (!sw.includes(`'./${s}'`)) absents.push(s);
    for (const [, f] of sw.matchAll(/'\.\/([^']+)'/g)) if (!fs.existsSync(f)) absents.push(`${f} (listé mais absent du dossier)`);
    verifier(!absents.length, 'absents de la coquille : ' + absents.join(', '));
  });

  await test('la base d’animations est complète, sourcée et cohérente', () => {
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync('animations.js', 'utf8') + ';this.A=ANIMATIONS;this.S=ANIMATIONS_SOURCE;', ctx);
    const { A, S } = ctx, problemes = [], ids = new Set();
    if (A.length < 2500) problemes.push(`${A.length} animations seulement`);
    for (const a of A) {
      const id = `${a.category} / ${a.name}`;
      if (ids.has(id)) problemes.push(`${id} : en double`);
      ids.add(id);
      if (!(a.minH >= 69 && a.maxH <= 88 && a.minH <= a.maxH)) problemes.push(`${id} : tailles ${a.minH}-${a.maxH}`);
      for (const [k, v] of Object.entries(a.req)) if (!ATTRIBUTS.includes(k) || !(Number.isInteger(v) && v >= 1 && v <= 99)) problemes.push(`${id} : ${k} ${v}`);
      if (![0, 1, 2].includes(a.v)) problemes.push(`${id} : recoupement « ${a.v} »`);
      if (a.v === 0 && !a.note) problemes.push(`${id} : désaccord sans explication`);
      if (!a.group) problemes.push(`${id} : sans groupe`);
    }
    verifier(!problemes.length, problemes.slice(0, 12).join('\n'));
    verifier(S.total === A.length && S.recoupees + S.nba2klabSeul + S.desaccords === A.length, 'totaux de ANIMATIONS_SOURCE faux');
    verifier(S.sources.length >= 2 && S.sources.every(s => /^https:\/\//.test(s.url) && s.date), 'sources non documentées');
    verifier(S.recoupees / A.length > 0.5, `seulement ${S.recoupees} animations recoupées sur ${A.length}`);
    verifier(A.filter(a => a.jeu).length === S.jeu.animations, 'animations confirmées en jeu manquantes');
  });

  await test('les builds réels sont complets, sourcés et dans des corps autorisés', () => {
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync('builds-reels.js', 'utf8') +
      ';this.B=BUILDS_REELS;this.S=BUILDS_SOURCE;this.M=BUDGET_MODELES;this.A=BUILDS_ATTRIBUTS;this.corpsLegal=corpsLegal;this.budgetEstime=budgetEstime;', ctx);
    const { B, S, M, A } = ctx, problemes = [];
    verifier(A.length === 21 && A.every(a => ATTRIBUTS.includes(a)), 'ordre des attributs inconnu');
    if (B.length < 3000) problemes.push(`${B.length} builds seulement`);
    if (B.filter(b => b[0] === 'bp').length !== 40) problemes.push('les 40 Signature Blueprints manquent');
    for (const b of B) {
      const [src, pos, h, w, wing, nom, v] = b, c = ctx.corpsLegal(pos, h);
      if (!['lc', 'bp'].includes(src) || !nom) problemes.push(`source ou nom manquant : ${JSON.stringify(b).slice(0, 80)}`);
      if (v.length !== 21 || v.some(n => !(Number.isInteger(n) && n >= 25 && n <= 99))) problemes.push(`${nom} : notes invalides`);
      if (src === 'lc' && (!c || w < c.poidsMin || w > c.poidsMax || wing < c.envMin || wing > c.envMax)) problemes.push(`${nom} : corps ${pos} ${h}/${w}/${wing} non autorisé`);
    }
    verifier(!problemes.length, problemes.slice(0, 10).join('\n'));
    // Un modèle par poste : 21 notes, puis taille, poids et envergure.
    verifier(['PG', 'SG', 'SF', 'PF', 'C'].every(p => M[p]), 'il manque un modèle de budget par poste');
    for (const [cle, m] of Object.entries(M)) verifier(m.marge > 0 && m.marge < 0.2 && m.w.length === 24, `modèle de budget ${cle} incohérent (marge ${m.marge}, ${m.w.length} coefficients)`);
    verifier(S.sources.every(s => /^https:\/\//.test(s.url)) && /estim/i.test(S.avertissement), 'sources ou avertissement manquants');
    // Les builds réels à 99 doivent retomber dans la marge de leur modèle, pour la plupart.
    const parts = B.map(b => { const e = ctx.budgetEstime(b[1], b[2], b[3], b[4], Object.fromEntries(A.map((a, i) => [a, b[6][i]]))); return Math.abs(e.part - 1) <= e.marge; });
    const dedans = parts.filter(Boolean).length / parts.length;
    verifier(dedans > 0.9, `seulement ${(dedans * 100).toFixed(1)} % des builds réels dans leur marge de budget`);
  });

  await test('les plafonds relevés dans 2K HQ sont cohérents et appliqués', () => {
    const hq = JSON.parse(fs.readFileSync('donnees/caps-2khq.json', 'utf8'));
    const ctx = {};
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync('builds-reels.js', 'utf8') + ';this.B=BUILDS_REELS;this.capsConnus=capsConnus;this.A=BUILDS_ATTRIBUTS;', ctx);
    verifier(hq.ordre.join() === ctx.A.join(), 'ordre des attributs différent de builds-reels.js');
    const problemes = [];
    for (const c of hq.corps) {
      const cle = `${c.h}|${c.w}|${c.wing}`, connus = ctx.capsConnus(c.h, c.w, c.wing);
      if (!connus || !connus.exacts || ctx.A.some((a, i) => connus.caps[a] !== c.caps[i])) problemes.push(`${cle} : plafonds 2K HQ non repris dans builds-reels.js`);
      for (const b of ctx.B.filter(b => b[2] === c.h && b[3] === c.w && b[4] === c.wing))
        b[6].forEach((n, i) => { if (n > c.caps[i]) problemes.push(`${b[5]} (${cle}) : ${ctx.A[i]} ${n} > ${c.caps[i]}`); });
    }
    verifier(hq.corps.length >= 25, `${hq.corps.length} corps seulement dans caps-2khq.json`);
    verifier(!problemes.length, problemes.slice(0, 10).join('\n'));
  });

  await test('la page 404 existe, n’est pas indexable et ses liens mènent quelque part', () => {
    verifier(fs.existsSync('404.html'), '404.html absent : Cloudflare servirait le builder en 200 sur toute adresse inconnue');
    const html = fs.readFileSync('404.html', 'utf8');
    verifier(/<meta name="robots" content="noindex">/.test(html), 'balise noindex absente');
    const morts = [...html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)].map(m => m[1]).filter(ref => {
      const cible = ref === '/' ? 'index.html' : ref.endsWith('/') ? ref.slice(1) + 'index.html' : ref.slice(1);
      return !fs.existsSync(cible);
    });
    verifier(!morts.length, 'liens morts : ' + morts.join(', '));
  });
}

/* ------------------------------------------------------------ serveur local */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

function serveurLocal() {
  return new Promise(ok => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';      // comme Cloudflare Pages
      const f = path.join(RACINE, rel);
      if (!f.startsWith(RACINE)) { res.writeHead(403).end(); return; }
      fs.readFile(f, (err, buf) => {
        if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
        res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }).end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

/* ------------------------------------------------------ navigateur (DevTools) */
function trouverNavigateur() {
  const candidats = [
    process.env.CHROME_PATH,
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].filter(Boolean);
  return candidats.find(p => fs.existsSync(p));
}

async function lancerNavigateur() {
  const exe = trouverNavigateur();
  verifier(exe, 'Ni Chrome ni Edge trouvé. Indique le chemin avec la variable CHROME_PATH.');
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'nbabl-tests-'));
  const port = 9300 + Math.floor(Math.random() * 600);
  const proc = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });

  let cible;
  for (let i = 0; i < 75 && !cible; i++) {
    try {
      const liste = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      cible = liste.find(t => t.type === 'page');
    } catch { /* pas encore prêt */ }
    if (!cible) await pause(200);
  }
  verifier(cible, 'Le navigateur ne répond pas sur le port de débogage.');

  const ws = new WebSocket(cible.webSocketDebuggerUrl);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error('connexion DevTools impossible')); });

  let id = 0;
  const attente = new Map();
  const ecouteurs = new Set();
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.id && attente.has(m.id)) {
      const { ok, ko } = attente.get(m.id); attente.delete(m.id);
      m.error ? ko(new Error(m.error.message)) : ok(m.result);
    } else ecouteurs.forEach(f => f(m));
  };
  const envoyer = (method, params = {}) => new Promise((ok, ko) => {
    const i = ++id; attente.set(i, { ok, ko }); ws.send(JSON.stringify({ id: i, method, params }));
  });

  // Erreurs vues par le navigateur : exceptions, console.error, échecs réseau.
  const erreurs = [];
  ecouteurs.add(m => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      erreurs.push({ texte: (d.exception && d.exception.description || d.text).split('\n')[0], url: d.url || '' });
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      erreurs.push({ texte: m.params.args.map(a => a.value ?? a.description ?? '').join(' '), url: '' });
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      erreurs.push({ texte: m.params.entry.text, url: m.params.entry.url || '' });
    } else if (m.method === 'Page.javascriptDialogOpening') {
      // Une alerte bloquerait la page : on la ferme comme le ferait un utilisateur.
      envoyer('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    }
  });

  await envoyer('Page.enable');
  await envoyer('Runtime.enable');
  await envoyer('Log.enable');

  const evaluer = async code => {
    const r = await envoyer('Runtime.evaluate', {
      expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error((d.exception && d.exception.description || d.text).split('\n')[0]);
    }
    return r.result.value;
  };

  const attendreChargement = () => new Promise(ok => {
    const f = m => { if (m.method === 'Page.loadEventFired') { ecouteurs.delete(f); ok(); } };
    ecouteurs.add(f);
    setTimeout(() => { ecouteurs.delete(f); ok(); }, 20000);
  });

  const ouvrir = async url => {
    erreurs.length = 0;
    const charge = attendreChargement();
    await envoyer('Page.navigate', { url });
    await charge;
    await pause(900);   // scripts de fin de page, rendus différés, synchronisation serveur
  };

  // Déclenche une action qui provoque une navigation, puis attend la nouvelle page.
  const cliquerEtAttendre = async code => {
    erreurs.length = 0;
    const charge = attendreChargement();
    await envoyer('Runtime.evaluate', { expression: code });
    await charge;
    await pause(900);
  };

  const fermer = async () => {
    try {
      const v = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      const b = new WebSocket(v.webSocketDebuggerUrl);
      await new Promise(ok => { b.onopen = ok; setTimeout(ok, 1500); });
      b.send(JSON.stringify({ id: 1, method: 'Browser.close' }));
      await pause(700);
    } catch { /* déjà fermé */ }
    try { ws.close(); } catch {}
    try { proc.kill(); } catch {}
    await pause(500);
    try { fs.rmSync(profil, { recursive: true, force: true }); } catch { /* verrou Windows passager */ }
  };

  // Taille d'écran : téléphone (mobile = true) ou ordinateur ; sans argument, taille normale.
  const ecran = (largeur, hauteur, mobile) => largeur
    ? envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: 1, mobile: !!mobile })
    : envoyer('Emulation.clearDeviceMetricsOverride');

  return { ouvrir, evaluer, cliquerEtAttendre, erreurs, fermer, ecran };
}

/* ---------------------------------------------------------- tests navigateur */
async function testsNavigateur(base) {
  section(`Navigateur — ${base}`);
  const nav = await lancerNavigateur();

  // En local, les Functions Cloudflare (/api, /b) n'existent pas : leurs 404 sont
  // attendues. En production, aucune erreur n'est tolérée.
  const erreursReelles = () => nav.erreurs.filter(e =>
    !(!PROD && (/\/api\//.test(e.url) || /\/api\//.test(e.texte)))
  );
  const sansErreur = contexte => {
    const e = erreursReelles();
    verifier(!e.length, `${contexte} : ${e.length} erreur(s)\n` + e.map(x => `- ${x.texte}${x.url ? '  [' + x.url + ']' : ''}`).join('\n'));
  };

  try {
    for (const p of PAGES) {
      await test(`${p.chemin} se charge sans erreur`, async () => {
        await nav.ouvrir(base + p.chemin);
        sansErreur(p.chemin);
        const etat = await nav.evaluer(`return {
          titre: document.title,
          actif: document.querySelector('.reference-nav a.active')?.textContent,
          selecteur: !!document.getElementById('modeSimple')
        }`);
        verifier(etat.titre, 'la page n\u2019a pas de titre');
        verifier(etat.actif === p.nav, `lien actif « ${etat.actif} » au lieu de « ${p.nav} »`);
        verifier(etat.selecteur, 'sélecteur Simple / Expert absent');
      });
    }

    await test('le builder construit ses curseurs et recalcule', async () => {
      await nav.ouvrir(base + '/');
      const r = await nav.evaluer(`
        const attendus = Object.values(data).flat().length;
        const curseurs = document.querySelectorAll('#attributeGroups input[type=range]');
        const tirVal = () => document.getElementById('shootVal').textContent;
        const tirAvant = tirVal();
        const tir = [...curseurs].find(x => x.dataset.name === 'Three-Point');
        tir.value = +tir.value > 60 ? 40 : 90;
        tir.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 300));
        return { attendus, curseurs: curseurs.length, tirAvant, tirApres: tirVal(),
                 validateur: document.getElementById('validationStatus')?.textContent };`);
      verifier(r.curseurs === r.attendus, `${r.curseurs} curseurs pour ${r.attendus} attributs`);
      verifier(r.tirApres !== r.tirAvant, 'la moyenne du tir ne réagit pas au curseur');
      verifier(r.validateur, 'validateur absent');
      sansErreur('après modification d\u2019un curseur');
    });

    await test('mode Simple par défaut, Expert révèle tout, le choix suit d\u2019une page à l\u2019autre', async () => {
      await nav.ouvrir(base + '/');
      const simple = await nav.evaluer(`
        const avances = [...document.querySelectorAll('[data-mode="expert"]')];
        return { stocke: localStorage.getItem('nba2k27_mode_v1'),
                 expertVisibles: avances.filter(e => e.offsetParent !== null).length,
                 avances: avances.length,
                 builderVisible: document.getElementById('builder').offsetParent !== null };`);
      verifier(simple.stocke === null, 'un mode est déjà mémorisé sur un profil vierge');
      verifier(simple.avances > 0, 'aucun élément marqué data-mode="expert"');
      verifier(simple.expertVisibles === 0, `${simple.expertVisibles} élément(s) avancé(s) visible(s) en mode Simple`);
      verifier(simple.builderVisible, 'le builder est masqué en mode Simple');

      const expert = await nav.evaluer(`
        document.getElementById('modeExpert').click();
        await new Promise(r => setTimeout(r, 200));
        const avances = [...document.querySelectorAll('[data-mode="expert"]')];
        return { masques: avances.filter(e => e.offsetParent === null).length };`);
      verifier(expert.masques === 0, `${expert.masques} élément(s) avancé(s) encore masqué(s) en mode Expert`);

      await nav.ouvrir(base + '/hub/');
      const hub = await nav.evaluer(`return document.body.classList.contains('mode-expert');`);
      verifier(hub, 'le mode Expert n\u2019a pas suivi sur /hub/');
      await nav.evaluer(`document.getElementById('modeSimple').click();`);
    });

    await test('/reference/ rend chaque badge et takeover, et donne accès à chaque animation', async () => {
      await nav.ouvrir(base + '/reference/');
      const r = await nav.evaluer(`
        const attendre = () => new Promise(r => setTimeout(r, 150));
        const cartes = () => document.querySelectorAll('#animationList .anim-card').length;
        const sel = document.getElementById('animCategory');
        const avant = cartes();
        document.getElementById('animPlus').click(); await attendre();
        const apres = cartes();
        const options = [...sel.querySelectorAll('option')].map(o => o.value).filter(v => v !== 'all');
        const categories = [...new Set(ANIMATIONS.map(a => a.category))];
        // Chaque catégorie, parcourue jusqu'au bout avec « Afficher plus », montre toutes ses animations.
        const incompletes = [];
        for (const c of categories) {
          sel.value = c; sel.dispatchEvent(new Event('change', { bubbles: true }));
          let garde = 100;
          while (!document.getElementById('animPlus').hidden && garde--) document.getElementById('animPlus').click();
          const n = ANIMATIONS.filter(a => a.category === c).length;
          if (cartes() !== n) incompletes.push(c + ' : ' + cartes() + '/' + n);
        }
        return {
          badges: [document.querySelectorAll('#badgeList .badge-card').length, badgeDefs.length],
          takeovers: [document.querySelectorAll('#takeoverList .takeover').length, takeoverDefs.length],
          avant, apres, manquantes: categories.filter(c => !options.includes(c)), incompletes,
          source: document.getElementById('animSource').innerText };`);
      for (const nom of ['badges', 'takeovers']) {
        const [rendus, table] = r[nom];
        verifier(table > 0 && rendus === table, `${nom} : ${rendus} rendus sur ${table}`);
      }
      verifier(r.avant === 60 && r.apres === 120, `pagination des animations : ${r.avant} puis ${r.apres} cartes`);
      verifier(!r.manquantes.length, 'catégories absentes du filtre : ' + r.manquantes.join(', '));
      verifier(!r.incompletes.length, 'catégories incomplètes : ' + r.incompletes.join(', '));
      verifier(/NBA2KLab/.test(r.source) && /LockerCodes/.test(r.source), `sources non citées : « ${r.source} »`);
    });

    await test('les animations équipées dans le jeu sont accessibles avec ce build', async () => {
      const code = Buffer.from(JSON.stringify(BUILD_JEU), 'utf8').toString('base64');
      await nav.ouvrir(`${base}/?build=${encodeURIComponent(code)}`);
      const r = await nav.evaluer(`
        const R = ratings(), H = heightInches(), jeu = ANIMATIONS.filter(a => a.jeu);
        const kyrie = ANIMATIONS.find(a => a.category === 'Spin Jumper' && a.name === 'Kyrie Irving');
        return { n: jeu.length, H,
          bloquees: jeu.filter(a => !animationAccessible(a, R, H)).map(a => a.category + ' / ' + a.name + ' ' + JSON.stringify(animationManques(a, R))),
          kyrie: kyrie && animationAccessible(kyrie, R, H), kyrieReq: kyrie && kyrie.req };`);
      verifier(r.n > 0, 'aucune animation marquée comme confirmée en jeu');
      verifier(!r.bloquees.length, 'animations équipées en jeu déclarées bloquées :\n' + r.bloquees.join('\n'));
      // 88 à mi-distance, 94 à 3 pts : le jeu accepte ce Spin Jumper à 90.
      verifier(r.kyrie, `Spin Jumper Kyrie Irving ${JSON.stringify(r.kyrieReq)} refusé : la règle « mi-distance OU 3 pts » n’est pas appliquée`);
      sansErreur('builder avec la nouvelle base d’animations');
    });

    await test('chaque badge porte son nom officiel du jeu en français, sa description et son icône', async () => {
      const officiels = JSON.parse(fs.readFileSync('donnees/badges-fr-2khq.json', 'utf8')).badges;
      await nav.ouvrir(base + '/reference/');
      const r = await nav.evaluer(`
        const officiels = ${JSON.stringify(officiels.map(b => [b.en, b.fr, b.desc]))};
        const cartes = [...document.querySelectorAll('#badgeList .badge-card')];
        const sansTraduction = badgeDefs.filter(d => !BADGE_FR[d.name]).map(d => d.name);
        const differents = officiels.filter(([en, fr, desc]) => BADGE_FR[en] !== fr || BADGE_DESC_FR[en] !== desc).map(([en]) => en);
        const sansIcone = cartes.filter(c => !c.querySelector('.badge-photo svg.badge-icone')).length;
        const sansDesc = cartes.filter(c => !c.querySelector('.badge-desc')?.textContent.trim()).length;
        const pictos = new Set(cartes.map(c => c.querySelector('.badge-icone g')?.innerHTML));
        const malAffiches = cartes.filter(c => {
          const fr = c.querySelector('.badge-fr')?.textContent, en = c.querySelector('.badge-en')?.textContent;
          return !fr || !en || BADGE_FR[en] !== fr;
        }).length;
        // Recherche par nom français, sans accent : « baton » doit trouver « Bâton sauteur » (Pogo Stick).
        const s = document.getElementById('badgeSearch');
        s.value = 'baton'; s.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        const trouves = [...document.querySelectorAll('#badgeList .badge-en')].map(e => e.textContent);
        s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true }));
        return { cartes: cartes.length, sansTraduction, differents, sansIcone, sansDesc, pictos: pictos.size, malAffiches, trouves };`);
      verifier(!r.sansTraduction.length, 'badges sans nom français : ' + r.sansTraduction.join(', '));
      verifier(!r.differents.length, 'noms ou descriptions différents du relevé du jeu : ' + r.differents.join(', '));
      verifier(r.malAffiches === 0, `${r.malAffiches} carte(s) sans nom français ou sans nom anglais`);
      verifier(r.sansIcone === 0 && r.sansDesc === 0, `${r.sansIcone} carte(s) sans icône, ${r.sansDesc} sans description`);
      verifier(r.pictos === r.cartes, `${r.pictos} pictogrammes différents pour ${r.cartes} badges`);
      verifier(r.trouves.includes('Pogo Stick'), `la recherche « baton » ne trouve pas Bâton sauteur (trouvé : ${r.trouves.join(', ') || 'rien'})`);
    });

    await test('un lien de partage restaure le build à l\u2019identique', async () => {
      const build = { position: 'PG', height: '76', weight: '180', wing: '82', style: 'Slasher', hand: 'Droite',
        attrs: { 'Close Shot': '88', 'Driving Layup': '93', 'Driving Dunk': '94', 'Mid-Range': '50',
                 'Three-Point': '91', 'Steal': '73', 'Agility': '84' } };
      const code = Buffer.from(JSON.stringify(build), 'utf8').toString('base64');
      await nav.ouvrir(`${base}/?build=${encodeURIComponent(code)}`);
      const lu = await nav.evaluer(`
        const v = n => [...document.querySelectorAll('#attributeGroups input')].find(x => x.dataset.name === n)?.value;
        return { taille: document.getElementById('height').value, style: document.getElementById('style').value,
                 attrs: Object.fromEntries(${JSON.stringify(Object.keys(build.attrs))}.map(n => [n, v(n)])) };`);
      const ecarts = Object.keys(build.attrs).filter(k => lu.attrs[k] !== build.attrs[k])
        .map(k => `${k} ${lu.attrs[k]} au lieu de ${build.attrs[k]}`);
      if (lu.taille !== build.height) ecarts.push(`taille ${lu.taille} au lieu de ${build.height}`);
      if (lu.style !== build.style) ecarts.push(`style ${lu.style} au lieu de ${build.style}`);
      verifier(!ecarts.length, ecarts.join('\n'));
    });

    // Build réel du jeu (GNR 96, arrière 1,91 m) : le site le déclarait
    // « budget dépassé de 20 » et le notait « 70 — B+ », comme une note du jeu.
    await test('un vrai build du jeu n’est ni jugé sur un budget inventé, ni noté comme dans le jeu', async () => {
      const code = Buffer.from(JSON.stringify(BUILD_JEU), 'utf8').toString('base64');
      await nav.ouvrir(`${base}/?build=${encodeURIComponent(code)}`);
      sansErreur('chargement d’un build du jeu');
      const r = await nav.evaluer(`
        document.body.classList.add('mode-expert');
        await new Promise(r => setTimeout(r, 200));
        const texte = document.body.innerText;
        // Le budget ESTIMÉ, avec sa marge, est légitime ; l'ancien budget inventé
        // (« Budget indicatif : x / 1000 », « dépassé de ») ne doit pas revenir.
        return { budget: (texte.match(/.{0,40}(budget indicatif|\\/ ?1 ?000|budget[^.]{0,30}dépassé).{0,40}/i) || [null])[0],
                 grade: !!document.getElementById('buildGrade'),
                 libelle: document.querySelector('.summary-ring small')?.textContent,
                 avertissement: !!document.querySelector('.summary-note'),
                 validation: document.getElementById('validationStatus')?.textContent,
                 aPortee: document.getElementById('badgeReachable')?.textContent };`);
      verifier(!r.budget, `un budget est encore affiché : « ${r.budget} »`);
      verifier(!r.grade, 'une lettre de note (B+, A…) est encore attribuée au build');
      verifier(r.libelle === 'Moyenne', `le chiffre du résumé s’intitule « ${r.libelle} » au lieu de « Moyenne »`);
      verifier(r.avertissement, 'rien ne précise que la moyenne n’est pas la note du jeu');
      verifier(r.validation === 'BUILD COHÉRENT', `validation : ${r.validation}`);
      verifier(+r.aPortee > 0, `badges à portée : ${r.aPortee}`);
    });

    await test('un build recopié du jeu garde ses plafonds et ses brise-plafonds', async () => {
      // [Max, actuel] lus sur l'écran « Améliorations d'attribut » d'un vrai MyPLAYER.
      const jeu = { 'Close Shot': [76, 48], 'Driving Layup': [77, 53], 'Driving Dunk': [89, 94], 'Standing Dunk': [38, 38],
        'Post Control': [42, 42], 'Mid-Range': [88, 88], 'Three-Point': [94, 94], 'Free Throw': [77, 77],
        'Pass Accuracy': [75, 75], 'Ball Handle': [86, 86], 'Speed With Ball': [77, 77], 'Interior Defense': [44, 44],
        'Perimeter Defense': [91, 91], 'Steal': [84, 84], 'Block': [45, 45], 'Offensive Rebound': [27, 27],
        'Defensive Rebound': [51, 51], 'Speed': [87, 87], 'Agility': [85, 85], 'Strength': [52, 52], 'Vertical': [80, 80] };
      await nav.ouvrir(base + '/');
      const r = await nav.evaluer(`
        const jeu = ${JSON.stringify(jeu)};
        const el = id => document.getElementById(id);
        const cle = n => n.replace(/[^a-z0-9]/gi, '');
        const attendre = ms => new Promise(r => setTimeout(r, ms));
        const curseur = n => [...document.querySelectorAll('#attributeGroups input')].find(x => x.dataset.name === n);
        const lu = n => ({ v: +curseur(n).value, max: +curseur(n).max, cap: el('cap' + cle(n)).textContent });
        const remplir = modif => {
          el('importJeuOuvrir').click();
          const f = el('importJeuForm');
          const champs = { position: 'SG', taille: 191, poids: 84, envergure: 198, gnr: 96 };
          for (const [k, [m, a]] of Object.entries(jeu)) { champs['max-' + cle(k)] = m; champs['act-' + cle(k)] = a; }
          Object.assign(champs, modif);
          for (const [n, v] of Object.entries(champs)) f.elements[n].value = v;
          f.requestSubmit();
        };
        const ouverte = () => el('buildModal').classList.contains('open');

        // 1. Saisie impossible : 95 pour un Max de 89, soit 6 brise-plafonds.
        remplir({ 'act-DrivingDunk': 95 });
        await attendre(150);
        const refus = { ouverte: ouverte(), message: el('importJeuErreurs')?.innerText || '',
                        stocke: localStorage.getItem('nba2k27_import_jeu_v1') };
        document.querySelector('#buildModal [data-close-modal]').click();

        // 2. Saisie correcte.
        remplir({});
        await attendre(300);
        const importe = { ouverte: ouverte(), taille: +el('height').value, poids: +el('weight').value,
          envergure: +el('wing').value, poste: el('position').value,
          pres: lu('Close Shot'), dunk: lu('Driving Dunk'), rebond: lu('Offensive Rebound'),
          etat: el('importJeuEtat').innerText, note: document.querySelector('.summary-note').textContent,
          validation: el('validationStatus').textContent };

        // 3. Le gabarit change : les plafonds du jeu ne valent plus.
        el('height').value = 80; el('height').dispatchEvent(new Event('input', { bubbles: true }));
        await attendre(200);
        const modifie = { pres: lu('Close Shot'), etat: el('importJeuEtat').innerText };

        // 4. Retour au build importé.
        document.querySelector('[data-ij="revenir"]').click();
        await attendre(200);
        return { refus, importe, modifie, revenu: { taille: +el('height').value, pres: lu('Close Shot'), dunk: lu('Driving Dunk') } };`);
      sansErreur('import d’un build du jeu');
      const { refus, importe, modifie, revenu } = r;
      verifier(refus.ouverte && refus.message.includes('Dunk en pénétration') && refus.stocke === null,
        `6 brise-plafonds acceptés : ${JSON.stringify(refus)}`);
      verifier(!importe.ouverte, 'la fenêtre d’import reste ouverte après une saisie correcte');
      verifier(importe.taille === 75 && importe.poids === 185 && importe.envergure === 78 && importe.poste === 'SG',
        `gabarit mal converti : ${importe.poste} ${importe.taille} po, ${importe.poids} lbs, envergure ${importe.envergure} po`);
      verifier(importe.pres.v === 48 && importe.pres.max === 76, `Tirs de près : ${JSON.stringify(importe.pres)} au lieu de 48 / max 76`);
      verifier(importe.dunk.v === 94 && importe.dunk.max === 94 && importe.dunk.cap.includes('+5'),
        `Dunk en pénétration : ${JSON.stringify(importe.dunk)} au lieu de 94, max 89 +5 BP`);
      verifier(importe.rebond.v === 27 && importe.rebond.max === 27, `Rebond offensif : ${JSON.stringify(importe.rebond)} (le plancher de 40 du site ne doit pas s’appliquer)`);
      verifier(importe.etat.includes('GNR 96') && importe.note.includes('96'), `GNR absent : « ${importe.etat} » / « ${importe.note} »`);
      verifier(importe.validation === 'BUILD COHÉRENT', `validation : ${importe.validation}`);
      verifier(modifie.pres.max !== 76 && modifie.etat.includes('Gabarit modifié'),
        `plafonds du jeu encore appliqués après changement de taille : ${JSON.stringify(modifie)}`);
      verifier(revenu.taille === 75 && revenu.pres.max === 76 && revenu.dunk.v === 94, `retour au build importé raté : ${JSON.stringify(revenu)}`);
    });

    await test('le builder estime le budget, respecte les corps du jeu et charge un build réel', async () => {
      const code = Buffer.from(JSON.stringify(BUILD_JEU), 'utf8').toString('base64');
      await nav.ouvrir(`${base}/?build=${encodeURIComponent(code)}`);
      const r = await nav.evaluer(`
        const el = id => document.getElementById(id), attendre = ms => new Promise(r => setTimeout(r, ms));
        const curseur = n => [...document.querySelectorAll('#attributeGroups input')].find(x => x.dataset.name === n);
        const budget = { visible: !el('budgetEstime').hidden, valeur: el('budgetEstimeValeur').textContent, marge: el('budgetEstimeMarge').textContent, texte: el('budgetEstimeTexte').textContent };
        const cartes = document.querySelectorAll('#buildsProches .build-reel').length;
        // Monter tous les attributs à fond doit sortir de la zone d'un build à 99.
        // Sans import du jeu : le test précédent en laisse un pour ce même corps,
        // dont les vrais plafonds (build maximum réel) tombent, eux, dans la zone.
        const avant = parseInt(budget.valeur);
        localStorage.removeItem('nba2k27_import_jeu_v1'); update();
        document.querySelectorAll('#attributeGroups input').forEach(x => { x.value = x.max; x.dispatchEvent(new Event('input', { bubbles: true })); });
        await attendre(200);
        const plein = { valeur: parseInt(el('budgetEstimeValeur').textContent), dessus: el('budgetEstime').classList.contains('dessus'),
                        notes: ratings(), plafonds: Object.fromEntries([...document.querySelectorAll('#attributeGroups input')].map(x => [x.dataset.name, +x.max])),
                        corps: [el('position').value, +el('height').value, +el('weight').value, +el('wing').value] };
        // Charger le premier build réel proposé : ses notes ne doivent pas être rognées.
        const bouton = document.querySelector('[data-charger-build="0"]');
        const i = +bouton.dataset.chargerBuild;
        bouton.click(); await attendre(300);
        const b = buildsProches(el('position').value, +el('height').value, ratings(), 5);
        // Un meneur ne peut pas mesurer 7'1" : la taille est ramenée dans la plage du poste.
        el('position').value = 'PG'; el('height').value = 85;
        el('height').dispatchEvent(new Event('input', { bubbles: true })); await attendre(200);
        return { budget, cartes, avant, plein, charge: { taille: +el('height').value }, pgTaille: +el('height').value,
                 legalPG: corpsLegal('PG', 79), maxPG: Math.max(...Object.keys(CORPS_LEGAUX.PG).map(Number)) };`);
      sansErreur('budget estimé et builds réels');
      verifier(r.budget.visible && /\d+ %/.test(r.budget.valeur) && /± \d+ %/.test(r.budget.marge), `budget estimé absent : ${JSON.stringify(r.budget)}`);
      verifier(r.avant > 70 && r.avant < 130, `ton build réel à 96 estimé à ${r.avant} % du budget`);
      verifier(r.plein.dessus && r.plein.valeur > r.avant, `tout monter à fond n’est pas signalé au-delà du budget : ${JSON.stringify(r.plein)}`);
      verifier(r.cartes === 5, `${r.cartes} builds réels proches affichés`);
      verifier(r.pgTaille === r.maxPG, `un meneur à 7'1" n’est pas ramené à ${r.maxPG} po (taille : ${r.pgTaille})`);
    });

    await test('un build réel chargé garde exactement ses notes et son corps', async () => {
      await nav.ouvrir(base + '/');
      const r = await nav.evaluer(`
        const el = id => document.getElementById(id), attendre = ms => new Promise(r => setTimeout(r, ms));
        el('position').value = 'C'; el('position').dispatchEvent(new Event('input', { bubbles: true }));
        el('height').value = 84; el('height').dispatchEvent(new Event('input', { bubbles: true }));
        await attendre(200);
        const bouton = document.querySelector('[data-charger-build="0"]');
        const attendu = buildsProches(el('position').value, +el('height').value, ratings(), 5)[0].b;
        bouton.click(); await attendre(300);
        const curseurs = () => BUILDS_ATTRIBUTS.map(a => [...document.querySelectorAll('#attributeGroups input')].find(x => x.dataset.name === a));
        const lu = curseurs().map(x => +x.value);
        const validation = el('validationStatus').textContent;
        const corps = [el('position').value, +el('height').value, +el('weight').value, +el('wing').value];
        // Corps des Signature Blueprints : les plafonds publiés sont exacts, chaque curseur doit s'y arrêter.
        const plafondsFaux = [];
        for (const b of BUILDS_REELS.filter(b => b[0] === 'bp' && b[7])) {
          apply({ position: b[1], height: b[2], weight: b[3], wing: b[4], style: el('style').value, attrs: {} });
          curseurs().forEach((x, i) => { if (+x.max !== b[7][i]) plafondsFaux.push(b[5] + ' / ' + BUILDS_ATTRIBUTS[i] + ' : ' + x.max + ' au lieu de ' + b[7][i]); });
        }
        return { attendu, corps, lu, validation, plafondsFaux };`);
      const [, pos, h, w, wing, nom, v] = r.attendu;
      const ecarts = v.map((n, i) => n === r.lu[i] ? null : `${i} : ${r.lu[i]} au lieu de ${n}`).filter(Boolean);
      verifier(JSON.stringify(r.corps) === JSON.stringify([pos, h, w, wing]), `corps ${r.corps} au lieu de ${[pos, h, w, wing]} (${nom})`);
      verifier(!ecarts.length, `« ${nom} » rogné par les plafonds : ${ecarts.join(', ')}`);
      verifier(r.validation === 'BUILD COHÉRENT', `validation : ${r.validation}`);
      verifier(!r.plafondsFaux.length, 'plafonds officiels non appliqués :\n' + r.plafondsFaux.slice(0, 8).join('\n'));
      sansErreur('chargement d’un build réel');
    });

    await test('« Utiliser ce trio » ouvre le builder avec le bon gabarit', async () => {
      await nav.ouvrir(base + '/hub/?onglet=trios');
      const bp = await nav.evaluer(`
        const cartes = document.querySelectorAll('[data-apply]').length;
        const b = window.NBABL_BLUEPRINTS.list[0];
        return { cartes, total: window.NBABL_BLUEPRINTS.list.length, id: b.id, pos: b.pos, h: String(b.h) };`);
      verifier(bp.cartes === bp.total, `${bp.cartes} cartes pour ${bp.total} trios`);
      await nav.cliquerEtAttendre(`document.querySelector('[data-apply="${bp.id}"]').click()`);
      const arrivee = await nav.evaluer(`return { chemin: location.pathname,
        poste: document.getElementById('position')?.value, taille: document.getElementById('height')?.value };`);
      verifier(arrivee.chemin === '/', `arrivée sur ${arrivee.chemin} au lieu de /`);
      verifier(arrivee.poste === bp.pos && arrivee.taille === bp.h,
        `gabarit ${arrivee.poste} / ${arrivee.taille} au lieu de ${bp.pos} / ${bp.h}`);
      sansErreur('après la passerelle trio');
    });

    await test('le hub filtre la liste affichée', async () => {
      await nav.ouvrir(base + '/hub/');
      const r = await nav.evaluer(`
        const liste = () => document.querySelectorAll('#communityList .build-card').length;
        const avant = liste();
        const s = document.getElementById('communitySearch');
        s.value = 'zzz-aucun-build-ne-porte-ce-nom';
        s.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        const filtre = liste();
        s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        return { avant, filtre, apres: liste(), onglets: document.querySelectorAll('[data-tab]').length };`);
      verifier(r.avant > 0, 'la liste du hub est vide');
      verifier(r.filtre === 0, `la recherche laisse ${r.filtre} carte(s) affichée(s)`);
      verifier(r.apres === r.avant, 'vider la recherche ne restaure pas la liste');
      verifier(r.onglets > 0, 'onglets du hub absents');
    });
    await test('le builder dit si les plafonds sont exacts, estimés ou approximatifs', async () => {
      await nav.ouvrir(base + '/');
      await nav.evaluer(`localStorage.removeItem(IMPORT_JEU_KEY);`);
      await nav.ouvrir(base + '/');
      const r = await nav.evaluer(`
        const POSTES = ['PG','SG','SF','PF','C'];
        const poste = (h,w,e) => POSTES.find(p => { const c = corpsLegal(p,h); return c && w>=c.poidsMin && w<=c.poidsMax && e>=c.envMin && e<=c.envMax; });
        const regler = async (p,h,w,e) => {
          position.value=p; height.value=h; weight.value=w; wing.value=e;
          for (const el of [position,height,weight,wing]) el.dispatchEvent(new Event('input',{bubbles:true}));
          await new Promise(r => setTimeout(r, 400));
          const el = document.getElementById('hqPlafonds');
          return { corps: [p,h,w,e].join(' '), niveau: el.dataset.niveau, texte: el.textContent, corpsApplique: [position.value,+height.value,+weight.value,+wing.value].join(' ') };
        };
        const res = {};
        // Corps exact : un corps relevé, autorisé pour un poste ; ses plafonds doivent être repris tels quels.
        const exact = Object.entries(CAPS_CORPS).map(([k,c]) => [k.split('|').map(Number), c]).find(([[h,w,e],c]) => c[0]===1 && poste(h,w,e));
        const [[h1,w1,e1],c1] = exact;
        res.exact = await regler(poste(h1,w1,e1),h1,w1,e1);
        res.exact.caps = BUILDS_ATTRIBUTS.every((a,i) => document.getElementById('cap'+a.replace(/[^a-z0-9]/gi,'')).textContent === 'CAP '+c1[1][i]);
        // Corps déduit : à l'intérieur d'un modèle, jamais relevé.
        let deduit = null;
        for (const [h,m] of Object.entries(CAPS_MODELES)) { for (let w=m.w[0]; w<=m.w[1] && !deduit; w++) for (let e=m.e[0]; e<=m.e[1] && !deduit; e++) { const c = CAPS_CORPS[h+'|'+w+'|'+e]; if ((!c || c[0]!==1) && poste(+h,w,e)) deduit = [poste(+h,w,e),+h,w,e]; } if (deduit) break; }
        res.deduit = await regler(...deduit);
        const attendus = capsDeduits(deduit[1],deduit[2],deduit[3]);
        res.deduit.caps = BUILDS_ATTRIBUTS.every(a => +document.getElementById('cap'+a.replace(/[^a-z0-9]/gi,'')).textContent.slice(4) >= attendus[a]);
        // Corps approximatif : taille sans modèle, corps non relevé.
        let approx = null;
        for (const p of POSTES) for (const [h,b] of Object.entries(CORPS_LEGAUX[p])) { if (approx || CAPS_MODELES[h]) continue; const c = CAPS_CORPS[h+'|'+b[0]+'|'+b[2]]; if (!c || c[0]!==1) approx = [p,+h,b[0],b[2]]; }
        res.approx = await regler(...approx);
        return res;`);
      verifier(r.exact.niveau === 'exact' && /exacts du jeu/.test(r.exact.texte), `corps relevé ${r.exact.corps} (appliqué ${r.exact.corpsApplique}) affiché « ${r.exact.texte} »`);
      verifier(r.exact.caps, `plafonds exacts non repris pour ${r.exact.corps}`);
      verifier(r.deduit.niveau === 'deduit' && /estimés à partir de corps relevés — [0-9]/.test(r.deduit.texte), `corps déduit ${r.deduit.corps} (appliqué ${r.deduit.corpsApplique}) affiché « ${r.deduit.texte} »`);
      verifier(r.deduit.caps, `plafonds déduits non appliqués pour ${r.deduit.corps}`);
      verifier(r.approx.niveau === 'approx' && /approximatifs/.test(r.approx.texte), `corps sans relevé ${r.approx.corps} (appliqué ${r.approx.corpsApplique}) affiché « ${r.approx.texte} »`);
      sansErreur('indicateur de fiabilité des plafonds');
    });

    await test('les types d’animation filtrent la liste et chaque carte dit ce qui manque', async () => {
      await nav.ouvrir(base + '/reference/?onglet=animations');
      const r = await nav.evaluer(`
        const attendre = () => new Promise(r => setTimeout(r, 150));
        const R = ratings(), H = heightInches();
        const groupes = [...new Set(ANIMATIONS.map(a => a.group))];
        const boutons = [...document.querySelectorAll('#animGroupes [data-groupe]')].map(b => b.dataset.groupe);
        const erreurs = [];
        for (const g of groupes) {
          document.querySelector('#animGroupes [data-groupe="' + g.replace(/"/g, '\\"') + '"]').click(); await attendre();
          const n = ANIMATIONS.filter(a => a.group === g).length;
          const cartes = document.querySelectorAll('#animationList .anim-card').length;
          if (cartes !== Math.min(60, n)) erreurs.push(g + ' : ' + cartes + ' cartes pour ' + n);
        }
        document.querySelector('#animGroupes [data-groupe="all"]').click(); await attendre();
        const bloquee = ANIMATIONS.findIndex(a => H >= a.minH && H <= a.maxH && animationManques(a, R).length);
        const cartes = [...document.querySelectorAll('#animationList .anim-card')];
        const sansManque = cartes.filter(c => c.querySelector('.anim-badge.bloquee') && !/Il te manque/.test(c.textContent)).length;
        const onglet = document.querySelector('.hq-onglets [aria-selected="true"]')?.dataset.onglet;
        return { groupes: groupes.length, boutons: boutons.length, erreurs, sansManque, onglet };`);
      verifier(r.onglet === 'animations', `?onglet=animations ouvre l’onglet ${r.onglet}`);
      verifier(r.boutons === r.groupes + 1, `${r.boutons} pastilles pour ${r.groupes} types`);
      verifier(!r.erreurs.length, 'filtre par type incorrect : ' + r.erreurs.join(' | '));
      verifier(r.sansManque === 0, `${r.sansManque} animation(s) bloquée(s) sans « Il te manque »`);
      sansErreur('filtres des animations');
    });

    await test('chaque catégorie propose une animation conseillée, pour n\u2019importe quel corps', async () => {
      await nav.ouvrir(base + '/');
      const r = await nav.evaluer(`
        // 60 builds tirés au hasard (graine fixe) parmi les corps autorisés, notes de 25 à 99.
        let graine = 27; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
        const corps = []; for (const [p, t] of Object.entries(CORPS_LEGAUX)) for (const h of Object.keys(t)) corps.push(+h);
        const erreurs = []; let conseils = 0;
        for (let n = 0; n < 60; n++) {
          const h = corps[Math.floor(hasard() * corps.length)];
          const r = Object.fromEntries(BUILDS_ATTRIBUTS.map(a => [a, 25 + Math.floor(hasard() * 75)]));
          const c = conseilsAnimations(r, h);
          const parCat = new Map();
          for (const a of ANIMATIONS) { if (a.category === 'Jumper Base' || h < a.minH || h > a.maxH) continue; const l = parCat.get(a.category) || []; l.push(a); parCat.set(a.category, l); }
          for (const [cat, l] of parCat) {
            const acc = l.filter(a => !animationManques(a, r).length), x = c.get(cat) || {};
            if (acc.length && !x.conseil) erreurs.push(h + ' ' + cat + ' : aucune conseillée alors que ' + acc.length + ' accessibles');
            if (x.conseil) { conseils++;
              if (animationManques(x.conseil, r).length) erreurs.push(cat + ' : conseillée non accessible');
              if (acc.some(a => exigenceAnimation(a) > exigenceAnimation(x.conseil))) erreurs.push(cat + ' : une accessible plus exigeante existe'); }
            if (x.suivant && !animationManques(x.suivant, r).length) erreurs.push(cat + ' : « à débloquer » déjà accessible');
          }
        }
        return { erreurs: erreurs.slice(0, 8), conseils,
          builder: [...document.querySelectorAll('#styleAnimationRecommendations .style-animation-item')].length };`);
      verifier(!r.erreurs.length, 'conseils incorrects : ' + r.erreurs.join(' | '));
      verifier(r.conseils > 300, `seulement ${r.conseils} conseils sur 60 builds`);
      verifier(r.builder === 11, `${r.builder} lignes d’animations conseillées dans le builder au lieu de 11`);
      await nav.ouvrir(base + '/reference/?onglet=animations');
      const p = await nav.evaluer(`
        const s = document.getElementById('animStatus'); s.value = 'conseil'; s.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        const cartes = [...document.querySelectorAll('#animationList .anim-card')];
        return { cartes: cartes.length, sansRepere: cartes.filter(c => !c.querySelector('.anim-repere')).length,
          conseil: cartes.filter(c => c.querySelector('.anim-repere.conseil')).length };`);
      verifier(p.cartes > 0 && p.sansRepere === 0, `filtre « Conseillées » : ${p.cartes} cartes dont ${p.sansRepere} sans repère`);
      verifier(p.conseil > 0, 'aucune carte « Conseillée pour ton build »');
      sansErreur('repère des animations conseillées');
    });

    await test('l\u2019onglet Builds réels filtre et ouvre un build réel à l\u2019identique', async () => {
      await nav.ouvrir(base + '/hub/');
      const r = await nav.evaluer(`
        const cartes = () => [...document.querySelectorAll('#reelsListe .build-reel')];
        const avant = cartes().length;
        const actif = document.querySelector('.hq-onglets [aria-selected="true"]')?.dataset.onglet;
        const poste = document.getElementById('reelsPoste');
        poste.value = 'C'; poste.dispatchEvent(new Event('change', { bubbles: true }));
        const pivots = cartes().every(c => c.querySelector('small').textContent.startsWith('Pivot'));
        const bouton = document.querySelector('[data-ouvrir-reel]');
        return { avant, actif, pivots, compte: document.getElementById('reelsCompte').textContent,
                 i: +bouton.dataset.ouvrirReel, build: BUILDS_REELS[+bouton.dataset.ouvrirReel] };`);
      verifier(r.actif === 'reels', `onglet ouvert par défaut : ${r.actif}`);
      verifier(r.avant === 24, `${r.avant} cartes affichées au lieu de 24`);
      verifier(r.pivots, 'le filtre Pivot laisse passer d\u2019autres postes');
      await nav.cliquerEtAttendre(`document.querySelector('[data-ouvrir-reel="${r.i}"]').click()`);
      const [, pos, h, w, wing, nom, v] = r.build;
      const arrivee = await nav.evaluer(`return { chemin: location.pathname,
        corps: [position.value, +height.value, +weight.value, +wing.value],
        notes: BUILDS_ATTRIBUTS.map(a => +inputs.find(x => x.dataset.name === a).value) };`);
      verifier(arrivee.chemin === '/', `arrivée sur ${arrivee.chemin}`);
      verifier(JSON.stringify(arrivee.corps) === JSON.stringify([pos, h, w, wing]), `corps ${arrivee.corps} au lieu de ${[pos, h, w, wing]} (${nom})`);
      const ecarts = v.map((n, i) => n === arrivee.notes[i] ? null : `${i} : ${arrivee.notes[i]} au lieu de ${n}`).filter(Boolean);
      verifier(!ecarts.length, `« ${nom} » modifié à l\u2019ouverture : ${ecarts.join(', ')}`);
      sansErreur('ouverture d\u2019un build réel depuis /hub/');
    });

    await test('mise en page sans débordement ni zone masquée, sur téléphone et sur ordinateur', async () => {
      const problemes = [];
      for (const [largeur, hauteur, mobile, nomEcran] of [[375, 812, true, 'téléphone'], [1440, 900, false, 'ordinateur']]) {
        await nav.ecran(largeur, hauteur, mobile);
        for (const mode of ['simple', 'expert']) {
          for (const p of PAGES) {
            await nav.ouvrir(base + p.chemin);
            await nav.evaluer(`localStorage.setItem('nba2k27_mode_v1', '${mode}');`);
            await nav.ouvrir(base + p.chemin);
            const erreurs = erreursReelles();
            if (erreurs.length) problemes.push(`${nomEcran} ${mode} ${p.chemin} : ${erreurs[0].texte}`);
            const r = await nav.evaluer(`
              document.documentElement.style.scrollBehavior = 'auto';
              const W = innerWidth, trouve = [];
              const defile = e => { for (let x = e.parentElement; x; x = x.parentElement) {
                const o = getComputedStyle(x).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden') return true; } return false; };
              const fixe = e => { for (let x = e; x; x = x.parentElement) if (getComputedStyle(x).position === 'fixed') return true; return false; };
              const verifier = ou => {
                if (document.documentElement.scrollWidth > W + 1) trouve.push(ou + ' : la page défile horizontalement (' + document.documentElement.scrollWidth + ' px)');
                for (const e of document.querySelectorAll('main *, header *')) {
                  const b = e.getBoundingClientRect();
                  if (b.width && (b.right > W + 1 || b.left < -1) && !defile(e) && !fixe(e) && !e.closest('.exact-hidden-legacy,.hq-cache,.skip-link')) {
                    trouve.push(ou + ' : ' + (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]) + ' dépasse (' + Math.round(b.left) + '→' + Math.round(b.right) + ')');
                    break;
                  }
                }
                for (const e of document.querySelectorAll('.attr-name>span:first-child')) {
                  if (e.offsetParent && e.scrollWidth > e.clientWidth + 1) { trouve.push(ou + ' : nom coupé « ' + e.textContent + ' »'); break; }
                }
                // Menus et champs : un libellé ou un texte d'aide plus large que la case est coupé à l'écran.
                const toile = document.createElement('canvas').getContext('2d');
                for (const e of document.querySelectorAll('main select, main input[placeholder]')) {
                  // Les champs d'origine masqués à l'écran (remplacés par les roues du corps) ne comptent pas.
                  if (!e.offsetParent || e.type === 'checkbox' || e.type === 'range' || e.closest('.hq-cache') || e.clientWidth < 8) continue;
                  const st = getComputedStyle(e);
                  toile.font = st.fontWeight + ' ' + st.fontSize + ' ' + st.fontFamily;
                  const texte = e.tagName === 'SELECT' ? (e.selectedOptions[0]?.textContent || '') : e.placeholder;
                  const place = e.clientWidth - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight);
                  if (toile.measureText(texte).width > place + 1) { trouve.push(ou + ' : texte coupé « ' + texte + ' » (#' + (e.id || e.name || '?') + ')'); break; }
                }
              };
              const onglets = [...document.querySelectorAll('.hq-onglets [role="tab"]')];
              if (onglets.length) for (const o of onglets) { o.click(); await new Promise(r => setTimeout(r, 150)); verifier('onglet ' + o.textContent.trim()); }
              else verifier('page');
              if (onglets.length) onglets[0].click();
              // Le bas de page ne doit pas rester caché sous les barres fixées.
              scrollTo(0, document.documentElement.scrollHeight);
              await new Promise(r => setTimeout(r, 150));
              const pied = document.querySelector('footer');
              const barres = [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).position === 'fixed' && e.offsetHeight && e.getBoundingClientRect().bottom >= innerHeight - 2 && !e.closest('.modal,[hidden]'));
              const hautBarres = Math.min(innerHeight, ...barres.map(e => e.getBoundingClientRect().top));
              if (pied && pied.getBoundingClientRect().bottom > hautBarres + 2) trouve.push('bas de page masqué par une barre fixée (' + Math.round(pied.getBoundingClientRect().bottom) + ' > ' + Math.round(hautBarres) + ')');
              return trouve.slice(0, 3);`);
            r.forEach(t => problemes.push(`${nomEcran} ${mode} ${p.chemin} — ${t}`));
          }
        }
      }
      await nav.evaluer(`localStorage.removeItem('nba2k27_mode_v1');`);
      await nav.ecran();
      verifier(!problemes.length, problemes.length + ' problème(s) de mise en page :\n' + problemes.slice(0, 15).join('\n'));
    });
  } finally {
    await nav.fermer();
  }
}

/* --------------------------------------------------------- tests production */
async function testsProduction() {
  section('Production — le déploiement est-il bien en ligne ?');

  await test('une adresse inconnue renvoie un vrai 404, avec la page d’erreur du site', async () => {
    // Sans 404.html, Cloudflare Pages servait la page du builder avec un code 200 :
    // chaque faute de frappe devenait une « page » indexable par les moteurs.
    const attendu = fs.readFileSync('404.html');
    const empreinte = b => crypto.createHash('sha256').update(b).digest('hex');
    let r, corps;
    for (let essai = 1; essai <= 12; essai++) {
      r = await fetch(`${URL_PROD}/adresse-qui-n-existe-pas-${Date.now()}/`);
      corps = Buffer.from(await r.arrayBuffer());
      if (r.status === 404 && empreinte(corps) === empreinte(attendu)) break;
      if (essai < 12) await pause(5000);
    }
    verifier(r.status === 404, `HTTP ${r.status} au lieu de 404`);
    verifier(empreinte(corps) === empreinte(attendu), 'le 404 servi n’est pas la page 404.html de ce dossier');
  });

  await test('la production sert exactement les fichiers de ce dossier', async () => {
    const fichiers = [...fs.readdirSync('.').filter(f => f.endsWith('.js') || f.endsWith('.css')),
                      ...PAGES.map(p => p.fichier)];
    const empreinte = b => crypto.createHash('sha256').update(b).digest('hex');
    let differents = [];
    // Juste après un déploiement, la propagation peut prendre quelques secondes.
    for (let essai = 1; essai <= 12; essai++) {
      differents = [];
      await Promise.all(fichiers.map(async f => {
        const chemin = f.endsWith('index.html') ? '/' + f.replace(/index\.html$/, '') : '/' + f;
        const r = await fetch(`${URL_PROD}${chemin}?verif=${Date.now()}`, { cache: 'no-store' });
        const distant = Buffer.from(await r.arrayBuffer());
        if (!r.ok || empreinte(distant) !== empreinte(fs.readFileSync(f))) differents.push(`${chemin} (HTTP ${r.status})`);
      }));
      if (!differents.length) break;
      if (essai < 12) await pause(5000);
    }
    verifier(!differents.length,
      `${differents.length} fichier(s) différent(s) en ligne — le déploiement n\u2019a pas eu lieu depuis ce dossier, ou pas encore propagé :\n` +
      differents.slice(0, 10).join('\n'));
  });

  await test('l\u2019API répond, en lecture seule', async () => {
    const liste = await fetch(`${URL_PROD}/api/builds?limit=1`);
    verifier(liste.ok, `GET /api/builds → HTTP ${liste.status}`);
    const json = await liste.json();
    verifier(Array.isArray(json.builds), 'réponse sans tableau « builds » (la base D1 est-elle liée ?)');
    const patch = await fetch(`${URL_PROD}/api/builds/inexistant`, { method: 'PATCH', body: '{}' });
    verifier(patch.status === 401, `PATCH sans jeton → HTTP ${patch.status} au lieu de 401`);
    const sitemap = await (await fetch(`${URL_PROD}/sitemap.xml`)).text();
    const absentes = PAGES.filter(p => !sitemap.includes(`${p.chemin}</loc>`)).map(p => p.chemin);
    verifier(!absentes.length, 'pages absentes du sitemap : ' + absentes.join(', '));
  });

  await test('les anciennes adresses /blueprints/ et /trios/ mènent à l\u2019onglet Trios', async () => {
    for (const ancien of ['/blueprints/', '/blueprints', '/trios/', '/trios']) {
      const r = await fetch(URL_PROD + ancien, { redirect: 'manual' });
      const cible = r.headers.get('location') || '';
      verifier(r.status === 301 && /\/hub\/\?onglet=trios$/.test(cible), `${ancien} → HTTP ${r.status} ${cible || '(sans redirection)'}`);
    }
  });
}

/* --------------------------------------------------------------------- main */
const debut = Date.now();
console.log(`\x1b[1mNBA 2K27 Build Lab — tests ${PROD ? 'de production' : 'locaux'}\x1b[0m`);

let serveur;
try {
  if (PROD) {
    await testsProduction();
    await testsNavigateur(URL_PROD);
  } else {
    await testsStatiques();
    serveur = await serveurLocal();
    await testsNavigateur(`http://127.0.0.1:${serveur.address().port}`);
  }
} catch (e) {
  resultats.push({ nom: 'exécution des tests', ok: false, erreur: e.message });
  console.log(`\n  \x1b[31m\u2717 ${e.message}\x1b[0m`);
} finally {
  if (serveur) serveur.close();
}

const echecs = resultats.filter(r => !r.ok);
const duree = ((Date.now() - debut) / 1000).toFixed(1);
console.log(echecs.length
  ? `\n\x1b[31m\x1b[1m${echecs.length} échec(s) sur ${resultats.length} tests\x1b[0m (${duree} s)`
  : `\n\x1b[32m\x1b[1m${resultats.length} tests réussis\x1b[0m (${duree} s)`);
process.exit(echecs.length ? 1 : 0);
