/* Rapport de fréquentation du site.
 *
 *   node outils/affluence.mjs          les 14 derniers jours
 *   node outils/affluence.mjs 30       les 30 derniers jours
 *
 * Lit la table « mesures » de la base de production. Rien n'est envoyé nulle
 * part : les chiffres sont chez toi, et ce script ne fait que les mettre en
 * forme. Les robots et nos propres tests ne sont jamais comptés — ils sont
 * écartés à l'enregistrement.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const JOURS = Math.max(1, Math.min(365, parseInt(process.argv[2] || '14', 10) || 14));
const depuis = new Date(Date.now() - JOURS * 86400000).toISOString().slice(0, 10);

const gras = s => `\x1b[1m${s}\x1b[0m`;
const pale = s => `\x1b[2m${s}\x1b[0m`;

/* Deux pièges rencontrés en chemin :
   - sous Windows, depuis une mise à jour de sécurité de Node, un fichier .cmd
     comme npx.cmd ne peut plus être lancé directement : il faut le shell ;
   - « --file » n'est pas une solution de repli : sur une base distante,
     wrangler le fait passer par son API d'import, qui demande d'autres droits
     et refuse une simple lecture. On reste donc sur « --command », avec la
     requête tenue sur une seule ligne et entre guillemets. */
const NPX = process.platform === 'win32'
  ? `"${path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'npx.cmd')}"`
  : 'npx';

function interroger(sql) {
  const uneLigne = sql.replace(/\s+/g, ' ').trim();
  const brut = execSync(
    `${NPX} --yes wrangler@4 d1 execute nba-build-lab --remote --json --command "${uneLigne}"`,
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  // wrangler préfixe parfois sa sortie : on ne garde que le JSON.
  const debut = brut.indexOf('[');
  if (debut < 0) throw new Error('réponse inattendue de wrangler :\n' + brut.slice(0, 400));
  const paquet = JSON.parse(brut.slice(debut));
  return (paquet[0] && paquet[0].results) || [];
}

function tableau(titre, lignes, colonnes) {
  console.log('\n' + gras(titre));
  if (!lignes.length) { console.log(pale('  (rien sur la période)')); return; }
  const larg = colonnes.map(c => Math.max(c.titre.length,
    ...lignes.map(l => String(c.valeur(l)).length)));
  console.log('  ' + colonnes.map((c, i) =>
    (c.droite ? c.titre.padStart(larg[i]) : c.titre.padEnd(larg[i]))).join('  '));
  for (const l of lignes) {
    console.log('  ' + colonnes.map((c, i) => {
      const v = String(c.valeur(l));
      return c.droite ? v.padStart(larg[i]) : v.padEnd(larg[i]);
    }).join('  '));
  }
}

const N = k => l => (+l[k] || 0).toLocaleString('fr-FR');

console.log(gras(`\nFréquentation — ${JOURS} derniers jours (depuis le ${depuis})`));

const total = interroger(
  `SELECT COALESCE(SUM(vues),0) AS vues, COALESCE(SUM(visiteurs),0) AS visiteurs
   FROM mesures WHERE jour >= '${depuis}'`)[0] || { vues: 0, visiteurs: 0 };

if (!+total.vues) {
  console.log(pale('\n  Aucune visite enregistrée sur la période.'));
  console.log(pale('  Si la mesure vient d’être mise en ligne, c’est normal : les chiffres'));
  console.log(pale('  commencent au premier visiteur qui n’est ni un robot ni un test.\n'));
  process.exit(0);
}

const pluriel = (n, mot) => `${mot}${+n > 1 ? 's' : ''}`;
const parVisiteur = (total.vues / Math.max(1, total.visiteurs)).toFixed(1).replace('.', ',');
console.log(`  ${gras(N('visiteurs')(total))} ${pluriel(total.visiteurs, 'visiteur')}`
  + `  ·  ${gras(N('vues')(total))} ${pluriel(total.vues, 'page')} ${pluriel(total.vues, 'vue')}`
  + `  ·  ${parVisiteur} pages par visiteur`);

tableau('Par jour', interroger(
  `SELECT jour, SUM(vues) AS vues, SUM(visiteurs) AS visiteurs
   FROM mesures WHERE jour >= '${depuis}' GROUP BY jour ORDER BY jour DESC`), [
  { titre: 'Jour', valeur: l => l.jour },
  { titre: 'Visiteurs', valeur: N('visiteurs'), droite: true },
  { titre: 'Pages vues', valeur: N('vues'), droite: true }
]);

tableau('Pages les plus vues', interroger(
  `SELECT chemin, SUM(vues) AS vues, SUM(visiteurs) AS visiteurs
   FROM mesures WHERE jour >= '${depuis}' GROUP BY chemin ORDER BY vues DESC LIMIT 15`), [
  { titre: 'Page', valeur: l => l.chemin },
  { titre: 'Vues', valeur: N('vues'), droite: true },
  { titre: 'Visiteurs', valeur: N('visiteurs'), droite: true }
]);

tableau('D’où viennent les visiteurs', interroger(
  `SELECT source, SUM(vues) AS vues FROM mesures
   WHERE jour >= '${depuis}' AND source <> 'interne' GROUP BY source ORDER BY vues DESC LIMIT 15`), [
  { titre: 'Provenance', valeur: l => l.source },
  { titre: 'Vues', valeur: N('vues'), droite: true }
]);

tableau('Langue et appareil', interroger(
  `SELECT langue, appareil, SUM(vues) AS vues, SUM(visiteurs) AS visiteurs
   FROM mesures WHERE jour >= '${depuis}' GROUP BY langue, appareil ORDER BY vues DESC`), [
  { titre: 'Langue', valeur: l => l.langue === 'en' ? 'anglais' : 'français' },
  { titre: 'Appareil', valeur: l => l.appareil },
  { titre: 'Vues', valeur: N('vues'), droite: true },
  { titre: 'Visiteurs', valeur: N('visiteurs'), droite: true }
]);

console.log('');
