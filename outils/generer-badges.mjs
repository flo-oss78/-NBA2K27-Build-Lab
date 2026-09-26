/* Génère une page par badge, en français et en anglais.
 *
 *   node outils/generer-badges.mjs
 *
 * Pourquoi : la page /reference/ construit ses 53 badges en JavaScript. Un
 * moteur de recherche qui la visite ne reçoit qu'un conteneur vide — vérifié,
 * aucun nom de badge n'apparaissait dans le HTML servi. Résultat : aucun
 * visiteur venu d'une recherche, alors que « badge NBA 2K27 » est exactement
 * ce que les joueurs tapent.
 *
 * Ces pages-là sont du vrai HTML : nom officiel, description du jeu, les
 * quatre paliers avec les attributs exigés, la taille requise.
 *
 * Aucune page n'est écrite à la main : elles sont réécrites à chaque
 * exécution. L'ossature commune vit dans _page-html.mjs.
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
vm.runInContext(fs.readFileSync('builder-data.js', 'utf8')
  + ';this.B=badgeDefs;this.NOMS=NOMS_ATTRIBUTS_FR;', ctx);
const BADGES = ctx.B;
const NOMS_FR_ATTR = ctx.NOMS;

const FR = JSON.parse(fs.readFileSync('donnees/badges-fr-2khq.json', 'utf8'));
const EN = JSON.parse(fs.readFileSync('donnees/en-jeu.json', 'utf8'));
const frParNom = Object.fromEntries(FR.badges.map(b => [b.en, b]));

const PALIERS_FR = ['Bronze', 'Argent', 'Or', 'Hall of Fame'];
const PALIERS_EN = PALIERS_FR.map(p => (EN.paliers && EN.paliers[p]) || p);

/* -------------------------------------------------------------- une fiche */

function fiche(def, langue) {
  const en = langue === 'en';
  const p = en ? '/en' : '';
  const info = frParNom[def.name] || {};
  const nom = en ? def.name : (info.fr || def.name);
  const autreNom = en ? (info.fr || '') : def.name;
  const categorie = en ? ((EN.categories && EN.categories[def.cat]) || def.cat) : def.cat;
  const description = en
    ? ((EN.badgesDescriptions && EN.badgesDescriptions[def.name]) || '')
    : (info.desc || '');
  const paliers = en ? PALIERS_EN : PALIERS_FR;
  const nomAttr = a => en ? ((EN.attributs && EN.attributs[a]) || a) : (NOMS_FR_ATTR[a] || a);
  const chemin = `/badge/${slug(def.name)}/`;

  const lignes = paliers.map((pal, i) => {
    const cases = def.req.map(r => `<td>${r[i + 1] != null ? r[i + 1] : '—'}</td>`).join('');
    return `<tr><th scope="row">${esc(pal)}</th>${cases}</tr>`;
  }).join('\n          ');
  const entetes = def.req.map(r => `<th scope="col">${esc(nomAttr(r[0]))}</th>`).join('');

  const regle = def.req.length < 2 ? ''
    : en
      ? (def.logic === 'OR'
        ? '<p class="badge-regle">One of these attributes is enough to reach a tier.</p>'
        : '<p class="badge-regle">Every attribute must reach the value shown.</p>')
      : (def.logic === 'OR'
        ? '<p class="badge-regle">Un seul de ces attributs suffit pour atteindre un palier.</p>'
        : '<p class="badge-regle">Chaque attribut doit atteindre la valeur indiquée.</p>');

  const tailles = (def.minH > 60 || def.maxH < 95)
    ? (en
      ? `<p class="badge-taille">Available from ${taillePieds(def.minH)} to ${taillePieds(def.maxH)} (${tailleCm(def.minH)}–${tailleCm(def.maxH)} cm).</p>`
      : `<p class="badge-taille">Disponible de ${taillePieds(def.minH)} à ${taillePieds(def.maxH)} (${tailleCm(def.minH)} à ${tailleCm(def.maxH)} cm).</p>`)
    : '';

  const aConfirmer = info.certitude === 0
    ? (en ? '<p class="badge-reserve">Description not yet confirmed in-game.</p>'
      : '<p class="badge-reserve">Description pas encore confirmée dans le jeu.</p>')
    : '';

  const voisins = BADGES.filter(b => b.cat === def.cat && b.name !== def.name).slice(0, 8)
    .map(b => {
      const n = en ? b.name : ((frParNom[b.name] || {}).fr || b.name);
      return `<li><a href="${p}/badge/${slug(b.name)}/">${esc(n)}</a></li>`;
    }).join('\n        ');

  const T = en ? {
    accueil: 'Home', badges: 'Badges', effet: 'What it does', debloquer: 'How to unlock it',
    palier: 'Tier', tester: 'Try it in the builder', memeCat: `Other ${categorie} badges`,
    tous: 'All 53 badges', source: 'Official name and description taken from the game (NBA 2K HQ).'
  } : {
    accueil: 'Accueil', badges: 'Badges', effet: 'Ce qu’il fait', debloquer: 'Comment le débloquer',
    palier: 'Palier', tester: 'Tester dans le builder', memeCat: `Autres badges ${categorie}`,
    tous: 'Les 53 badges', source: 'Nom et description officiels relevés dans le jeu (NBA 2K HQ).'
  };

  const titre = en
    ? `${nom} — NBA 2K27 badge requirements | Le Labo des Builds`
    : `${nom} (${def.name}) — badge NBA 2K27 et ses paliers | Le Labo des Builds`;
  const meta = en
    ? `${nom}: what this NBA 2K27 badge does, and the attribute levels needed for Bronze, Silver, Gold and Hall of Fame.`
    : `${nom} : ce que fait ce badge NBA 2K27, et les attributs requis pour Bronze, Argent, Or et Hall of Fame.`;

  const corps = `  <nav class="fil-ariane" aria-label="${en ? 'Breadcrumb' : 'Fil d’Ariane'}">
    <a href="${p}/">${T.accueil}</a> › <a href="${p}/reference/">${T.badges}</a> › <span>${esc(nom)}</span>
  </nav>

  <article class="panel badge-fiche">
    <p class="badge-cat">${esc(categorie)}</p>
    <h1>${esc(nom)}</h1>
    ${autreNom ? `<p class="badge-autre-nom">${en ? 'French name: ' : 'Nom anglais : '}<b>${esc(autreNom)}</b></p>` : ''}

    <h2>${T.effet}</h2>
    <p class="badge-desc">${esc(description)}</p>
    ${aConfirmer}

    <h2>${T.debloquer}</h2>
    <div class="badge-table-zone">
      <table class="badge-table">
        <caption>${esc(en ? `Attribute levels required for ${nom}` : `Attributs requis pour ${nom}`)}</caption>
        <thead><tr><th scope="col">${T.palier}</th>${entetes}</tr></thead>
        <tbody>
          ${lignes}
        </tbody>
      </table>
    </div>
    ${regle}
    ${tailles}

    <p class="badge-action"><a class="hq-pilule hq-pilule-forte" href="${p}/">${T.tester}</a></p>
    <p class="badge-source">${T.source}</p>
  </article>

  <nav class="panel badge-voisins" aria-label="${esc(T.memeCat)}">
    <h2>${esc(T.memeCat)}</h2>
    <ul>
        ${voisins}
    </ul>
    <p><a href="${p}/reference/">${T.tous}</a></p>
  </nav>`;

  return page({
    langue, titre, meta, chemin, corps, navActive: 'badges', classeMain: 'hq-page-badge',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: titre.split(' | ')[0], description: meta,
      inLanguage: en ? 'en' : 'fr',
      mainEntityOfPage: `https://lelabodesbuilds.com${en ? '/en' : ''}${chemin}`,
      isPartOf: { '@type': 'WebSite', name: 'Le Labo des Builds', url: 'https://lelabodesbuilds.com' }
    }
  });
}

/* --------------------------------------------------------------- écriture */

let ecrites = 0;
const slugs = [];
for (const def of BADGES) {
  const s = slug(def.name);
  slugs.push(s);
  for (const langue of ['fr', 'en']) {
    const dossier = path.join(RACINE, langue === 'en' ? 'en' : '.', 'badge', s);
    fs.mkdirSync(dossier, { recursive: true });
    fs.writeFileSync(path.join(dossier, 'index.html'), fiche(def, langue), 'utf8');
    ecrites++;
  }
}

/* La liste sert au sitemap : une Function ne peut pas lire builder-data.js,
   qui n'est pas un module. */
fs.writeFileSync('functions/badges-liste.js',
  `/* Généré par outils/generer-badges.mjs — ne pas modifier à la main. */\n`
  + `export const BADGES_SLUGS = ${JSON.stringify(slugs)};\n`, 'utf8');

console.log(`${ecrites} pages de badges générées (${BADGES.length} badges × 2 langues), `
  + `liste écrite dans functions/badges-liste.js`);
