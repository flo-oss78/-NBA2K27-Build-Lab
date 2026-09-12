# V18 Correctifs

## Base
V18 is built from `NBA2K27-Build-Lab-V17-2K-BUILDER`.

## Integrity
- Strict attribute allowlist (22 Builder attributes).
- Position/body dimension range checks.
- Numeric count bounds.
- Server ignores client `validated` flag.
- Server rejects unknown attributes.

## Abuse prevention
- Per-minute D1 bucket rate limits:
  - build creation: 10/min
  - comments: 10/min
  - likes: 30/min

## Cap Breakers
- Local storage keys are namespaced by position/height/weight/wingspan.
- Each attribute remains capped at 5 stored Cap Breakers.
- No undocumented boost amount is invented.

## Data quality
- Provenance fields are explicit.
- UI distinguishes official rules from probable/estimated gameplay data.
- Body caps remain labeled estimated until a verified 2K27 cap matrix exists.

## Compatibility
Existing local community builds and server API shape remain compatible. The only
new D1 requirement is the `api_rate_limits` table; run the included migration
before deploying the hardened API.

## V19 — Pré-lancement
- Isolation des états locaux par build.
- Correction des compteurs publiés et du statut de validation.
- Ajout PWA/offline shell.
- Préparation robots/sitemap.
