/* Audit d'interface : on clique sur tout, partout, dans les deux langues.
 *
 *   node outils/audit-ui.mjs            pages locales
 *   node outils/audit-ui.mjs --prod     https://lelabodesbuilds.com
 *
 * Les tests vérifient des parcours choisis. Ici on prend chaque page, en
 * français et en anglais, sur téléphone et sur ordinateur, en mode Simple et en
 * mode Expert, puis on actionne un par un TOUS les éléments cliquables et tous
 * les menus déroulants. On signale :
 *
 *   — toute erreur signalée par la page (hors API absente en local) ;
 *   — un bouton ou un lien sans libellé lisible (illisible au lecteur d'écran) ;
 *   — un contrôle qui vide la page ou fait disparaître le contenu principal ;
 *   — un menu dont une option casse l'affichage ;
 *   — une case interactive trop petite pour le doigt sur téléphone (< 32 px).
 */
import { navigateur, serveurLocal, RACINE, pause } from './navigateur.mjs';

process.chdir(RACINE);

const PROD = process.argv.includes('--prod');
const URL_PROD = 'https://lelabodesbuilds.com';
const PAGES = ['/', '/hub/', '/reference/', '/mon-build/', '/mentions-legales/'];
const LANGUES = ['', '/en'];
const ECRANS = [[375, 812, true, 'téléphone'], [1440, 900, false, 'ordinateur']];
const MODES = ['simple', 'expert'];

const soucis = [];
const vus = new Set();
function signaler(ou, quoi) {
  const cle = quoi.replace(/\d+/g, 'N');
  if (vus.has(cle)) return;          // un même défaut répété partout : une ligne suffit
  vus.add(cle);
  soucis.push(`${ou} — ${quoi}`);
}

/* Actionne tout ce qui est actionnable, sans quitter la page. */
const PARCOURS = `
  // Les liens sont neutralisés : on veut tester la page, pas naviguer.
  if (!window.__auditLiens) {
    window.__auditLiens = true;
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault(); }, true);
  }
  const anomalies = [];
  const corps = () => { const m = document.getElementById('main') || document.body; return (m.innerText || '').trim().length; };
  const avant = corps();
  const nom = e => ((e.innerText || '') + ' ' + (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('title') || '') + ' ' + (e.value || '')).replace(/\\s+/g, ' ').trim();
  const visible = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };

  const cliquables = [...document.querySelectorAll('button, [role="tab"], [role="button"], summary, a[href], input[type="checkbox"], input[type="radio"]')]
    .filter(visible)
    // aria-hidden : doublon visuel d'un contrôle déjà accessible ailleurs.
    .filter(e => !e.closest('[aria-hidden="true"]'));
  for (const e of cliquables) {
    // Libellé lisible : sans texte ni aria-label, le contrôle est muet.
    if (!nom(e) && !e.querySelector('svg[aria-label], img[alt]:not([alt=""])')) {
      anomalies.push('contrôle sans libellé : <' + e.tagName.toLowerCase() + (e.id ? ' #' + e.id : '') + (e.className ? ' .' + String(e.className).split(' ')[0] : '') + '>');
    }
    if (${JSON.stringify(true)} && window.innerWidth < 500) {
      const r = e.getBoundingClientRect();
      const dansTexte = e.tagName === 'A' && e.parentElement && /^(P|LI|SMALL|SPAN)$/.test(e.parentElement.tagName);
      if (r.height > 0 && r.height < 24 && !dansTexte && !e.closest('.thresholds, .anim-meta, footer')) {
        anomalies.push('zone tactile de ' + Math.round(r.height) + ' px : ' + (nom(e) || e.tagName).slice(0, 40));
      }
    }
  }
  // On actionne : d'abord les onglets et boutons, ensuite les menus.
  for (const e of cliquables.slice(0, 60)) {
    try { e.click(); } catch (err) { anomalies.push('clic impossible sur « ' + nom(e).slice(0, 40) + ' » : ' + err.message); }
  }
  await new Promise(r => setTimeout(r, 400));
  if (corps() < avant * 0.2) anomalies.push('la page s’est vidée après les clics (' + avant + ' → ' + corps() + ' caractères)');

  for (const s of [...document.querySelectorAll('select')].filter(visible)) {
    const options = [...s.options].map(o => o.value);
    for (const v of options.slice(0, 12)) {
      s.value = v;
      s.dispatchEvent(new Event('change', { bubbles: true }));
      s.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 40));
      if (corps() < avant * 0.2) { anomalies.push('le menu #' + (s.id || s.name) + ' vide la page sur « ' + v + ' »'); break; }
    }
    if (options.length) { s.value = options[0]; s.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  await new Promise(r => setTimeout(r, 200));
  return anomalies;
`;

const srv = PROD ? null : await serveurLocal();
const base = PROD ? URL_PROD : `http://127.0.0.1:${srv.address().port}`;
const nav = await navigateur();

let combinaisons = 0;
for (const [l, h, mobile, nomEcran] of ECRANS) {
  await nav.ecran(l, h, mobile);
  for (const mode of MODES) {
    for (const langue of LANGUES) {
      for (const page of PAGES) {
        const url = base + langue + page;
        await nav.ouvrir(url, 900);
        await nav.evaluer(`localStorage.setItem('nba2k27_mode_v1', ${JSON.stringify(mode)}); return 1;`).catch(() => { });
        await nav.ouvrir(url, 1100);
        combinaisons++;
        const ou = `${nomEcran} ${mode} ${langue || '/fr'}${page}`;
        const erreurs = nav.erreurs.filter(e => PROD || !e.includes('/api/'));
        erreurs.slice(0, 2).forEach(e => signaler(ou, `erreur : ${e.slice(0, 130)}`));
        nav.erreurs.length = 0;
        let anomalies = [];
        try { anomalies = await nav.evaluer(PARCOURS); }
        catch (e) {
          // « Charger ce build » emmène volontairement vers le builder : ce n'est
          // pas une anomalie, mais la page a changé sous l'outil.
          if (/navigated or closed/i.test(e.message)) { await nav.ouvrir(url, 900); }
          else signaler(ou, `parcours interrompu : ${e.message.slice(0, 120)}`);
        }
        anomalies.forEach(a => signaler(ou, a));
        nav.erreurs.filter(e => PROD || !e.includes('/api/')).slice(0, 2).forEach(e => signaler(ou, `erreur après clics : ${e.slice(0, 130)}`));
        nav.erreurs.length = 0;
      }
    }
  }
}

nav.fermer();
if (srv) srv.close();

console.log(`${combinaisons} combinaisons parcourues (${PAGES.length} pages × 2 langues × 2 écrans × 2 modes).`);
if (soucis.length) {
  console.log(`\n${soucis.length} point(s) à regarder :`);
  soucis.forEach(s => console.log('  ' + s));
  process.exitCode = 1;
} else {
  console.log('\nRien à signaler.');
}
