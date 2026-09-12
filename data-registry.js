/**
 * NBA 2K27 Build Lab V18 — data governance layer.
 *
 * This file deliberately separates OFFICIAL SYSTEM FACTS from embedded
 * gameplay tables that still require in-game/source-by-entry verification.
 * Never treat PROBABLE/ESTIMATED/UNVERIFIED values as official.
 */
const DATA_VERSION = Object.freeze({
  gameVersion: "NBA 2K27",
  release: "Global launch 2026-09-04",
  checkedAt: "2026-09-12",
  schemaVersion: "20.4.0"
});

const CONFIDENCE_LEVELS = Object.freeze([
  "OFFICIAL",
  "VERIFIED_IN_GAME",
  "VERIFIED_COMMUNITY",
  "PROBABLE",
  "ESTIMATED",
  "UNVERIFIED"
]);

const DATA_PROVENANCE = Object.freeze({
  system: {
    confidence: "OFFICIAL",
    source: "2K Newsroom / 2K Support",
    sourceUrl: "https://nba.2k.com/2k27/courtside-report/myplayer-builder/",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch / current documentation",
    notes: "Officially documented Builder architecture, Badge Tokens, Synergy, Takeover, Build Specialization and HQ/Blueprint features."
  },
  badges: {
    confidence: "VERIFIED_COMMUNITY",
    source: "2KFR / NBA 2K Film Room — NBA 2K27 Badge Requirements",
    sourceUrl: "https://2kfilmroom.com/2k27/badges",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch / public table",
    notes: "53 badge definitions and tier thresholds are aligned with the public 2KFR table. This is an independent community source, not an official 2K publication; values can change with patches and should not be presented as official in-game verification."
  },
  animations: {
    confidence: "PROBABLE",
    source: "Public NBA 2K27 animation tables; source-by-entry verification pending",
    sourceUrl: "",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch",
    notes: "Embedded list is not presented as the complete animation catalog."
  },
  takeovers: {
    confidence: "ESTIMATED",
    source: "Community/internal heuristic",
    sourceUrl: "",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch",
    notes: "Numeric unlock thresholds in the current UI are not claimed to be official."
  },
  caps: {
    confidence: "ESTIMATED",
    source: "Baseline heuristic formulas",
    sourceUrl: "",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch",
    notes: "Body-cap formulas are advisory estimates until a verified 2K27 cap matrix is available."
  },
  capBreakers: {
    confidence: "OFFICIAL",
    source: "2K Support — NBA 2K27 Cap Breakers",
    sourceUrl: "https://support.2k.com/hc/en-us/articles/41938127393683-NBA-2K27-Cap-Breakers",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Current support documentation",
    notes: "Core rules are official: a Cap Breaker can be applied to an attribute at most five times; application is permanent; body dimensions can limit potential."
  },
  synergy: {
    confidence: "OFFICIAL",
    source: "2K Newsroom — MyPLAYER Builder",
    sourceUrl: "https://nba.2k.com/2k27/courtside-report/myplayer-builder/",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch",
    notes: "Official system architecture is documented; exact gameplay outcomes should not be inferred beyond published rules."
  },
  archetypes: {
    confidence: "VERIFIED_COMMUNITY",
    source: "Community/meta references",
    sourceUrl: "",
    checkedAt: "2026-09-12",
    gameVersion: "NBA 2K27",
    patch: "Launch",
    notes: "Archetype labels are descriptive, not official 2K templates."
  }
});

function getDataQuality(key) {
  return DATA_PROVENANCE[key] || {
    confidence: "UNVERIFIED",
    source: "No provenance recorded",
    sourceUrl: "",
    checkedAt: DATA_VERSION.checkedAt,
    gameVersion: DATA_VERSION.gameVersion,
    patch: "",
    notes: ""
  };
}

function dataQualityLabel(key) {
  const q = getDataQuality(key);
  const labels = {
    OFFICIAL: "OFFICIEL",
    VERIFIED_IN_GAME: "VÉRIFIÉ EN JEU",
    VERIFIED_COMMUNITY: "VÉRIFIÉ COMMUNAUTÉ",
    PROBABLE: "PROBABLE",
    ESTIMATED: "ESTIMÉ",
    UNVERIFIED: "NON VÉRIFIÉ"
  };
  return labels[q.confidence] || q.confidence;
}

if (typeof window !== "undefined") {
  window.NBABL_DATA_REGISTRY = { DATA_VERSION, DATA_PROVENANCE, getDataQuality, dataQualityLabel };
}
