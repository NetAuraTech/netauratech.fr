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

## 1. Recover the CMS module

| Artifact                                      | From (`main`)                                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| CMS module (page/template/builder internals)  | `app/cms`                                                                                       |
| CMS controllers (page + template)             | `app/http/controllers/page`, `app/http/controllers/template`                                    |
| CMS transformers (page + template)            | `app/data/transformers/page`, `app/data/transformers/template`                                  |
| CMS events and listeners                      | `app/events/page`, `app/listeners/page`                                                         |
| CMS mail (contact form)                       | `app/mails/page`                                                                                |
| CMS i18n payload helpers                      | `app/helpers/i18n_payloads/pages_*.ts`, `page_editor.ts`, `page_revisions.ts`, `templates_*.ts` |
| Preview-token helper                          | `app/helpers/core/preview_token.ts`                                                             |
| CMS migrations                                | `database/migrations/cms`                                                                       |
| CMS seeders                                   | `database/seeders/page_seeder.ts`, `database/seeders/template_seeder.ts`                        |
| CMS i18n namespaces                           | `resources/lang/{en,fr}/page.json`, `{en,fr}/template.json`, `{en,fr}/builder.json`             |
| CMS email template (contact form)             | `resources/views/emails/contact_form_email.edge`                                                |
| CMS route files                               | `start/routes/cms_admin.routes.ts`, `cms_public.routes.ts`                                      |
| CMS React subtrees (builder, renderer, pages) | `inertia/pages/cms`, `inertia/components/cms`                                                   |

## 2. Recover Transmit (real-time builder collaboration)

| Artifact                  | From (`main`)        |
| ------------------------- | -------------------- |
| Startup channel file      | `start/transmit.ts`  |
| Provider configuration    | `config/transmit.ts` |
| CMS content policy config | `config/cms.ts`      |

Then reinstall the packages pruned by the manifest:

```bash
npm install @adonisjs/transmit @adonisjs/transmit-client
```

## 3. Run migrations

The flavor only ever created tables for the kept domains. Once the CMS
migrations are restored, create the page/template tables:

```bash
node ace migration:run
```

This runs `database/migrations/cms/*` (pages, page_translations,
page_revisions, templates, and the `cms` folder's other tables).

## 4. Flip the feature flag

The flavor rewrites `config/features.ts` with `cms: false`. Restore the `full`
version (or set `cms: true`) to re-enable the CMS route module.

## 5. Restore the composition rewrites

The flavor rewrites several startup/composition files to drop CMS
registrations. Restore the `main` version of each:

- `start/routes.ts` — re-registers the `cms_public` and `cms_admin` route modules (the CMS admin JSON API is part of the shared `admin_rest_api` surface).
- `start/events.ts` — re-registers the page event/listener pairs.
- `start/nav.ts` — re-adds the **Pages** and **Templates** admin menu entries.
- `start/dashboard.ts` — re-registers the `page` and `template` dashboard collectors.
- `start/sitemap.ts` — re-registers the page sitemap collector.
- `start/container.ts` — re-binds the CMS services.
- `config/database.ts` — re-adds `database/migrations/cms` to the migration paths.
- `config/shield.ts` — restores the CMS iframe `frame-src` hosts.
- `start/env.ts` — restores `CMS_IFRAME_ALLOWLIST` and `CMS_VIDEO_PROVIDERS`.
- `.env.example` — restores the CMS content-policy variables.
- `adonisrc.ts` — restores the Transmit provider and preload.
- `README.md` — restore the `full` README (or keep the flavor one).

## 6. Restore the CMS tests

The flavor deletes the CMS test suites. Recover from `main`:

- `tests/unit/actions/page`, `tests/unit/actions/template`
- `tests/unit/models/page`, `tests/unit/models/page.spec.ts`,
  `tests/unit/models/page_translation.spec.ts`, `tests/unit/models/template`
- `tests/unit/services/page`, `tests/unit/services/template`
- `tests/unit/validators/page_validator.spec.ts`, `tests/unit/validators/template_validator.spec.ts`
- `tests/integration/repositories/{page,page_translation,page_revision,template}_repository.spec.ts`
- `tests/integration/services/page/page_sitemap_collector.spec.ts`
- `tests/integration/routes_structure_cms.spec.ts`
- `tests/browser/builder`, `tests/browser/template`, `tests/browser/cms`
- `tests/functional/cms`, `tests/unit/exceptions_cms.spec.ts`,
  `tests/unit/actions/cms`, `tests/unit/services/cms`,
  `tests/unit/mails/notifications_cms.spec.ts`,
  `tests/unit/validators/{builder,contact}_validator.spec.ts`
- `tests/helpers/browser/wait_for_builder_ready.ts`, `tests/helpers/browser/seed_dashboard.ts`
- `tests/unit/helpers/core/preview_token.spec.ts`

## 7. Regenerate the codegen

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

The dashboard shows the page/template cards again, `/admin/pages` and
`/admin/templates` are reachable, and the sitemap includes the page routes.
