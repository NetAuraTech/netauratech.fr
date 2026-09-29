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

All artifact paths below are relative to the app workspace `apps/web/` — on the
flavor branch, the complete application lives there; the repo root holds the
workspaces manifest, the prune tooling, CI and docs. The one exception is the
design-system package, which lives at the repo root (`packages/design-system`)
and is flagged as such in step 1. `node ace` commands run from `apps/web/`.

## 1. Recover the frontend tree

| Artifact                    | From (`main`)                               |
| --------------------------- | ------------------------------------------- |
| Frontend app and pages      | `inertia`                                   |
| Frontend project reference  | `tsconfig.inertia.json`                     |
| Vite / Vitest configs       | `vite.config.ts`, `vitest.config.ts`        |
| Inertia / Vite config files | `config/inertia.ts`, `config/vite.ts`       |
| Inertia middleware          | `app/core/middleware/inertia_middleware.ts` |

Then reinstall the packages pruned by the manifest (into the app workspace):

```bash
cd apps/web
npm install @adonisjs/inertia @adonisjs/vite @inertiajs/react react react-dom \
  sonner html-to-image @iconify/react @fontsource/cormorant-garamond \
  @fontsource/jost @fontsource/playfair-display tailwindcss @tailwindcss/vite
npm install -D @vitejs/plugin-react vite vitest @types/react @types/react-dom
```

The design-system workspace package was pruned wholesale (it is the only
package under `packages/`). Restore it from `main` — this path is relative to
the **repo root**, not the app workspace:

```bash
git checkout main -- packages/design-system
```

The root `workspaces` glob already covers `packages/*` (the field is
flavor-invariant, so the flavor's root `package.json` needs no edit). Re-add
the app workspace's dependency on it — it is a private, source-only workspace
package, so restore the entry in `apps/web/package.json` by hand (the manifest
pruned it by name from the frozen rewrite):

```jsonc
// apps/web/package.json → "dependencies": add back
"@foundry/design-system": "^2.0.0",
```

then run a bare `npm install` in the repo root so npm re-links the workspace
package locally and re-syncs the lock file.

## 2. Recover the CMS module and Transmit

The CMS lives on `main` only. Restore it from the `full` tree:

| Artifact                                                                                                       | From (`main`)                                              |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| CMS business layer (actions, services, repositories, models, exceptions, queries, types, permissions)          | `src/cms`                                                  |
| CMS transport layer (controllers, routes, nav, i18n payload helpers, transformers, REST resources, validators) | `app/cms`                                                  |
| CMS migrations                                                                                                 | `database/migrations/cms`                                  |
| CMS seeders                                                                                                    | `database/seeders/cms`                                     |
| CMS factories                                                                                                  | `database/factories/cms`                                   |
| CMS i18n namespaces (page, template, builder)                                                                  | `resources/lang/{en,fr}/cms`                               |
| Contact email template                                                                                         | `resources/views/emails/contact_form_email.edge`           |
| CMS ace command (migration-name normalization)                                                                 | `commands/cms_normalize_migration_names.ts`                |
| Transmit integration                                                                                           | `start/transmit.ts`, `config/transmit.ts`, `config/cms.ts` |

Reinstall the pruned Transmit packages (into the app workspace):

```bash
cd apps/web
npm install @adonisjs/transmit @adonisjs/transmit-client
```

## 3. Recover the inbound webhook module

The webhook module is `main`-only (the headless flavor prunes it entirely).
Restore it from the `full` tree:

| Artifact                                                                                           | From (`main`)                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Webhook business layer (actions, models, queries, services, jobs, permissions)                     | `src/webhook`                         |
| Webhook transport layer (receiver, delivery-log admin + REST controllers, routes, nav, validators) | `app/webhook`                         |
| Webhook configuration                                                                              | `config/webhooks.ts`                  |
| Webhook migration (`webhook_deliveries`)                                                           | `database/migrations/webhook`         |
| Webhook factories                                                                                  | `database/factories/webhook`          |
| Webhook i18n                                                                                       | `resources/lang/{en,fr}/webhook.json` |

No package install is needed — the module rides on the already-kept
`@adonisjs/queue`. After restoring the files, run
`node ace migration:run` so the `webhook_deliveries` table is created, and
point the production worker at the `webhook` queue (it is already listed in
the `docker-compose.prod.yml` queue set). The receiver stays disabled until
`WEBHOOK_SECRET` is set.

## 4. Recover the session auth, admin UI and public site

| Artifact                                | From (`main`)                                         |
| --------------------------------------- | ----------------------------------------------------- |
| Guest/session auth controllers          | `app/auth/controllers/front`                          |
| Self-service (account/profile/prefs)    | `app/account/controllers/front`                       |
| Admin Inertia controllers               | `app/{core,identity,file,log}/controllers/admin`      |
| Domain route entries (self-registering) | `app/{auth,account,core,identity,file,log}/routes.ts` |
| Home + SEO controllers                  | `app/core/controllers/front`                          |

The `app/identity`, `app/file` and `app/log` domains (including their admin
Inertia controllers) are **kept** by the `api` flavor — their admin routes are
simply gated off by `admin: false` in `config/features.ts`, and the pruned
pieces (`app/identity/routes.ts`, `app/file/routes.ts`, `app/log/routes.ts`,
the `app/*/controllers/admin` trees) are the only things to restore from
`main`.

## 5. Restore the composition rewrites

The flavor rewrites several allowlisted composition files. Restore the `main`
version of each:

- `config/features.ts` — re-enables `auth`, `settings`, `admin` and `cms` (the
  `api` flavor keeps only `adminApi`).
- `start/routes.ts` — restores the pure per-domain import list, which
  re-registers the CMS domain entry (`#transport/cms/routes`) and the webhook
  domain entry (`#transport/webhook/routes`) alongside the other
  domain entries.
- `config/database.ts` — re-adds `database/migrations/cms` to the migration
  paths.
- `config/shield.ts` — restores the CMS iframe `frame-src` hosts.
- `start/nav.ts` — re-registers the CMS (`#transport/cms/nav`) and webhook
  (`#transport/webhook/nav`) admin menu entries.
- `start/permissions.ts` — re-spreads the `cmsPermissionCatalog`
  (`#cms/permissions`) and the `webhookPermissionCatalog`
  (`#webhook/permissions`).
- `start/dashboard.ts` / `start/sitemap.ts` — re-registers the page/template
  contributions.
- `start/container.ts` — re-binds the builder session service.
- `config/cors.ts` — restores the default dev-origin policy (the `api` flavor
  rewrote it to read `CORS_ALLOWED_ORIGINS`).
- `start/asset_middleware.ts` — restores the Vite + Inertia server middleware.
- `start/env.ts` — restores the environment variables stripped by the prune
  (`WEBHOOK_SECRET` / `WEBHOOK_REPLAY_WINDOW`, the CMS content-policy vars;
  the CORS var is harmless to keep).
- `.env.example` — restores `AUTH_GUARD_WEB=true` / `AUTH_GUARD_API=false` so
  session login works again, plus the `WEBHOOK_SECRET` /
  `WEBHOOK_REPLAY_WINDOW` and CMS content-policy variables.
- `adonisrc.ts` — restores the Inertia/Vite/Transmit providers, commands and
  preloads, `indexPages`, the Vite `buildStarting` hook, and
  `withSharedProps: true`.
- `apps/web/package.json` — restores the front scripts (`test:front`, the
  Inertia typecheck reference) and the deps listed in steps 1 and 2, including
  the `@foundry/design-system` workspace dependency.
- `apps/web/tsconfig.json` — restores the `tsconfig.inertia.json` project
  reference and the `jsx` compiler option.
- `README.md` — restore the `full` README (or keep the flavor one).

## 6. Restore the pruned tests

| Artifact                             | From (`main`)                                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session-auth functional suites       | `tests/functional/auth/{accept_invitation,email_verification,forgot_password,oauth,password_reset_queue,register,reset_password,session,token_consume,two_factor}.spec.ts`, `tests/functional/account/email_change.spec.ts`, `tests/functional/log` |
| Inertia-page + SEO functional suites | `tests/functional/core` (dashboard, maintenance, SEO endpoints, OpenAPI docs specs)                                                                                                                                                                 |
| CMS functional suite                 | `tests/functional/cms`                                                                                                                                                                                                                              |
| Webhook suites                       | `tests/unit/webhook`, `tests/integration/webhook`, `tests/functional/webhook`                                                                                                                                                                       |
| Page-adapter unit suite              | `tests/unit/core/rest/page_adapter.spec.ts`                                                                                                                                                                                                         |
| Full-router structure snapshot       | `tests/integration/routes_structure.spec.ts`                                                                                                                                                                                                        |
| CMS unit/integration suites          | `tests/unit/cms`, `tests/integration/cms`                                                                                                                                                                                                           |

## 7. Regenerate the codegen

The flavor deletes `.adonisjs` (generated indexes). Regenerate it against the
now-full source tree:

```bash
cd apps/web
node ace codegen
```

## Acceptance check

After the upgrade, run the full gate suite:

```bash
npm run lint && npm run format && npm run typecheck && npm run test:front
npm run test -- unit integration functional
```

The login page is back at `/login`, the admin at `/admin`, `/admin/pages` and
`/admin/templates` are reachable, and the public site renders pages again —
while `/api/v1/*` keeps working. With `WEBHOOK_SECRET` set,
`POST /webhooks/:receiver` answers and the delivery log is browsable at
`/admin/webhooks/deliveries`.
