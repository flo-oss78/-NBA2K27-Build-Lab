-- V26 : comptes joueurs, profils publics et abonnements.
--
-- L'identité vient de Discord, avec la portée « identify » seulement : on reçoit
-- l'identifiant, le pseudo et l'avatar. Ni e-mail, ni mot de passe, ni liste de
-- serveurs — c'est le minimum nécessaire pour qu'un profil soit reconnaissable,
-- et le moins de données personnelles à garder.
--
--   npx wrangler d1 execute nba-build-lab --remote --file=./migrations/0004_comptes_discord.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                  -- identifiant interne, jamais celui de Discord
  discord_id TEXT NOT NULL UNIQUE,      -- pour retrouver le compte à la connexion suivante
  pseudo TEXT NOT NULL,                 -- nom affiché, repris de Discord et modifiable
  avatar TEXT DEFAULT '',               -- empreinte d'avatar Discord, vide si aucun
  slug TEXT NOT NULL UNIQUE,            -- adresse publique : /u/<slug>
  created_at INTEGER NOT NULL,
  seen_at INTEGER NOT NULL,             -- dernière visite : sert au « nouveau depuis »
  blocked INTEGER DEFAULT 0             -- modération : un compte bloqué ne publie plus
);

CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);

-- Un build appartient à un compte. Les builds publiés avant les comptes gardent
-- author_id vide : ils restent en ligne, modifiables par leur jeton d'origine.
ALTER TABLE builds ADD COLUMN author_id TEXT DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_builds_author_id ON builds(author_id);

-- Qui suit qui. Pas de notification envoyée : la page « Suivis » montre ce qui a
-- changé depuis la dernière visite, ce qui évite d'avoir à gérer des e-mails.
CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (follower_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_author ON follows(author_id);
