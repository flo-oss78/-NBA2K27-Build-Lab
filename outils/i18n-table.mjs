/* Fabrique i18n-en.js : les traductions embarquées que lit i18n.js sur /en/.
 *
 *   node outils/i18n-table.mjs
 *
 * Un fichier JavaScript plutôt qu'un fetch de JSON : la traduction doit être
 * prête avant le premier rendu, sans requête réseau supplémentaire.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(RACINE);

const en = JSON.parse(fs.readFileSync('donnees/en.json', 'utf8'));
const jeu = JSON.parse(fs.readFileSync('donnees/en-jeu.json', 'utf8'));

const charge = {
  textes: en.textes || {},
  scripts: en.scripts || {},
  // Phrases dont le milieu est une valeur calculée : [expression régulière, remplacement].
  motifs: en.motifs || [],
  jeu: {
    attributs: jeu.attributs || {},
    attributsDescriptions: jeu.attributsDescriptions || {},
    badgesDescriptions: jeu.badgesDescriptions || {},
    categories: jeu.categories || {},
    paliers: jeu.paliers || {},
    vocabulaire: jeu.vocabulaire || {},
    termes: jeu.termes || {},
    postes: jeu.postes || {}
  }
};

const sortie = `/* NBA 2K27 Build Lab — traductions anglaises (FICHIER GÉNÉRÉ par outils/i18n-table.mjs le ${new Date().toISOString().slice(0, 10)}).
   Ne pas modifier à la main : éditer donnees/en.json et donnees/en-jeu.json, puis régénérer. */
window.NBABL_EN=${JSON.stringify(charge)};
`;
fs.writeFileSync('i18n-en.js', sortie);
console.log(`i18n-en.js : ${Object.keys(charge.textes).length} textes de pages, ${Object.keys(charge.scripts).length} textes de scripts, ${Object.keys(charge.jeu.badgesDescriptions).length} descriptions de badges — ${Math.round(sortie.length / 1024)} ko`);
