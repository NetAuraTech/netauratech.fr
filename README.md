# AdonisJS Foundry — `inertia` flavor

A production-ready AdonisJS v7 boilerplate with a hand-written Inertia.js + React
front and a full admin back-office — without the dynamic page CMS, visual
builder, or template system. This flavor is for projects that want a solid
auth + admin foundation and their own hand-crafted pages.

## What is included

- **Admin back-office** — dashboard, users, roles, permissions, files, logs,
  maintenance, settings (profile, account, preferences).
- **Full auth flow** — registration, login, logout, email verification, password
  reset, OAuth (GitHub, Google, Facebook), invitations, define-password.
- **File management** — upload, folders, multi-disk storage (local, S3, R2),
  image optimization, and server-side file resolution for hand-written pages.
- **SEO** — dynamic `sitemap.xml` and `robots.txt`. Every `core.*.render`
  route is collected automatically.
- **Minimal front shell** — a blank home page and error pages, each served by
  its own controller.

Explicitly **not** included: the page domain, template domain, and the Transmit
real-time integration (page builder only).

## Conventions

The flavor is self-documenting by construction — the files you open first are
the pattern to follow:

- **One controller per page.** Each public page is served by a dedicated
  controller in the `core` domain (`app/core/controllers/front/`), keeping
  the controller thin and delegating to services.
- **`core.*.render` route names.** Public routes are declared in the core
  domain entry (`app/core/routes.ts` for the home, the surface files for
  the SEO endpoints) and named `core.home.render`, `core.about.render`, ...
  so the sitemap collector and your frontend links reference them
  consistently.
- **Hand-written Inertia pages.** Front pages live under
  `inertia/pages/core/front/` and use the public layout; error pages under
  `inertia/pages/errors/`.
- **i18n.** Each page resolves its labels from an `en`/`fr` namespace
  (`resources/lang/{en,fr}/home.json`) and renders through `useTranslation`
  — see `inertia/pages/core/front/home.tsx`.
- **Media library in your pages.** Resolve files on the server with the
  `FindFileAction` and render them with `<FileImage>` instead of hand-building
  storage URLs.
- **Data-driven dashboard.** The admin dashboard renders exactly the sections
  present in the payload; the kept domains (users, files) register their cards
  in the client-side section registry.

## Quick start

```bash
npm install
cp .env.example .env
node ace generate:key
node ace migration:run
npm run dev
```

The app is available at `http://localhost:3333`. The admin is at `/admin`.

## Upgrade path to `full`

Choosing this flavor is not a one-way door. See
`docs/flavors/inertia/upgrade-to-full.md` for the documented manual path to
recover the CMS, the builder, and Transmit later.

## Available scripts

| Script              | Description                     |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server with HMR   |
| `npm run build`     | Build for production            |
| `npm start`         | Start the production server     |
| `npm test`          | Run tests (Japa)                |
| `npm run lint`      | Run oxlint                      |
| `npm run format`    | Format code with oxfmt          |
| `npm run typecheck` | Type-check backend and frontend |
