# NetAuraTech — `netauratech.fr`

The public website of NetAuraTech, a web-development studio, and its admin
back-office. Built on the Foundry 2.0 baseline (AdonisJS v7 + Inertia/React,
the `inertia` flavor of `adonisjs-foundry` v2.0.0).

## What is in the repo

- **Content-driven public front** — `/`, `/projets`, `/projets/:slug`,
  `/services`, plus `sitemap.xml` and `robots.txt`. Hand-written Inertia pages
  fed by committed markdown under `apps/web/content/` — no CMS, no database
  pages.
- **Admin back-office** — dashboard, users, roles, permissions, files, logs,
  maintenance, settings (profile, account, preferences).
- **Full auth flow** — registration, login, email verification, password
  reset, 2FA with recovery codes, OAuth (GitHub, Google, Facebook),
  invitations.
- **File management** — upload, folders, multi-disk storage (local, S3, R2),
  responsive image variants (400/800/1200/1600), and server-side URL
  resolution for the hand-written pages.
- **Backups** — scheduled `pg_dump` (full + differential), in-place
  sanitization, AES-256-GCM encryption, retention and restore, on a dedicated
  disk (including a private R2 bucket).
- **SEO** — dynamic `sitemap.xml` (route + project collectors) and
  `robots.txt`.

## Content workflow

Projects and services are committed markdown files:

- `apps/web/content/projects/{slug}.md` — frontmatter `order`, `cover`
  (backend file id), `rubrique`, `title`, `note`; a story body with `:::`
  fenced blocks (`lede`, `features`, `quote`, `gallery`, `metrics`) and `##`
  chapters.
- `apps/web/content/services/{slug}.md` — frontmatter `order`, `rubrique`,
  `items`; a description body with trailing `**Inclus** :` / `**Tarif** :`
  fact lines.

Adding a project is dropping a file: the shared `core.projects.show.render`
route and the projects sitemap collector pick it up with no code change.

## Repository layout

Two-workspace npm monorepo (Node >= 24, single lockfile at the root):

- `apps/web/` (`@foundry/web`) — the AdonisJS application: `src/` business
  layer (per-domain BFF), `app/` transport layer, `inertia/` frontend,
  `content/` site content, config, database, providers, ace commands, tests.
- `packages/design-system/` (`@foundry/design-system`) — source-only React
  design-system package (tokens + components) consumed by the app.

`node ace` commands run from `apps/web/`; the npm scripts run from the repo
root (they proxy to the workspace).

## Quick start

```bash
npm install
cp apps/web/.env.example apps/web/.env
docker compose up -d        # PostgreSQL, Redis, mailhog (root)
cd apps/web
node ace generate:key
node ace migration:run
npm run dev
```

The app is available at `http://localhost:3333` (the site); the admin is at
`/admin`.

Key env vars (full list in `apps/web/.env.example`): `APP_URL`, `PG_*`,
`REDIS_*`, `DRIVE_DISK` (`fs` | `s3` | `r2`), `R2_*` + `R2_PUBLIC_URL`,
`BACKUP_STORAGE_DISK` (incl. the private `r2-backup` disk), `MAIL_*`.

## Available scripts (repo root)

| Script               | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start the dev server with HMR            |
| `npm run build`      | Build for production                     |
| `npm start`          | Start the production server              |
| `npm test`           | Run the backend tests (Japa)             |
| `npm run test:front` | Run the frontend tests (Vitest)          |
| `npm run lint`       | Lint with oxlint                         |
| `npm run format`     | Format with oxfmt                        |
| `npm run typecheck`  | Type-check backend, frontend and package |

## Docs

- `AGENTS.md` — agent conventions for the whole repo.
- `docs/agents/` — per-layer conventions (controllers, actions, services,
  repositories, queries, models, …).
- `CONTEXT.md` — the domain glossary.
- `DESIGN.md` — the visual system of the public site.
- `PRODUCT.md` — the product brief (users, positioning, commitments).
