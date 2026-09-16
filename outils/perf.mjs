/* Où passe le temps quand le joueur bouge un curseur ?
 *
 *   node outils/perf.mjs [tours]      (défaut : 30 mouvements de curseur)
 *
 * Le builder recalcule tout à chaque mouvement : plafonds, badges, animations,
 * validation, contexte sauvegardé. Cet outil enveloppe chaque étape, joue des
 * mouvements réels, et classe les étapes par temps cumulé. C'est la seule façon
 * honnête de savoir quoi optimiser : mesurer, pas deviner.
 */
import { navigateur, serveurLocal, RACINE } from './navigateur.mjs';

process.chdir(RACINE);
const TOURS = +(process.argv.find(a => /^\d+$/.test(a)) || 30);
const PAGE = (process.argv.find(a => a.startsWith('--page=')) || '--page=/').slice(7);
const EXPERT = process.argv.includes('--expert');

const srv = await serveurLocal();
const nav = await navigateur();
const base = `http://127.0.0.1:${srv.address().port}`;
await nav.ouvrir(base + PAGE, 1200);
if (EXPERT) {
  await nav.evaluer("localStorage.setItem('nba2k27_mode_v1','expert'); return 1;");
  await nav.ouvrir(base + PAGE, 1500);
}

const r = await nav.evaluer(`
  const attendre = ms => new Promise(r => setTimeout(r, ms));
  const ETAPES = ['bodyCaps','clampInputsToCaps','updateThresholds','updateAttributeVisuals','updateAttributeDeltas',
    'renderBadges','renderTakeovers','renderBreakers','renderAnimations','renderScouting','renderValidation',
    'conseilsAnimations','ecrireContexte','unlockedBadgeCount','unlockedAnimationCount','buildName','categoryAverages'];
  const temps = {}, appels = {};
  for (const nom of ETAPES) {
    const f = window[nom];
    if (typeof f !== 'function') continue;
    temps[nom] = 0; appels[nom] = 0;
    window[nom] = function () {
      const t = performance.now();
      try { return f.apply(this, arguments); }
      finally { temps[nom] += performance.now() - t; appels[nom]++; }
    };
  }
  // Certains modules ont capturé la fonction d'origine : on mesure au moins
  // ce qui passe par le nom global, et update() de bout en bout.
  const majOrigine = window.update;
  let totalUpdate = 0, nUpdate = 0;
  window.update = function () {
    const t = performance.now();
    try { return majOrigine.apply(this, arguments); }
    finally { totalUpdate += performance.now() - t; nUpdate++; }
  };

  const curseurs = [...document.querySelectorAll('#attributeGroups input')];
  if (!curseurs.length) return { temps, appels, totalUpdate, nUpdate, totalReel: 0, curseurs: 0, sansCurseurs: true };
  const debut = performance.now();
  for (let i = 0; i < ${TOURS}; i++) {
    const x = curseurs[i % curseurs.length];
    x.value = Math.max(25, Math.min(+x.max, 25 + ((i * 7) % 70)));
    x.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const totalReel = performance.now() - debut;
  await attendre(300);
  return { temps, appels, totalUpdate, nUpdate, totalReel, curseurs: curseurs.length };
`);

nav.fermer();
srv.close();

console.log(`${PAGE}${EXPERT ? ' (Expert)' : ''} — ${TOURS} mouvements de curseur — ${Math.round(r.totalReel)} ms au total, ${(r.totalUpdate / Math.max(1, r.nUpdate)).toFixed(1)} ms par recalcul complet.\n`);
const lignes = Object.entries(r.temps).filter(([, t]) => t > 0).sort((a, b) => b[1] - a[1]);
const total = lignes.reduce((t, [, v]) => t + v, 0);
console.log('Étape                      cumulé     part   appels   par appel');
for (const [nom, t] of lignes) {
  const n = r.appels[nom] || 1;
  console.log(`${nom.padEnd(26)} ${String(Math.round(t)).padStart(5)} ms ${String(Math.round(t / total * 100)).padStart(5)} % ${String(n).padStart(7)}   ${(t / n).toFixed(2)} ms`);
}
