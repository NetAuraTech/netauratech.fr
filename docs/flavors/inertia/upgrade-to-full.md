# Upgrading the `inertia` flavor to `full`

The `inertia` flavor ships without the dynamic page CMS, the visual page builder,
the template system, and the Transmit real-time layer. Choosing it is **not a
one-way door**: the flavor is derived from `main` by the declarative prune
manifest at `tooling/prune/flavors/inertia.manifest.ts` (deleted on the flavor
branch), so every removed artifact is recoverable from the `full` tree.

This guide is the manual inverse of that manifest. It lists the artifacts to
recover, the migrations to run, and the flags to flip. There is no tooling — the
process is a `git` merge plus a few manual edits.

## Strategy

Start from the `full` tree (`main`) and either:

1. **Merge `main` into your project** and remove the flavor-specific files you
   replaced, or
2. **Cherry-pick the deleted directories** back onto the flavor branch.

The artifact inventory below mirrors the manifest's `delete` list. Prefer
restoring whole directories over individual files.

All artifact paths below are relative to the app workspace `apps/web/` — on the
flavor branch, the complete application lives there; the repo root holds the
workspaces manifest, the prune tooling, CI and docs. `node ace` commands run
from `apps/web/`.

## 1. Recover the CMS module

| Artifact                                                                                                       | From (`main`)                                    |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| CMS business layer (actions, services, repositories, models, exceptions, queries, types, permissions)          | `src/cms`                                        |
| CMS transport layer (controllers, routes, nav, i18n payload helpers, transformers, REST resources, validators) | `app/cms`                                        |
| CMS migrations                                                                                                 | `database/migrations/cms`                        |
| CMS seeders                                                                                                    | `database/seeders/cms`                           |
| CMS factories                                                                                                  | `database/factories/cms`                         |
| CMS i18n namespaces (page, template, builder)                                                                  | `resources/lang/{en,fr}/cms`                     |
| CMS email template (contact form)                                                                              | `resources/views/emails/contact_form_email.edge` |
| CMS ace command (migration-name normalization)                                                                 | `commands/cms_normalize_migration_names.ts`      |
| CMS React subtrees (builder, renderer, pages)                                                                  | `inertia/pages/cms`, `inertia/components/cms`    |

## 2. Recover Transmit (real-time builder collaboration)

| Artifact                  | From (`main`)        |
| ------------------------- | -------------------- |
| Startup channel file      | `start/transmit.ts`  |
| Provider configuration    | `config/transmit.ts` |
| CMS content policy config | `config/cms.ts`      |

Then reinstall the packages pruned by the manifest (into the app workspace):

```bash
cd apps/web
npm install @adonisjs/transmit @adonisjs/transmit-client
```

## 3. Recover the inbound webhook module

The webhook module is `main`-only (the flavor prunes it entirely). Restore it
from the `full` tree:

| Artifact                                                                                           | From (`main`)                         |
| -------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Webhook business layer (actions, models, queries, services, jobs, permissions)                     | `src/webhook`                         |
| Webhook transport layer (receiver, delivery-log admin + REST controllers, routes, nav, validators) | `app/webhook`                         |
| Webhook admin pages (delivery log)                                                                 | `inertia/pages/webhook`               |
| Webhook configuration                                                                              | `config/webhooks.ts`                  |
| Webhook migration (`webhook_deliveries`)                                                           | `database/migrations/webhook`         |
| Webhook factories                                                                                  | `database/factories/webhook`          |
| Webhook i18n                                                                                       | `resources/lang/{en,fr}/webhook.json` |

No package install is needed — the module rides on the already-kept
`@adonisjs/queue`. The receiver stays disabled until `WEBHOOK_SECRET` is set.

## 4. Run migrations

The flavor only ever created tables for the kept domains. Once the CMS
migrations are restored, create the page/template tables:

```bash
cd apps/web
node ace migration:run
```

This runs `database/migrations/cms/*` (pages, page_translations,
page_revisions, templates, and the `cms` folder's other tables) and, if the
webhook module was restored, `database/migrations/webhook/*` (the
`webhook_deliveries` table).

## 5. Flip the feature flag

The flavor rewrites `config/features.ts` with `cms: false`. Restore the `full`
version (or set `cms: true`) to re-enable the CMS route module.

## 6. Restore the composition rewrites

The flavor rewrites several startup/composition files to drop CMS
registrations. Restore the `main` version of each:

- `start/routes.ts` — restores the `full` domain-entry list, which re-registers the CMS
  domain entry (`#transport/cms/routes`) and drops the flavor's static home route
  (`registerCoreHomeRoute`) — the CMS page home takes over the site root as
  `core.home.render`.
- `start/nav.ts` — re-adds the **Pages** and **Templates** admin menu entries (`#transport/cms/nav`) and the **Webhooks** delivery-log entry (`#transport/webhook/nav`).
- `start/permissions.ts` — re-spreads the `cmsPermissionCatalog` (`#cms/permissions`) and the `webhookPermissionCatalog` (`#webhook/permissions`).
- `start/dashboard.ts` — re-registers the `page` and `template` dashboard collectors.
- `start/sitemap.ts` — re-registers the page sitemap collector.
- `start/container.ts` — re-binds the builder session service.
- `config/database.ts` — re-adds `database/migrations/cms` to the migration paths.
- `config/shield.ts` — restores the CMS iframe `frame-src` hosts.
- `start/env.ts` — restores `CMS_IFRAME_ALLOWLIST`, `CMS_VIDEO_PROVIDERS` and the `WEBHOOK_SECRET` / `WEBHOOK_REPLAY_WINDOW` variables.
- `.env.example` — restores the CMS content-policy and webhook variables.
- `adonisrc.ts` — restores the Transmit provider and preload.
- `README.md` — restore the `full` README (or keep the flavor one).

## 7. Restore the pruned tests

The flavor deletes the CMS and webhook test suites. Recover from `main`:

- `tests/unit/cms`, `tests/integration/cms`, `tests/functional/cms`
- `tests/unit/webhook`, `tests/integration/webhook`, `tests/functional/webhook`

## 8. Regenerate the codegen

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

The dashboard shows the page/template cards again, `/admin/pages` and
`/admin/templates` are reachable, and the sitemap includes the page routes.
With `WEBHOOK_SECRET` set, `POST /webhooks/:receiver` answers and the delivery
log is browsable at `/admin/webhooks/deliveries`.
