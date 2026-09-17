import { navigateur, serveurLocal } from 'file:///C:/Users/flore/OneDrive/Bureau/site nba builder/outils/navigateur.mjs';
const srv = await serveurLocal();
const base = `http://127.0.0.1:${srv.address().port}`;
const nav = await navigateur({ largeur: 1440, hauteur: 900 });
await nav.ouvrir(base + '/', 800);
await nav.evaluer(`localStorage.setItem('nba2k27_mode_v1','expert'); return 1;`);
await nav.ouvrir(base + '/', 1800);
const r = await nav.evaluer(`
  const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const blocs = [...document.querySelectorAll('#main > section, #main > div[id]')].filter(vis).map(e => {
    const b = e.getBoundingClientRect();
    return (e.id || e.className.split(' ')[0]) + ' ' + Math.round(b.height) + ' px' + (e.classList.contains('section-repliee') ? ' (replié)' : '');
  });
  return { hauteur: document.documentElement.scrollHeight, blocs, boutons: document.querySelectorAll('.section-plier').length };
`);
console.log(`Expert — page de ${r.hauteur} px, ${r.boutons} sections repliables`);
r.blocs.forEach(b => console.log('   ' + b));
// On déplie « Build intelligence » et on vérifie que le choix tient au rechargement.
await nav.evaluer(`document.querySelector('#intelligence .section-title').click(); await new Promise(r=>setTimeout(r,300)); return 1;`);
await nav.ouvrir(base + '/', 1600);
const apres = await nav.evaluer(`
  const s = document.getElementById('intelligence');
  return { ouvert: !s.classList.contains('section-repliee'), hauteur: document.documentElement.scrollHeight };`);
console.log(`\nAprès avoir déplié « Build intelligence » et rechargé : ouvert = ${apres.ouvert}, page ${apres.hauteur} px`);
nav.fermer(); srv.close();
