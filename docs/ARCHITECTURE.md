# Architecture — Current Baseline

## Frontend

The current package is a lightweight static web application:
- `index.html`
- `style.css`
- `app.js`
- `animations.js`
- `server-client.js`

No package manager configuration is present in the supplied baseline, so no
framework or build dependency should be assumed without inspecting the code.

## Backend

Cloudflare Pages Functions live under:
`functions/api/`

Current API areas:
- builds
- build detail
- likes
- comments

## Database

`schema.sql` defines the D1 schema for:
- builds
- build likes
- comments

## Configuration

`wrangler.toml.example` is a deployment template. A real D1 database ID must
be supplied only in the deployment environment and must not be committed as
a secret/configuration accident.

## Baseline principle

Keep the current frontend/API working while introducing improvements in small,
testable increments.
