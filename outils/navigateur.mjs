/* Pilotage d'un vrai navigateur (Chrome ou Edge) et serveur local du site.
 *
 * Partagé par les outils d'audit (i18n-audit.mjs, simulation.mjs). Le serveur
 * rejoue les en-têtes de _headers : sans eux, l'audit local est plus permissif
 * que la production — c'est ainsi qu'un eval() bloqué par la CSP est passé
 * inaperçu jusqu'en ligne.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const pause = ms => new Promise(r => setTimeout(r, ms));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};

/* En-têtes appliqués à tout le site (règle « /* » de _headers). */
export function entetesDuSite() {
  const lignes = fs.readFileSync(path.join(RACINE, '_headers'), 'utf8').replace(/\r\n/g, '\n').split('\n');
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

export function serveurLocal() {
  const communs = entetesDuSite();
  return new Promise(ok => {
    const srv = http.createServer((req, res) => {
      let rel = decodeURIComponent(req.url.split('?')[0]);
      if (rel.endsWith('/')) rel += 'index.html';          // comme Cloudflare Pages
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
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
    '/usr/bin/google-chrome', '/usr/bin/chromium'
  ].filter(Boolean).find(p => fs.existsSync(p));
}

/* Ouvre un navigateur sans fenêtre et rend de quoi le piloter.
   erreurs : tout ce que la page a signalé depuis la dernière navigation. */
export async function navigateur({ mobile = false, largeur = 1440, hauteur = 900 } = {}) {
  const exe = trouverNavigateur();
  if (!exe) throw new Error('Ni Chrome ni Edge trouvé (variable CHROME_PATH).');
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'nbabl-audit-'));
  const port = 9400 + Math.floor(Math.random() * 500);
  const proc = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profil}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

  let cible;
  for (let i = 0; i < 100 && !cible; i++) {
    try {
      const liste = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      cible = liste.find(t => t.type === 'page');
    } catch { /* pas encore prêt */ }
    if (!cible) await pause(200);
  }
  if (!cible) throw new Error('Navigateur injoignable sur le port de débogage.');

  const ws = new WebSocket(cible.webSocketDebuggerUrl);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = () => ko(new Error('DevTools injoignable')); });

  let id = 0;
  const attente = new Map(), ecouteurs = new Set(), erreurs = [];
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

  ecouteurs.add(m => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      erreurs.push(((d.exception && d.exception.description) || d.text || '').split('\n')[0]);
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      erreurs.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
    } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      erreurs.push(m.params.entry.text + (m.params.entry.url ? ' — ' + m.params.entry.url : ''));
    } else if (m.method === 'Page.javascriptDialogOpening') {
      envoyer('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
    }
  });

  await envoyer('Page.enable');
  await envoyer('Runtime.enable');
  await envoyer('Log.enable');
  await envoyer('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: 1, mobile });

  const evaluer = async code => {
    const r = await envoyer('Runtime.evaluate', {
      expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true
    });
    if (r.exceptionDetails) {
      const d = r.exceptionDetails;
      throw new Error(((d.exception && d.exception.description) || d.text || '').split('\n')[0]);
    }
    return r.result.value;
  };

  const ouvrir = async (url, attendreMs = 1000) => {
    erreurs.length = 0;
    const charge = new Promise(ok => {
      const f = m => { if (m.method === 'Page.loadEventFired') { ecouteurs.delete(f); ok(); } };
      ecouteurs.add(f);
      setTimeout(() => { ecouteurs.delete(f); ok(); }, 20000);
    });
    await envoyer('Page.navigate', { url });
    await charge;
    await pause(attendreMs);
  };

  const ecran = async (l, h, m) => envoyer('Emulation.setDeviceMetricsOverride', { width: l, height: h, deviceScaleFactor: 1, mobile: !!m });

  return {
    evaluer, ouvrir, ecran, erreurs, envoyer,
    fermer: () => { try { ws.close(); } catch { } proc.kill(); }
  };
}
