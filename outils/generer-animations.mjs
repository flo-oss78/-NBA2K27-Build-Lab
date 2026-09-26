/* Génère les pages d'animations, en français et en anglais.
 *
 *   node outils/generer-animations.mjs
 *
 * Le site connaît 2 595 animations avec leurs exigences — c'est son plus gros
 * contenu, et il était entièrement invisible : /reference/ construit sa liste
 * en JavaScript, un moteur de recherche n'y trouve pas un nom.
 *
 * On ne fabrique pas 2 595 pages : la plupart tiendraient en deux lignes, et
 * une nuée de pages maigres dessert un site au lieu de l'aider. Une page par
 * catégorie, en revanche, est exactement ce qu'un joueur cherche — « quels
 * jumpshots puis-je prendre », « quels dunks avec ce build » — et donne une
 * vraie liste consultable, triée par exigence.
 *
 *   /animations/                    les 53 catégories, par famille
 *   /animations/<catégorie>/        la liste complète, avec les attributs
 *
 * L'ossature commune vit dans _page-html.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { page, esc, slug, taillePieds, tailleCm } from './_page-html.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

/* ---------------------------------------------------------------- données */

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('animations.js', 'utf8')
  + ';this.A=ANIMATIONS;this.S=ANIMATIONS_SOURCE;', ctx);
const ANIMS = ctx.A;
const SOURCE = ctx.S || {};

const ctxB = { window: {} };
vm.createContext(ctxB);
vm.runInContext(fs.readFileSync('builder-data.js', 'utf8') + ';this.NOMS=NOMS_ATTRIBUTS_FR;', ctxB);
const NOMS_FR_ATTR = ctxB.NOMS;

const EN = JSON.parse(fs.readFileSync('donnees/en-jeu.json', 'utf8'));

/* Les familles telles que le site les nomme déjà, et leur ordre d'affichage. */
const FAMILLES = ['Tir', 'Dribble', 'Finition', 'Poste', 'Passe', 'Déplacement'];
const FAMILLE_EN = {
  Tir: 'Shooting', Dribble: 'Dribbling', Finition: 'Finishing',
  Poste: 'Post play', Passe: 'Passing', Déplacement: 'Movement'
};
/* Une phrase par famille : elle dit à qui la page s'adresse, et donne au
   lecteur (comme au moteur) autre chose qu'un tableau nu. */
const FAMILLE_TEXTE = {
  Tir: ['Tout ce qui part en suspension : bases de tir, tirs en dribble, fadeaways.',
    'Everything you shoot off a jump: jumpshot bases, pull-ups, fadeaways.'],
  Dribble: ['Les gestes balle en main : crossovers, hésitations, échappées, enchaînements.',
    'Ball-handling moves: crossovers, hesitations, escapes and combos.'],
  Finition: ['Terminer au cercle : double-pas, dunks, alley-oops.',
    'Finishing at the rim: layups, dunks and alley-oops.'],
  Poste: ['Le jeu dos au panier : appuis, crochets, fadeaways au poste.',
    'Back-to-the-basket play: footwork, hooks and post fades.'],
  Passe: ['La façon dont partent tes passes.', 'How your passes leave your hands.'],
  Déplacement: ['La course et les appuis sans ballon.', 'How your player runs and moves off the ball.']
};

const parCategorie = new Map();
for (const a of ANIMS) {
  if (!parCategorie.has(a.category)) parCategorie.set(a.category, []);
  parCategorie.get(a.category).push(a);
}

const nomAttr = (a, en) => en ? ((EN.attributs && EN.attributs[a]) || a) : (NOMS_FR_ATTR[a] || a);

/* Coût d'entrée d'une animation : la plus haute exigence. Sert à trier du
   plus accessible au plus exigeant, ce que personne ne peut faire de tête
   sur 780 lignes. */
function exigenceMax(a) {
  const v = Object.values(a.req || {});
  return v.length ? Math.max(...v) : 0;
}

function exigencesTexte(a, en) {
  const entrees = Object.entries(a.req || {});
  if (!entrees.length) return en ? 'No known requirement' : 'Aucune exigence connue';
  const liste = entrees.map(([k, v]) => `${esc(nomAttr(k, en))} ${v}`)
    .join(a.ou ? (en ? ' or ' : ' ou ') : ' · ');
  return liste;
}

/* ------------------------------------------------------- page d'une catégorie */

function pageCategorie(categorie, liste, langue) {
  const en = langue === 'en';
  const p = en ? '/en' : '';
  const famille = liste[0].group;
  const familleNom = en ? (FAMILLE_EN[famille] || famille) : famille;
  const chemin = `/animations/${slug(categorie)}/`;

  const triees = [...liste].sort((a, b) => exigenceMax(a) - exigenceMax(b) || a.name.localeCompare(b.name));
  const nonConfirmees = liste.filter(a => !a.req || !Object.keys(a.req).length).length;

  const lignes = triees.map(a => {
    const t = (a.minH > 60 || a.maxH < 95)
      ? `${taillePieds(a.minH)}–${taillePieds(a.maxH)}`
      : (en ? 'any height' : 'toutes tailles');
    return `<tr><th scope="row">${esc(a.name)}</th><td>${exigencesTexte(a, en)}</td><td class="anim-taille">${esc(t)}</td></tr>`;
  }).join('\n          ');

  // Les autres catégories de la même famille : de quoi continuer à explorer.
  const voisines = [...parCategorie.entries()]
    .filter(([c, l]) => l[0].group === famille && c !== categorie)
    .sort((a, b) => b[1].length - a[1].length).slice(0, 10)
    .map(([c, l]) => `<li><a href="${p}/animations/${slug(c)}/">${esc(c)}</a> <small>(${l.length})</small></li>`)
    .join('\n        ');

  const T = en ? {
    accueil: 'Home', anim: 'Animations', nom: 'Animation', exig: 'Requirements', taille: 'Height',
    combien: `${liste.length} animations in this category`,
    tri: 'Sorted from the easiest to unlock to the most demanding.',
    tester: 'See what your build can equip',
    autres: `Other ${familleNom} categories`, toutes: 'All animation categories',
    inconnu: nonConfirmees ? `${nonConfirmees} of them have no confirmed requirement yet.` : ''
  } : {
    accueil: 'Accueil', anim: 'Animations', nom: 'Animation', exig: 'Exigences', taille: 'Taille',
    combien: `${liste.length} animations dans cette catégorie`,
    tri: 'Classées de la plus accessible à la plus exigeante.',
    tester: 'Voir ce que ton build peut équiper',
    autres: `Autres catégories ${familleNom}`, toutes: 'Toutes les catégories d’animations',
    inconnu: nonConfirmees ? `${nonConfirmees} d’entre elles n’ont pas encore d’exigence confirmée.` : ''
  };

  const titre = en
    ? `${categorie} — NBA 2K27 requirements for all ${liste.length} | Le Labo des Builds`
    : `${categorie} — les exigences des ${liste.length} animations NBA 2K27 | Le Labo des Builds`;
  const meta = en
    ? `Every ${categorie} animation in NBA 2K27 (${liste.length}), with the attributes and height each one needs.`
    : `Toutes les animations ${categorie} de NBA 2K27 (${liste.length}), avec les attributs et la taille exigés par chacune.`;

  const source = SOURCE.sources && SOURCE.sources.length
    ? (en ? 'Requirements cross-checked between ' : 'Exigences recoupées entre ')
      + SOURCE.sources.map(s => esc(s.nom)).join(en ? ' and ' : ' et ') + '.'
    : '';

  const corps = `  <nav class="fil-ariane" aria-label="${en ? 'Breadcrumb' : 'Fil d’Ariane'}">
    <a href="${p}/">${T.accueil}</a> › <a href="${p}/animations/">${T.anim}</a> › <span>${esc(categorie)}</span>
  </nav>

  <article class="panel anim-liste">
    <p class="badge-cat">${esc(familleNom)}</p>
    <h1>${esc(categorie)}</h1>
    <p class="anim-compte">${esc(T.combien)}. ${esc(T.tri)} ${esc(T.inconnu)}</p>

    <div class="badge-table-zone">
      <table class="badge-table anim-table">
        <caption>${esc(en ? `Requirements for every ${categorie} animation` : `Exigences de chaque animation ${categorie}`)}</caption>
        <thead><tr><th scope="col">${T.nom}</th><th scope="col">${T.exig}</th><th scope="col">${T.taille}</th></tr></thead>
        <tbody>
          ${lignes}
        </tbody>
      </table>
    </div>

    <p class="badge-action"><a class="hq-pilule hq-pilule-forte" href="${p}/reference/?onglet=animations">${T.tester}</a></p>
    ${source ? `<p class="badge-source">${source}</p>` : ''}
  </article>

  <nav class="panel badge-voisins" aria-label="${esc(T.autres)}">
    <h2>${esc(T.autres)}</h2>
    <ul>
        ${voisines}
    </ul>
    <p><a href="${p}/animations/">${T.toutes}</a></p>
  </nav>`;

  return page({
    langue, titre, meta, chemin, corps, navActive: 'animations', classeMain: 'hq-page-anim',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: titre.split(' | ')[0], description: meta,
      inLanguage: en ? 'en' : 'fr',
      mainEntityOfPage: `https://lelabodesbuilds.com${p}${chemin}`,
      isPartOf: { '@type': 'WebSite', name: 'Le Labo des Builds', url: 'https://lelabodesbuilds.com' }
    }
  });
}

/* ------------------------------------------------------------ page d'index */

function pageIndex(langue) {
  const en = langue === 'en';
  const p = en ? '/en' : '';

  const familles = FAMILLES.map(f => {
    const cats = [...parCategorie.entries()].filter(([, l]) => l[0].group === f)
      .sort((a, b) => b[1].length - a[1].length);
    if (!cats.length) return '';
    const total = cats.reduce((n, [, l]) => n + l.length, 0);
    const texte = (FAMILLE_TEXTE[f] || ['', ''])[en ? 1 : 0];
    const items = cats.map(([c, l]) =>
      `<li><a href="${p}/animations/${slug(c)}/">${esc(c)}</a> <small>${l.length}</small></li>`).join('\n        ');
    return `  <section class="panel anim-famille">
    <h2>${esc(en ? (FAMILLE_EN[f] || f) : f)} <small>${total}</small></h2>
    <p class="anim-famille-texte">${esc(texte)}</p>
    <ul class="anim-cats">
        ${items}
    </ul>
  </section>`;
  }).filter(Boolean).join('\n\n');

  const titre = en
    ? `NBA 2K27 animation requirements — all ${ANIMS.length} | Le Labo des Builds`
    : `Exigences des animations NBA 2K27 — les ${ANIMS.length} | Le Labo des Builds`;
  const meta = en
    ? `The attributes and height needed for each of the ${ANIMS.length} NBA 2K27 animations, category by category.`
    : `Les attributs et la taille exigés par chacune des ${ANIMS.length} animations de NBA 2K27, catégorie par catégorie.`;

  const corps = `  <nav class="fil-ariane" aria-label="${en ? 'Breadcrumb' : 'Fil d’Ariane'}">
    <a href="${p}/">${en ? 'Home' : 'Accueil'}</a> › <span>Animations</span>
  </nav>

  <header class="panel anim-intro">
    <h1>${esc(en ? 'NBA 2K27 animation requirements' : 'Exigences des animations NBA 2K27')}</h1>
    <p>${esc(en
      ? `${ANIMS.length} animations, ${parCategorie.size} categories, with the attributes and the height each one asks for. Pick a category to see the full list.`
      : `${ANIMS.length} animations, ${parCategorie.size} catégories, avec les attributs et la taille exigés par chacune. Choisis une catégorie pour voir la liste complète.`)}</p>
    <p class="badge-action"><a class="hq-pilule hq-pilule-forte" href="${p}/reference/?onglet=animations">${esc(en ? 'See what your build can equip' : 'Voir ce que ton build peut équiper')}</a></p>
  </header>

${familles}`;

  return page({
    langue, titre, meta, chemin: '/animations/', corps,
    navActive: 'animations', classeMain: 'hq-page-anim',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: titre.split(' | ')[0], description: meta,
      inLanguage: en ? 'en' : 'fr',
      isPartOf: { '@type': 'WebSite', name: 'Le Labo des Builds', url: 'https://lelabodesbuilds.com' }
    }
  });
}

/* --------------------------------------------------------------- écriture */

let ecrites = 0;
const slugs = [];
for (const [categorie, liste] of parCategorie) {
  const s = slug(categorie);
  slugs.push(s);
  for (const langue of ['fr', 'en']) {
    const dossier = path.join(RACINE, langue === 'en' ? 'en' : '.', 'animations', s);
    fs.mkdirSync(dossier, { recursive: true });
    fs.writeFileSync(path.join(dossier, 'index.html'), pageCategorie(categorie, liste, langue), 'utf8');
    ecrites++;
  }
}
for (const langue of ['fr', 'en']) {
  const dossier = path.join(RACINE, langue === 'en' ? 'en' : '.', 'animations');
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, 'index.html'), pageIndex(langue), 'utf8');
  ecrites++;
}

fs.writeFileSync('functions/animations-liste.js',
  `/* Généré par outils/generer-animations.mjs — ne pas modifier à la main. */\n`
  + `export const ANIM_SLUGS = ${JSON.stringify(slugs)};\n`, 'utf8');

console.log(`${ecrites} pages d'animations générées (${parCategorie.size} catégories + index, × 2 langues), `
  + `${ANIMS.length} animations couvertes`);
