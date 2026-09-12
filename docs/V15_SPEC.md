# NBA 2K27 Build Lab — V15 Product Specification

## Goal
Make the Builder understandable in seconds for a new player while preserving the existing advanced tools.

## Core flow
**Créer → Comprendre → Optimiser → Comparer → Valider**

## Category language
- 🔵 Finition
- 🟢 Tir
- 🟠 Organisation / Playmaking
- 🔴 Défense
- 🟣 Physique
- ⚪ Neutral / global

The category colors are semantic and are used consistently in V15. Finition is blue, never yellow.

## V15 Build Intelligence
- Build identity based on the five Builder categories.
- Category score cards.
- Next meaningful unlocks based on the embedded badge thresholds when a single attribute is the blocker.
- One-click jump to the blocking attribute.
- Simple / Expert mode.
- Top 5 NBA 2K27 reference players.
- Similarity combines five published category axes, body profile, and position compatibility.
- Explainable “Pourquoi ce résultat ?” details.

## Player data policy
Player profiles added in `players-core.js` are sourced from 2KRatings NBA 2K27 pages and include provenance. They are reference profiles, not MyPLAYER templates. The tool must never claim an exact reproduction of a real player.

Missing or unverified data must remain `null`/unverified rather than invented.

## Next phases
1. Expand the verified player dataset to the full roster.
2. Add full provenance to every badge/animation/cap rule.
3. Integrate verified animation and Cap Breaker datasets.
4. Build the multi-objective optimizer after data coverage is sufficient.
5. SEO/custom domain remain later release work.
