# NBA Build Lab V13 — Data Model

V13 introduces a data-governance layer before importing larger verified datasets.

## Confidence
- `OFFICIAL` — directly documented by 2K.
- `VERIFIED_IN_GAME` — checked against the game.
- `VERIFIED_COMMUNITY` — independently reproduced by reliable community sources.
- `PROBABLE` — supported by multiple sources but not individually confirmed.
- `ESTIMATED` — heuristic/community estimate; never treated as authoritative.
- `UNVERIFIED` — insufficient evidence.

## Rule
Missing or uncertain values must remain `null` rather than being invented. Every future badge, animation, takeover, cap, synergy and breakpoint entry should carry provenance: `source`, `sourceUrl`, `checkedAt`, `gameVersion`, `patch`, `confidence`, and `notes`.

## V13 baseline changes
- Badge counter now reports total dataset size rather than unlocked count.
- Animation counter now reports total filtered dataset size rather than unlocked count.
- Added `data-registry.js` as a non-invasive provenance/governance layer.
- Existing gameplay heuristics are intentionally preserved until verified replacement datasets are available.
