# Baseline file manifest

SHA-256 hashes of files from the supplied V12 archive.

- `README-SERVEUR.md` — `4a9ea78db4c68d2b63198fd1ebe0b71c9b3914fff2bfb576d1de7020dd57b406`
- `README.md` — `67e3b173a7ffc418b60dd2bbe18e756151030f106bbe8094be18aa07749a946b`
- `animations.js` — `9793d561cbcc30f06cb3ee8448db2af21641f7a9c5b38863d6e08a37c4afcd07`
- `app.js` — `a7c395f5146e2a5bdba7eecf65ebed46162f119ebf1a49fb6c02b790ffb0cdff`
- `functions/api/_utils.js` — `fb5fd7bf349a03a4c3755daa9949032199e5160a99141558a3478f8fdaaf24fe`
- `functions/api/builds/[id]/comments.js` — `edf2ea43e8829d9103a399d90a791fc32bead6a3ed735581004a67d96c74581e`
- `functions/api/builds/[id]/like.js` — `728219d94abf972a5c0c9dd0ac38defd54d95175faf88c48250b86cb92266449`
- `functions/api/builds/[id].js` — `1ad6167cc463e41573e724b3595659570aa834468d33dc7ad678e1e22bdb1ce2`
- `functions/api/builds.js` — `f4ddf0fa5fccd5ccbd6002d916ea1b53a0713e55086940d071c927ddefd405d8`
- `index.html` — `fdd22c91e873bfe930e7bafaef9fd72de3ae509ae4cce91575433348796ddbe6`
- `schema.sql` — `1226a70b3cd62c55d16e526da156dff8199e4dd0d10416c4fc01500f9209a2ca`
- `server-client.js` — `08504c42242e263638ff07a22f3767866551d5a1939a354e84c3a0721ed3707f`
- `style.css` — `1a1c30e7fdbc071d1921752193b9008ebff60e77ca44737ca864212442db2725`
- `wrangler.toml.example` — `6a0be324d28d5105a3d1737b5bc0ad09b2994c690331f1d4cfbbdafc63f7f78b`


## V18 patch state
- Source baseline: NBA2K27-Build-Lab-V17-2K-BUILDER
- Data governance: explicit OFFICIAL / VERIFIED / PROBABLE / ESTIMATED / UNVERIFIED states
- API: server-side payload validation + rate limiting
- Cap Breakers: per-build localStorage namespace + max 5 per attribute guard
- Client/server validation: client convenience only; server remains authoritative for accepted payload shape

## V20 — Bêta / Mobile Foundation
- Centralisation de la configuration publique du site.
- PWA installable améliorée et service worker V20.
- Métadonnées canonical/Open Graph de base.
- Préparation de l'architecture commune site/app.

## V20.4 — Optimizer
- Added multi-objective heuristic optimizer in `app.js`.
- Optimizer preserves approximately the existing simulated attribute investment while redistributing points toward the selected playstyle.
- Uses embedded badge unlock state and body caps.
- UI reports before/after badge accessibility and changed attributes.
- Explicitly labels optimizer economics as indicative, not official 2K internal Builder costs.
