/* Audit de la version anglaise : que reste-t-il de français à l'écran ?
 *
 *   node outils/i18n-audit.mjs            pages locales (serveur temporaire)
 *   node outils/i18n-audit.mjs --prod     https://lelabodesbuilds.com
 *
 * Les pages /en/ sont générées, mais une trentaine de scripts écrivent dans la
 * page après coup : i18n.js traduit ce qu'ils produisent. Compter les accents
 * dans une capture ne dit pas *où* ça coince. Cet outil ouvre chaque page dans
 * un vrai navigateur, déplie les onglets, et liste chaque texte encore français
 * avec l'élément qui le porte — de quoi corriger sans chercher.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const PROD = process.argv.includes('--prod');
const BASE_PROD = 'https://lelabodesbuilds.com';
const PAGES = ['/en/', '/en/hub/', '/en/reference/', '/en/mon-build/', '/en/mentions-legales/'];
const pause = ms => new Promise(r => setTimeout(r, ms));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };

// Les en-têtes que Cloudflare ajoute à tout le site (_headers, règle « /* »).
// Sans eux, l'audit local était plus permissif que la production : eval() passait
// ici et se faisait bloquer en ligne par la CSP, laissant la page sans traduction.
function entetesDuSite() {
  const lignes = fs.readFileSync('_headers', 'utf8').replace(/\r\n/g, '\n').split('\n');
  const out = {};
  let dedans = false;
  for (const l of lignes) {
    if (!l.trim() || l.trim().startsWith('#')) continue;
    if (!/^\s/.test(l)) { dedans = l.trim() === '/*'; continue; }
    if (!dedans) continue;
    const i = l.indexOf(':');
    if (i > 0) out[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  }
  return out;
}

function serveurLocal() {
  const communs = entetesDuSite();
  return new Promise(ok => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';
      const f = path.join(RACINE, rel);
      if (!f.startsWith(RACINE)) { res.writeHead(403).end(); return; }
      fs.readFile(f, (err, buf) => {
        if (err) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
        res.writeHead(200, { ...communs, 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }).end(buf);
      });
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

function trouverNavigateur() {
  return [
    process.env.CHROME_PATH,
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe')
  ].filter(Boolean).find(p => fs.existsSync(p));
}

async function navigateur() {
  const exe = trouverNavigateur();
  if (!exe) throw new Error('Ni Chrome ni Edge trouvé (CHROME_PATH).');
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'nbabl-audit-'));
  const port = 9400 + Math.floor(Math.random() * 400);
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
  if (!cible) throw new Error('Navigateur injoignable.');

  const ws = new WebSocket(cible.webSocketDebuggerUrl);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error('DevTools injoignable')); });
  let id = 0;
  const attente = new Map(), ecouteurs = new Set();
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
  await envoyer('Page.enable');
  await envoyer('Runtime.enable');

  const evaluer = async code => {
    const r = await envoyer('Runtime.evaluate', { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text).split('\n')[0]);
    return r.result.value;
  };
  const ouvrir = async url => {
    const charge = new Promise(ok => {
      const f = m => { if (m.method === 'Page.loadEventFired') { ecouteurs.delete(f); ok(); } };
      ecouteurs.add(f); setTimeout(() => { ecouteurs.delete(f); ok(); }, 20000);
    });
    await envoyer('Page.navigate', { url });
    await charge;
    await pause(1200);
  };
  return { evaluer, ouvrir, fermer: () => { try { ws.close(); } catch {} proc.kill(); } };
}

/* Repère un texte français : un accent, ou un mot outil que l'anglais n'a pas.
   Exécuté dans la page, donc écrit en une seule chaîne. */
const COLLECTE = `
  // Un accent, ou un mot français que l'anglais n'a pas — y compris sans accent,
  // sans quoi « AUCUN BUILD OUVERT » passerait pour de l'anglais.
  const FR=/[àâçéèêëîïôöûùüÿœÀÂÇÉÈÊËÎÏÔÖÛÙÜŒ]|(^|[^a-zA-Z])(le|la|les|une|des|du|aux|pour|avec|dans|sans|que|qui|est|sont|ton|tes|ta|tous|toutes|cette|ceux|leur|plus|moins|chaque|selon|autre|autres|vers|entre|et|ou|déjà|encore|comme|mais|donc|ainsi|voir|ouvre|crée|monte|aucun|aucune|ouvert|ouverte|ouverts|accessible|accessibles|bloque|bloquee|nouveau|nouvelle|prochain|prochaine|suivant|suivante|choisir|rien|ajoute|charge|copie|copier|toi|jeu|jeux|taille|poste|corps|niveau|note|notes|montre|garde|reste|restants|restantes)([^a-zA-Z]|$)/i;
  // Mots français aussi valides en anglais ou noms propres : ne comptent pas.
  const BLANC=/^(NBA2KLab|LockerCodes|Signature|Sergio de Larrea|De'Aaron Fox|De'Andre Hunter|De'Anthony Melton)$/;
  // Le nom du site ne se traduit pas : il reste français dans les deux versions.
  const NETTOYER=t=>t.split('Le Labo des Builds').join('').split('Version française').join('');
  // Un mot court seul dans son nœud (« et » entre deux liens) compte aussi.
  const COURT=/^(et|ou|de|du|des|le|la|les|un|une|ton|ta|tes|au|aux|en|sur|avec|sans|pour|puis|donc|mais|soit|non|oui)$/i;
  const suspect=t=>COURT.test(t)||(t.length>=3&&FR.test(NETTOYER(t)));
  const vus=new Map();
  function chemin(n){
    const p=[];
    for(let e=n;e&&e.nodeType===1&&p.length<4;e=e.parentElement){
      p.unshift(e.id?'#'+e.id:(e.className&&typeof e.className==='string'?e.tagName.toLowerCase()+'.'+e.className.trim().split(/\\s+/)[0]:e.tagName.toLowerCase()));
    }
    return p.join(' > ');
  }
  function visible(e){
    if(!e)return false;
    const s=getComputedStyle(e);
    if(s.display==='none'||s.visibility==='hidden')return false;
    return true;
  }
  const marche=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  for(let n=marche.nextNode();n;n=marche.nextNode()){
    const t=(n.nodeValue||'').replace(/\\s+/g,' ').trim();
    if(BLANC.test(t)||!suspect(t))continue;
    const p=n.parentElement;
    if(!p||p.tagName==='SCRIPT'||p.tagName==='STYLE')continue;
    const cle=t.slice(0,160);
    if(!vus.has(cle))vus.set(cle,{texte:cle,ou:chemin(p),cache:!visible(p)});
  }
  document.querySelectorAll('[aria-label],[placeholder],[title],[alt]').forEach(e=>{
    ['aria-label','placeholder','title','alt'].forEach(a=>{
      const v=e.getAttribute(a);
      if(!v)return;
      const t=v.replace(/\\s+/g,' ').trim();
      if(BLANC.test(t)||!suspect(t))return;
      const cle=a+'="'+t.slice(0,120)+'"';
      if(!vus.has(cle))vus.set(cle,{texte:cle,ou:chemin(e),cache:!visible(e)});
    });
  });
  return [...vus.values()];
`;

// Déplie ce qui est replié : onglets, sections, boutons « voir plus ».
const DEPLIER = `
  document.querySelectorAll('details').forEach(d=>d.open=true);
  const clics=['#reelsPlus','.tab','[role="tab"]','.seg button','.tabs button','.filtre-onglet'];
  clics.forEach(s=>document.querySelectorAll(s).forEach(b=>{try{b.click()}catch(e){}}));
  await new Promise(r=>setTimeout(r,700));
  return document.body.innerText.length;
`;

/* Beaucoup d'écrans n'existent qu'après un clic : le mode Expert, les modales,
   l'assistant. Chacun est ouvert, relevé, puis refermé. */
const ETATS = {
  '/en/': ['#modeExpert', '#changeStyleBtn', '#importJeuOuvrir', '#share', '#referenceSettings'],
  '/en/hub/': ['.build-card', '#compareRun'],
  '/en/reference/': ['#animCategory'],
  '/en/mon-build/': ['.bm-tab', '#bmShare']
};
const FERMER = `
  document.querySelectorAll('.modal-close,[data-ij-fermer],[data-fermer],.modal .secondary').forEach(b=>{try{b.click()}catch(e){}});
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
  await new Promise(r=>setTimeout(r,300));
  return 1;
`;

const base = PROD ? BASE_PROD : null;
const srv = PROD ? null : await serveurLocal();
const racine = base || `http://127.0.0.1:${srv.address().port}`;
const nav = await navigateur();

let total = 0;
for (const p of PAGES) {
  await nav.ouvrir(racine + p);
  await nav.evaluer(DEPLIER).catch(() => {});
  await pause(500);
  const trouves = await nav.evaluer(COLLECTE);
  for (const sel of ETATS[p] || []) {
    const ouvert = await nav.evaluer(`const e=document.querySelector('${sel}'); if(!e)return 0; try{e.click()}catch(err){} await new Promise(r=>setTimeout(r,800)); return 1;`).catch(() => 0);
    if (!ouvert) continue;
    const dedans = await nav.evaluer(COLLECTE).catch(() => []);
    dedans.forEach(t => { if (!trouves.some(x => x.texte === t.texte)) trouves.push({ ...t, ou: `${t.ou}  [après clic sur ${sel}]` }); });
    await nav.evaluer(FERMER).catch(() => {});
  }
  const visibles = trouves.filter(t => !t.cache);
  const caches = trouves.filter(t => t.cache);
  total += visibles.length;
  console.log(`\n${p} — ${visibles.length} texte(s) français visible(s)${caches.length ? `, ${caches.length} masqué(s)` : ''}`);
  visibles.forEach(t => console.log(`   ${t.texte}\n      ↳ ${t.ou}`));
  if (process.argv.includes('--caches')) caches.forEach(t => console.log(`   (masqué) ${t.texte}\n      ↳ ${t.ou}`));
}

nav.fermer();
if (srv) srv.close();
console.log(`\nTotal visible : ${total}`);
process.exitCode = total ? 1 : 0;
