# Development Guide

## Before changing code

1. Read the existing implementation.
2. Identify the exact user-visible behavior being changed.
3. Check dependencies between builder, scoring, animations, badges and server.
4. Make the smallest coherent change.
5. Test desktop and mobile behavior.
6. Check that the community API still works.
7. Review the diff before committing.

## Suggested branch naming

- `feature/builder-...`
- `feature/data-...`
- `feature/community-...`
- `fix/...`
- `refactor/...`

## Production rule

`main` should contain deployable, reviewed code. Large experiments belong in
feature branches.
