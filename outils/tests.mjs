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
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const PROD = process.argv.includes('--prod');
const URL_PROD = 'https://nba2k27-build-lab.pages.dev';
const PAGES = [
  { chemin: '/',             fichier: 'index.html',             nav: 'Builder' },
  { chemin: '/trios/',       fichier: 'trios/index.html',       nav: 'Trios' },
  { chemin: '/hub/',         fichier: 'hub/index.html',         nav: 'Builds' },
  { chemin: '/reference/',   fichier: 'reference/index.html',   nav: 'Badges & animations' },
  { chemin: '/progression/', fichier: 'progression/index.html', nav: 'Progression' }
];

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

  return { ouvrir, evaluer, cliquerEtAttendre, erreurs, fermer };
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

    await test('/reference/ rend chaque badge, animation et takeover', async () => {
      await nav.ouvrir(base + '/reference/');
      const r = await nav.evaluer(`return {
        badges: [document.querySelectorAll('#badgeList .badge-card').length, badgeDefs.length],
        animations: [document.querySelectorAll('#animationList .anim-card').length, ANIMATIONS.length],
        takeovers: [document.querySelectorAll('#takeoverList .takeover').length, takeoverDefs.length] };`);
      for (const [nom, [rendus, table]] of Object.entries(r)) {
        verifier(table > 0 && rendus === table, `${nom} : ${rendus} rendus sur ${table}`);
      }
    });

    await test('chaque badge porte son nom français et son nom officiel du jeu', async () => {
      await nav.ouvrir(base + '/reference/');
      const r = await nav.evaluer(`
        const cartes = [...document.querySelectorAll('#badgeList .badge-card')];
        const sansTraduction = badgeDefs.filter(d => !BADGE_FR[d.name]).map(d => d.name);
        const malAffiches = cartes.filter(c => {
          const fr = c.querySelector('.badge-fr')?.textContent, en = c.querySelector('.badge-en')?.textContent;
          return !fr || !en || fr === en || BADGE_FR[en] !== fr;
        }).length;
        // Recherche par nom français, sans accent : « eclair » doit trouver « Éclair » (Flash).
        const s = document.getElementById('badgeSearch');
        s.value = 'eclair'; s.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 200));
        const trouves = [...document.querySelectorAll('#badgeList .badge-en')].map(e => e.textContent);
        s.value = ''; s.dispatchEvent(new Event('input', { bubbles: true }));
        return { cartes: cartes.length, sansTraduction, malAffiches, trouves };`);
      verifier(!r.sansTraduction.length, 'badges sans traduction : ' + r.sansTraduction.join(', '));
      verifier(r.malAffiches === 0, `${r.malAffiches} carte(s) sans nom français ou sans nom officiel`);
      verifier(r.trouves.includes('Flash'), `la recherche « eclair » ne trouve pas Flash (trouvé : ${r.trouves.join(', ') || 'rien'})`);
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
      const build = { position: 'SG', height: 75, weight: 185, wing: 78, style: 'Équilibré', hand: 'Droite',
        attrs: { 'Close Shot': 48, 'Driving Layup': 53, 'Driving Dunk': 94, 'Standing Dunk': 38, 'Post Control': 42,
                 'Mid-Range': 88, 'Three-Point': 94, 'Free Throw': 77, 'Pass Accuracy': 75, 'Ball Handle': 86,
                 'Speed With Ball': 77, 'Interior Defense': 44, 'Perimeter Defense': 91, 'Steal': 84, 'Block': 45,
                 'Offensive Rebound': 27, 'Defensive Rebound': 51, 'Speed': 87, 'Agility': 85, 'Strength': 52,
                 'Vertical': 80, 'Stamina': 94 } };
      const code = Buffer.from(JSON.stringify(build), 'utf8').toString('base64');
      await nav.ouvrir(`${base}/?build=${encodeURIComponent(code)}`);
      sansErreur('chargement d’un build du jeu');
      const r = await nav.evaluer(`
        document.body.classList.add('mode-expert');
        await new Promise(r => setTimeout(r, 200));
        const texte = document.body.innerText;
        return { budget: (texte.match(/.{0,40}budget.{0,40}/i) || [null])[0],
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

    await test('« Utiliser ce trio » ouvre le builder avec le bon gabarit', async () => {
      await nav.ouvrir(base + '/trios/');
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

  await test('l\u2019ancienne adresse /blueprints/ redirige vers /trios/', async () => {
    for (const ancien of ['/blueprints/', '/blueprints']) {
      const r = await fetch(URL_PROD + ancien, { redirect: 'manual' });
      const cible = r.headers.get('location') || '';
      verifier(r.status === 301 && /\/trios\/$/.test(cible), `${ancien} → HTTP ${r.status} ${cible || '(sans redirection)'}`);
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
