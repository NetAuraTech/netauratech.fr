# ADR-0001: CMS Module Extraction & Admin Terminology

Date: 2026-08-07
Status: accepted

## Context

The Multi-Flavor Installer (tracking issue #9) derives flavor branches from `main` via a declarative prune manifest (#4): the `inertia` flavor prunes the `page` and `template` domains, the `api` flavor prunes the entire Inertia stack. Two problems surfaced before writing the pipeline:

1. **Terminology.** The `cms` context label (controllers `app/http/controllers/{domain}/cms/`, Inertia pages, i18n namespace) actually means "the whole admin back-office" — users, roles, permissions, settings, logs. That is not content management; only page/template/builder management is. The word `cms` occupies the wrong semantic slot.
2. **Prune robustness.** A prunable domain is smeared across ~15 locations. The manifest only validates that listed paths exist; a new CMS file added in an unlisted location is silent under-pruning (typecheck passes, dead code ships in the flavor branch). Some files also mix kept and pruned domains (`resources/lang/*/cms.json`, the hardcoded admin nav in `inertia_middleware.ts`).

## Decision

### Asymmetric vertical slice

Only the prunable group becomes a vertical module: **`app/cms/`** (page, template, builder, contact — contact is coupled to `ContactFormBlock`). Core (auth, users, roles, permissions, files, logs, maintenance, settings, dashboard…) stays layer-first: it is never pruned by any flavor, so slicing it would buy nothing for 100% of the churn.

Rule of thumb: **if it dies when the CMS dies, it lives in `app/cms/`**.

### Module contract (amended for framework-scanned layers)

`app/cms/` holds every layer that is NOT scanned by a framework barrel: `models/`, `domain/{services,repositories,actions}/`, `validators/`, `exceptions/`, `types/`, `factories/`.

AdonisJS generates barrels (`#generated/controllers`, `#generated/events`, `#generated/listeners`, transformers) by scanning a single configured source directory per entity type (`adonisrc.ts` `indexEntities`). Those four layers therefore stay in their framework directories, but are organized into **per-domain subdirectories** so each remains a single-directory delete and future additions are covered by convention:

- `app/http/controllers/{page,template}/` — already per-domain
- `app/listeners/page/` — already per-domain
- `app/events/page/` — new (events were flat files)
- `app/data/transformers/{page,template}/` — new (transformers were flat files)

A spike during implementation tests whether a second `indexEntities` invocation can scan `app/cms/` without barrel conflicts; if so, the remaining layers may move in later.

CMS migrations move to `database/migrations/cms/` via a second Lucid `migrations.paths` entry in `config/database.ts`.

### Naming

- The back-office context `cms` is renamed **`admin`** everywhere: controller contexts, Inertia pages, route names (`cms.*` → `admin.*`, simplifying the middleware that already accepts both), i18n namespace. `admin` is already the dominant vocabulary (`admin.routes.ts`, `features.admin`, `/admin/*` URLs, `organisms/admin/`, `listeners/admin/`).
- **`cms` now denotes the content module exclusively.**
- `front` (audience/shell — includes authenticated self-service pages like account/profile) and `public` (exposure — unauthenticated route module/flag, future `publicApi`) remain two distinct terms in two distinct slots; both are pinned in the `CONTEXT.md` glossary.

### Layering principle (documented in docs/agents)

The context axis (`front`/`admin`/`api`) exists only at the delivery layer (controllers, Inertia pages) where the transport changes the code. Below it — validators, exceptions, transformers — everything is domain-grouped and transport-agnostic. Splitting those by context would duplicate business rules across transports and create prune work on code that must survive.

### Inertia

- Module screens move to `inertia/pages/cms/` (resolver glob untouched).
- CMS-exclusive components (`atoms/blocks/`, `molecules/renderer/`, `organisms/builder/`) move to `inertia/components/cms/`, an unclassified module subtree. The block render/edit pair (`{type}_block.tsx` / `{type}_editor.tsx`) is co-located; `design-system.md` gains a "module subtrees" section.
- The admin navigation becomes **declarative**: each domain registers its entries with a nav registry (same pattern as the dashboard collectors from #1) instead of hardcoded entries in `inertia_middleware.ts`.

### Lang

- `cms.json` → `admin.json`, keeping only core back-office strings.
- Module strings migrate to the per-domain files that are already prune targets: `cms.pages.*` → `page.json` (under an `admin.*` branch to avoid collisions with existing flash keys), `cms.templates.*` → `template.json`, builder chrome → new `builder.json`. CMS-specific dashboard card strings follow their collector.
- System role display names (duplicated and already drifted between `roles.json` and `cms.json`) are deduplicated into `roles.json`.
- Empty `core.json` is removed.
- The i18n loader is filename-namespaced, so the prune unit is the file: `resources/lang/*/{page,template,builder}.json`.

### Composition & prune allowlist

Routes are split per module×transport: `cms_admin.routes.ts`, `cms_public.routes.ts`, `cms_api.routes.ts`, gated on `main` by a new `cms` feature flag. Since `start/routes.ts`, `start/events.ts` reference CMS code statically and dynamic imports do not save the typecheck, the composition files join the #4 rewrite allowlist: `start/routes.ts`, `start/events.ts`, `config/database.ts` (`adonisrc.ts` and `features.ts` are already allowlisted). `start/transmit.ts` is CMS-only and is a pure delete.

One new import alias: `"#cms/*": "./app/cms/*.js"`. All core aliases are untouched.

## Alternatives considered

- **Full symmetric slice** (`app/core/…` + `app/cms/…` + `app/api/…`): mixes axes (`api` is a transport, not a domain), breaks every import alias, rewrites all of `docs/agents/`, and buys nothing for `core` which is never pruned. Rejected.
- **No slice (globs + coverage check in the manifest)**: zero refactor, but the manifest stays the safety net instead of the structure, and the terminology problem remains. Rejected as insufficient on its own; globs may still complement the manifest.
- **Context axis on validators/exceptions/transformers**: false symmetry — those layers are transport-agnostic by design; splitting duplicates business rules (drift risk between admin UI and REST API). Rejected.
- **`back` instead of `admin`**: zero presence in the codebase, and in a monolith "back" collides with "backend" (the whole `app/`, and literally the entire `api` flavor). Rejected.
- **`public` instead of `front`**: authenticated self-service pages (account, profile, preferences) live in the `front` shell, so `public` would be factually wrong; `front.*` route naming is already frozen by #9. Rejected.
- **Minimal module contract** (only models/domain/http move in): leaves validators/exceptions/etc. as root-level manifest entries, reintroducing per-layer manifest maintenance. Rejected.

## Consequences

Positive:

- The `inertia` prune of the CMS becomes ~10 structural entries (`app/cms/`, `inertia/pages/cms/`, `inertia/components/cms/`, `app/http/controllers/{page,template}/`, `app/{events,listeners}/page/`, `app/data/transformers/{page,template}/`, `resources/lang/*/{page,template,builder}.json`, `database/migrations/cms/`, `start/routes/cms_*.routes.ts`) plus allowlisted composition rewrites — with future CMS additions covered by location, not by manifest maintenance.
- Terminology matches the domain: `cms` = content management module, `admin` = back-office context.
- Nav coupling removed, consistent with the dashboard/sitemap registry direction (#1, #2).

Costs:

- Two organizational schemes coexist (asymmetry): documented in `docs/agents/` — "is it content management? → `app/cms/`; otherwise → layer-first".
- Large mechanical churn: i18n key renames, import rewrites, path updates across `docs/agents/*`, `CONTEXT.md` glossary additions.
- Spec realignments: #2, #3, #5, #8 path references; #4 allowlist extension.
- The four barrel-scanned layers stay outside the module (framework constraint), mitigated by per-domain subdirectory convention.

Sequencing: this lands before #2 and #3 (specs realigned while still markdown) and before #4 (manifests born on the new structure). #16 is orthogonal. Three green-CI PRs: (1) `cms`→`admin` rename, (2) module extraction, (3) Inertia + lang + composition + docs.

## Phase 2 implementation notes

Recorded while landing the module extraction (#58).

- **Spike: second `indexEntities` invocation � not viable.** `IndexGenerator.add()` overwrites by entity key instead of merging: a second invocation pointing at `app/cms/` replaced the `controllers` barrel with only the CMS source (the app failed to boot: `controllers.health.Health` undefined), and entities not re-specified would have been re-registered with defaults, silently dropping the custom `transformers` config (`withSharedProps`, `source`, `output`). Controllers, events, listeners and transformers therefore stay outside the module permanently; the per-domain subdirectory convention (`app/http/controllers/page/`) is the final answer, not a stopgap.
- **Migration names change when files move.** Lucid derives the tracked `adonis_schema` name from the configured path (`<migrations.path>/<file>`), so `database/migrations/cms/*` is tracked under new names and would re-run on pre-existing databases. Mitigation: `node ace cms:normalize-migration-names` � a one-time, idempotent command that renames the five stored rows in place. Required once on databases created before phase 2; fresh databases never need it. The command is safe to delete once every long-lived database has been normalized.
- **Transformer data objects nest by directory.** `app/data/transformers/page/page_transformer.ts` generates `Data.Page.Page` (was `Data.Page`); Inertia type references were updated mechanically (`Data.Page` → `Data.Page.Page`, `Data.PageRevision` → `Data.Page.PageRevision`, `Data.PageTranslation` → `Data.Page.PageTranslation`, `Data.Template` → `Data.Template.Template`).

## Phase 3 implementation notes

Recorded while landing the BFF per-domain co-location (issue #173). Phase 2's "module contract with framework-scanned layers left outside" is superseded: the CMS domain now follows the same two-part shape as the migrated domains (identity, file, log, …) — a `src/{domain}/` business module and an `app/{domain}/` transport module.

- **Business layer: `src/cms/`** — `actions/`, `repositories/`, `services/`, `models/`, `exceptions/`, `queries/`, `types/`, `enums/`, `domain/` (preview-token helper) and the domain-owned `permissions.ts` catalog (`cmsPermissionCatalog`, spread in `start/permissions.ts`). Imported via `"#cms/*": "./src/cms/*.js"`.
- **Transport layer: `app/cms/`** — `controllers/{admin,api,front}/` with self-registering `routes.ts` per surface, `nav.ts` (`cmsNavEntries`), `validators/` (VineJS schemas, transport-shaped like `app/identity/validators/`), `helpers/i18n_payloads/`, `transformers/` and `rest/` (pages/templates REST resources). The domain entry `app/cms/routes.ts` is a pure import of the three surface files and joins the `start/routes.ts` import list.
- **The prune unit is the location.** Every smeared CMS path collapses into the co-located units — `src/cms/`, `app/cms/`, `database/{migrations,seeders,factories}/cms/`, `resources/lang/{en,fr}/cms/`, `inertia/{pages,components}/cms/`, `tests/{unit,integration,functional}/cms/`, `config/{cms,transmit}.ts`, `start/transmit.ts`, `commands/cms_normalize_migration_names.ts`, `resources/views/emails/contact_form_email.edge` — so both flavor manifests carry one entry per unit instead of a per-file inventory.
- **The event chain is gone.** The contact-form notification no longer travels through `app/events/` → `app/listeners/` → `app/mails/`; `ContactMailService` (`src/cms/services/contact_mail_service.ts`) sends directly from the front controller, and `start/events.ts` registers nothing in every flavor.
- **Route names (issue #161).** `admin.cms.*` for the back-office, `api.v1.admin.cms.*` for the versioned API, `cms.contact.execute` / `cms.page.render` / `cms.page.localised.render` for the public front, and the home collapse: the site root is `core.home.render` in every flavor — served by the CMS page home on `main`, by the exported `registerCoreHomeRoute()` (static `app/core/controllers/front/home_controller.ts`) in the `inertia` flavor.
- **i18n namespaces nest with the location.** The lang files moved to `resources/lang/{en,fr}/cms/{page,template,builder}.json`; `@adonisjs/i18n` dot-joins the subdirectory path, so keys are `cms.page.*`, `cms.template.*`, `cms.builder.*`.
