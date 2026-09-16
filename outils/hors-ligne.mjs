/* Le site tient-il sans réseau ?
 *
 *   node outils/hors-ligne.mjs
 *
 * Le site s'installe comme une application : un joueur peut l'ouvrir dans le
 * métro, ou pendant que sa connexion tombe. Le service worker met en cache les
 * pages et les scripts ; encore faut-il le vérifier autrement qu'en lisant son
 * code. Ici on charge le site, on laisse le service worker s'installer, on
 * coupe le réseau, puis on rouvre chaque page.
 */
import { navigateur, serveurLocal, RACINE, pause } from './navigateur.mjs';

process.chdir(RACINE);

const PAGES = ['/', '/hub/', '/reference/', '/mon-build/', '/mentions-legales/', '/en/', '/en/reference/'];
const srv = await serveurLocal();
const base = `http://127.0.0.1:${srv.address().port}`;
const nav = await navigateur();

// 1. Visite normale : le service worker s'installe et remplit son cache.
await nav.ouvrir(base + '/', 2500);
const pret = await nav.evaluer(`
  if (!('serviceWorker' in navigator)) return 'pas de service worker dans ce navigateur';
  const reg = await navigator.serviceWorker.ready;
  // On attend que la coquille soit écrite, sinon on teste un cache à moitié rempli.
  for (let i = 0; i < 40; i++) {
    const noms = await caches.keys();
    if (noms.length) {
      const c = await caches.open(noms.find(n => n.includes('shell')) || noms[0]);
      const clefs = await c.keys();
      if (clefs.length > 30) return 'cache prêt : ' + clefs.length + ' fichiers';
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return 'cache incomplet';
`);
console.log(pret);

// 2. Le réseau tombe.
await nav.envoyer('Network.enable');
await nav.envoyer('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });

const soucis = [];
for (const p of PAGES) {
  await nav.ouvrir(base + p, 1500);
  const r = await nav.evaluer(`
    const m = document.getElementById('main') || document.body;
    const t = (m.innerText || '').trim();
    return { taille: t.length, titre: document.title, debut: t.slice(0, 60) };
  `).catch(e => ({ taille: 0, titre: '', debut: 'illisible : ' + e.message }));
  const ok = r.taille > 200 && !/hors ligne/i.test(r.debut);
  console.log(`  ${ok ? '✓' : '✗'} ${p.padEnd(22)} ${r.taille} caractères — ${r.titre.slice(0, 40)}`);
  if (!ok) soucis.push(`${p} : ${r.debut}`);
}

// 3. Retour du réseau : le site doit repartir normalement.
await nav.envoyer('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await nav.ouvrir(base + '/', 1500);
const reprise = await nav.evaluer(`return (document.getElementById('main')||document.body).innerText.length > 200;`);
if (!reprise) soucis.push('le site ne repart pas une fois le réseau revenu');

nav.fermer();
srv.close();

if (soucis.length) {
  console.log(`\n${soucis.length} problème(s) hors ligne :`);
  soucis.forEach(s => console.log('  ' + s));
  process.exitCode = 1;
} else {
  console.log('\nToutes les pages s’ouvrent sans réseau, et le site repart quand il revient.');
}
