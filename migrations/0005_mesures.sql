-- V26 : mesure d'audience, sans cookie ni traceur.
--
-- Le site n'avait aucun moyen de savoir combien de personnes le visitaient.
-- Plutôt qu'un service extérieur — qui suppose d'ouvrir une brèche dans la
-- Content-Security-Policy et d'envoyer l'adresse IP des visiteurs à un tiers —
-- le comptage se fait ici, et les chiffres restent dans cette base.
--
-- Ce qui est enregistré est agrégé : un compteur par jour, page, langue, type
-- d'appareil et provenance. Aucune ligne ne décrit une personne.
--
--   npx wrangler d1 execute nba-build-lab --remote --file=./migrations/0005_mesures.sql

CREATE TABLE IF NOT EXISTS mesures (
  jour TEXT NOT NULL,                   -- '2026-09-25'
  chemin TEXT NOT NULL,                 -- '/hub/', '/u/' (les profils sont regroupés)
  langue TEXT NOT NULL,                 -- 'fr' ou 'en'
  appareil TEXT NOT NULL,               -- 'mobile' ou 'ordinateur'
  source TEXT NOT NULL,                 -- domaine d'où vient le visiteur, ou 'direct'
  vues INTEGER NOT NULL DEFAULT 0,
  visiteurs INTEGER NOT NULL DEFAULT 0, -- premières visites du jour, voir ci-dessous
  PRIMARY KEY (jour, chemin, langue, appareil, source)
);

CREATE INDEX IF NOT EXISTS idx_mesures_jour ON mesures(jour);

-- Comment compter des visiteurs sans cookie et sans les suivre : une empreinte
-- courte, calculée à partir de l'adresse IP, du navigateur, du jour et de la clé
-- du serveur. Elle change chaque jour, ne peut pas être inversée, et ne sert
-- qu'à ne pas compter deux fois la même personne dans la même journée. Les
-- lignes de plus de sept jours sont effacées à mesure.
CREATE TABLE IF NOT EXISTS visiteurs_jour (
  jour TEXT NOT NULL,
  empreinte TEXT NOT NULL,
  PRIMARY KEY (jour, empreinte)
);
