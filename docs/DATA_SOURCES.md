# NBA 2K27 Data Sources Policy

The current project contains game-data logic that must be audited.

## Priority

1. Official NBA 2K / 2K support and official patch information
2. High-quality specialist NBA 2K resources
3. Community reports, clearly labeled as community-derived

## Required metadata for future verified datasets

Recommended fields:
- `source`
- `sourceUrl`
- `checkedAt`
- `gameVersion`
- `patch`
- `confidence`
- `notes`

## Never silently convert an estimate into a fact

If a threshold, cap, animation requirement, badge threshold, takeover rule,
or Cap Breaker rule is not verified, mark it as unknown/indicative rather than
presenting it as official.
