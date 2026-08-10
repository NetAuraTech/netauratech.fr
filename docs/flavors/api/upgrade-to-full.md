# Upgrading the `api` flavor to `full`

The `api` flavor is headless and CMS-less: it ships no view layer, no session
auth UI, no public site and no page/template/builder module — the whole
(non-CMS) backend is the versioned, token-guarded REST API (`/api/v1/*`).
Choosing it is **not a one-way door**: the flavor is derived from `main` by the
declarative prune manifest at `tooling/prune/flavors/api.manifest.ts` (deleted
on the flavor branch), so every removed artifact is recoverable from the `full`
tree.

This guide is the manual inverse of that manifest. It lists the artifacts to
recover and the flags to flip. There is no tooling — the process is a `git` merge
plus a few manual edits.

## Strategy

Start from the `full` tree (`main`) and either:

1. **Merge `main` into your project** and remove the flavor-specific files you
   replaced, or
2. **Cherry-pick the deleted directories** back onto the flavor branch.

The artifact inventory below mirrors the manifest's `delete` list. Prefer
restoring whole directories over individual files.

## 1. Recover the frontend tree

| Artifact                    | From (`main`)                                    |
| --------------------------- | ------------------------------------------------ |
| Frontend app and pages      | `inertia`                                        |
| Frontend project reference  | `tsconfig.inertia.json`                          |
| Vite / Vitest configs       | `vite.config.ts`, `vitest.config.ts`             |
| Inertia / Vite config files | `config/inertia.ts`, `config/vite.ts`            |
| Inertia middleware          | `app/http/middleware/core/inertia_middleware.ts` |

Then reinstall the packages pruned by the manifest:

```bash
npm install @adonisjs/inertia @adonisjs/vite @inertiajs/react react react-dom \
  sonner html-to-image @iconify/react @fontsource/cormorant-garamond \
  @fontsource/jost @fontsource/playfair-display tailwindcss @tailwindcss/vite
npm install -D @vitejs/plugin-react vite vitest @types/react @types/react-dom
```

## 2. Recover the CMS module and Transmit

The CMS lives on `main` only. Restore it from the `full` tree:

| Artifact                                 | From (`main`)                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| CMS module (page/template/builder)       | `app/cms`                                                                                                            |
| CMS controllers (admin/front/api)        | `app/http/controllers/page`, `app/http/controllers/template`                                                         |
| CMS transformers                         | `app/data/transformers/page`, `app/data/transformers/template`                                                       |
| CMS events, listeners and mails          | `app/events/page`, `app/listeners/page`, `app/mails/page`                                                            |
| CMS i18n payload helpers + preview token | `app/helpers/i18n_payloads/{pages_*,page_editor,page_revisions,templates_*}.ts`, `app/helpers/core/preview_token.ts` |
| CMS migrations and seeders               | `database/migrations/cms`, `database/seeders/{page,template}_seeder.ts`                                              |
| CMS i18n namespaces                      | `resources/lang/{en,fr}/{page,template,builder}.json`                                                                |
| Contact email template                   | `resources/views/emails/contact_form_email.edge`                                                                     |
| CMS route modules                        | `start/routes/cms_admin.routes.ts`, `cms_public.routes.ts`, `cms_rest_api.routes.ts`                                 |
| Transmit integration                     | `start/transmit.ts`, `config/transmit.ts`, `config/cms.ts`                                                           |

Reinstall the pruned Transmit packages:

```bash
npm install @adonisjs/transmit @adonisjs/transmit-client
```

## 3. Recover the session auth, admin UI and public site

| Artifact                             | From (`main`)                                                    |
| ------------------------------------ | ---------------------------------------------------------------- |
| Guest/session auth controllers       | `app/http/controllers/auth/front`, `auth/admin`                  |
| Self-service (account/profile/prefs) | `app/http/controllers/{account,profile,preferences}/front`       |
| Admin Inertia controllers            | `app/http/controllers/{core,file,log,maintenance}/admin`         |
| Home + SEO controllers               | `app/http/controllers/core/front`                                |
| Public route modules                 | `start/routes/{front,core_public,settings,admin,auth}.routes.ts` |

## 4. Restore the composition rewrites

The flavor rewrites several allowlisted composition files. Restore the `main`
version of each:

- `config/features.ts` — re-enables `auth`, `settings`, `admin` and `cms` (the
  `api` flavor keeps only `adminApi`).
- `start/routes.ts` — re-registers the auth, settings, admin, CMS and public
  route modules (including the CMS admin REST via `registerCmsRestApiRoutes`).
- `config/database.ts` — re-adds `database/migrations/cms` to the migration
  paths.
- `config/shield.ts` — restores the CMS iframe `frame-src` hosts.
- `start/events.ts` — re-registers the page event/listener pairs.
- `start/nav.ts` / `start/dashboard.ts` / `start/sitemap.ts` — re-registers the
  page/template contributions.
- `start/container.ts` — re-binds the CMS services.
- `config/cors.ts` — restores the default dev-origin policy (the `api` flavor
  rewrote it to read `CORS_ALLOWED_ORIGINS`).
- `start/asset_middleware.ts` — restores the Vite + Inertia server middleware.
- `start/env.ts` — restores the environment variables stripped by the prune
  (the CORS var is harmless to keep).
- `.env.example` — restores `AUTH_GUARD_WEB=true` / `AUTH_GUARD_API=false` so
  session login works again.
- `adonisrc.ts` — restores the Inertia/Vite/Transmit providers, commands and
  preloads, `indexPages`, the Vite `buildStarting` hook, and
  `withSharedProps: true`.
- `package.json` — restores the front scripts (`test:front`, the Inertia
  typecheck reference) and the deps listed in steps 1 and 2.
- `tsconfig.json` — restores the `tsconfig.inertia.json` project reference and
  the `jsx` compiler option.
- `README.md` — restore the `full` README (or keep the flavor one).

## 5. Restore the pruned tests

| Artifact                        | From (`main`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Browser E2E suite               | `tests/browser`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Inertia-page functional suites  | `tests/functional/dashboard`, `tests/functional/maintenance`                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| CMS functional suite            | `tests/functional/cms`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| SEO endpoint suites             | `tests/functional/core/seo_endpoints.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Full-router structure snapshots | `tests/integration/routes_structure.spec.ts`, `tests/integration/routes_structure_cms.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                                                |
| CMS unit/integration suites     | `tests/unit/actions/{page,template,cms}`, `tests/unit/models/{page,template}`, `tests/unit/services/{page,template,cms}`, `tests/unit/validators/{page,template,builder,contact}_validator.spec.ts`, `tests/unit/exceptions_cms.spec.ts`, `tests/unit/mails/notifications_cms.spec.ts`, `tests/unit/helpers/core/preview_token.spec.ts`, `tests/integration/repositories/{page,page_translation,page_revision,template}_repository.spec.ts`, `tests/integration/services/page/page_sitemap_collector.spec.ts` |
| Playwright-only test helpers    | `tests/helpers/browser/{login,visit_page,fill_field,field_is_filled,seed_dashboard,wait_for_builder_ready,wait_for_inertia_response}.ts`                                                                                                                                                                                                                                                                                                                                                                      |

## 6. Regenerate the codegen

The flavor deletes `.adonisjs` (generated indexes). Restarting the dev server
regenerates it against the now-full source tree:

```bash
npm run dev
```

## Acceptance check

After the upgrade, run the full gate suite:

```bash
npm run lint && npm run format && npm run typecheck && npm run test:front
npm run test -- unit integration functional
```

The login page is back at `/login`, the admin at `/admin`, `/admin/pages` and
`/admin/templates` are reachable, and the public site renders pages again —
while `/api/v1/*` keeps working.
