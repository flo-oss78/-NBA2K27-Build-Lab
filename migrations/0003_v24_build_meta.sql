-- V24 : métadonnées de build (pages publiques, tags, guide Cap Breaker, lien NBA 2K HQ)
ALTER TABLE builds ADD COLUMN author TEXT DEFAULT '';
ALTER TABLE builds ADD COLUMN description TEXT DEFAULT '';
ALTER TABLE builds ADD COLUMN tags_json TEXT DEFAULT '[]';
ALTER TABLE builds ADD COLUMN modes_json TEXT DEFAULT '[]';
ALTER TABLE builds ADD COLUMN inspired_by TEXT DEFAULT '';
ALTER TABLE builds ADD COLUMN hq_link TEXT DEFAULT '';
ALTER TABLE builds ADD COLUMN cb_plan_json TEXT DEFAULT '[]';
ALTER TABLE builds ADD COLUMN season TEXT DEFAULT 'S1';
ALTER TABLE builds ADD COLUMN slug TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_builds_trending ON builds(updated_at DESC, likes DESC);
CREATE INDEX IF NOT EXISTS idx_builds_author ON builds(author);
