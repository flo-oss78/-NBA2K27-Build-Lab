PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS builds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  height INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  wing INTEGER NOT NULL,
  score INTEGER DEFAULT 0,
  style TEXT DEFAULT '',
  attributes_json TEXT NOT NULL,
  badges INTEGER DEFAULT 0,
  animations INTEGER DEFAULT 0,
  cap_breakers INTEGER DEFAULT 0,
  validated INTEGER DEFAULT 0,
  rating_sum INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  owner_token_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  -- V24 : fiche de build (page publique /b/<id>, étiquettes, guide Cap Breaker)
  author TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags_json TEXT DEFAULT '[]',
  modes_json TEXT DEFAULT '[]',
  inspired_by TEXT DEFAULT '',
  hq_link TEXT DEFAULT '',
  cb_plan_json TEXT DEFAULT '[]',
  season TEXT DEFAULT 'S1',
  slug TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS build_likes (
  build_id TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (build_id, visitor_hash),
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  body TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_builds_created ON builds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builds_score ON builds(score DESC);
CREATE INDEX IF NOT EXISTS idx_builds_likes ON builds(likes DESC);
CREATE INDEX IF NOT EXISTS idx_comments_build ON comments(build_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_builds_trending ON builds(updated_at DESC, likes DESC);
CREATE INDEX IF NOT EXISTS idx_builds_author ON builds(author);

-- V18 integrity / abuse-prevention table.
-- Key contains the minute bucket, so old windows do not affect new requests.
CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  bucket INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_bucket ON api_rate_limits(bucket);
