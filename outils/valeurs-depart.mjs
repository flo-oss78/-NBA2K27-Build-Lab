/* Écrit dans les pages les valeurs que les scripts vont y mettre de toute façon.
 *
 *   node outils/valeurs-depart.mjs            montre ce qui changerait
 *   node outils/valeurs-depart.mjs --ecrire   applique
 *
 * Pourquoi : les pages arrivent avec des « 0 » de remplissage, remplacés au
 * chargement par les valeurs du build d'exemple. À l'écran le visiteur voit
 * tout de suite le build complet, mais pendant les premières fractions de
 * seconde — et si un script est bloqué — la page paraît vide ou cassée. Un
 * lecteur qui n'exécute pas les scripts (aperçu de partage, robot, mode
 * dégradé) ne voit, lui, que des zéros.
 *
 * Les valeurs ne sont pas recalculées ici : elles sont LUES dans un vrai
 * navigateur, une fois la page chargée. Réimplémenter les formules aurait fini
 * par diverger du site, et écrire une valeur légèrement différente aurait
 * produit exactement le clignotement qu'on veut supprimer.
 */
import fs from 'node:fs';
import { navigateur, serveurLocal, RACINE } from './navigateur.mjs';

process.chdir(RACINE);
const ECRIRE = process.argv.includes('--ecrire');

// Ces valeurs décrivent le build d'exemple : elles sont les mêmes pour tout
// visiteur qui arrive sans build enregistré.
const IDS = ['score', 'finishVal', 'shootVal', 'playVal', 'defVal', 'rebVal', 'physVal',
  'badgeReachable', 'animDataSource', 'capStatus', 'buildname', 'buildMeta'];
const PAGES = ['index.html', 'hub/index.html', 'reference/index.html', 'mon-build/index.html'];
const CHEMIN = { 'index.html': '/', 'hub/index.html': '/hub/', 'reference/index.html': '/reference/', 'mon-build/index.html': '/mon-build/' };

const srv = await serveurLocal();
const base = `http://127.0.0.1:${srv.address().port}`;
const nav = await navigateur();

let total = 0;
for (const f of PAGES) {
  // Page ouverte sans build en mémoire : l'état exact d'un premier visiteur.
  await nav.ouvrir(base + CHEMIN[f], 600);
  await nav.evaluer(`localStorage.clear(); return 1;`).catch(() => { });
  await nav.ouvrir(base + CHEMIN[f], 1800);
  const lues = await nav.evaluer(`
    const out = {};
    for (const id of ${JSON.stringify(IDS)}) {
      const e = document.getElementById(id);
      if (e && e.children.length === 0) out[id] = e.textContent.trim();
    }
    return out;`);

  const brut = fs.readFileSync(f, 'utf8');
  let html = brut, change = [];
  for (const [id, valeur] of Object.entries(lues)) {
    if (!valeur || valeur.length > 120) continue;
    const re = new RegExp(`(id="${id}"[^>]*>)([^<]*)(<)`);
    const m = html.match(re);
    if (!m || m[2].trim() === valeur) continue;
    // On ne touche qu'à un contenu de remplissage — zéro, tiret, vide — ou à un
    // nombre déjà écrit mais devenu faux : index.html annonçait 86 de moyenne là
    // où le build d'exemple en fait 74. Jamais à une phrase rédigée.
    if (!/^(\d+( \/ \d+[^<]*)?|—|-|\s*)$/.test(m[2])) continue;
    html = html.replace(re, (t, a, avant, b) => a + valeur.replace(/\$/g, '$$$$') + b);
    change.push(`${id} : « ${m[2].trim() || '(vide)'} » → « ${valeur} »`);
  }
  console.log(`\n${f} — ${change.length} valeur(s) de départ`);
  change.forEach(c => console.log('   ' + c));
  total += change.length;
  if (ECRIRE && change.length) fs.writeFileSync(f, html);
}

nav.fermer();
srv.close();

if (!ECRIRE) console.log(`\n${total} au total. Rien écrit — relancer avec --ecrire pour appliquer.`);
else console.log(`\n${total} valeur(s) écrites. Les scripts les recalculent au chargement, à l’identique.`);
