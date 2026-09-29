# Domain Services

One service = one bounded context. Lives in `src/{domain}/services/{area}/{name}_service.ts` — co-located with the domain's repositories and imported through the domain alias (`#core/services/...`, `#log/services/...`). Owns business logic, delegates persistence to a repository, never returns HTTP responses — only models, primitives, or `void`. Cross-domain services (cache, locks) live in `src/shared/services/`; registry and cross-domain business services (maintenance, mail, dashboard, nav, sitemap) live in `src/core/services/`. Backup is its own business module: its services live in `src/backup/services/` (`#backup/services/...`).

> **CMS exception (ADR-0001):** CMS services (page, template) live under `src/cms/services/{area}/`, imported via `#cms/services/...`. The layout above applies to everything outside the CMS module.
>
> **Identity co-location:** identity services live under `src/identity/services/`, imported via `#identity/services/...` — co-located with the rest of the identity business module.
>
> **File co-location:** file services live under `src/file/services/`, imported via `#file/services/...`, and the permission catalog at `src/file/permissions.ts` — co-located with the rest of the file business module. The nav entries module is transport and lives at `app/file/nav.ts` (imported via `#transport/file/nav`).
>
> **Log co-location:** log services live under `src/log/services/`, imported via `#log/services/...`, and the permission catalog at `src/log/permissions.ts` — co-located with the rest of the log business module. The nav entries module is transport and lives at `app/log/nav.ts` (imported via `#transport/log/nav`).
>
> **Backup co-location:** backup services live under `src/backup/services/`, imported via `#backup/services/...` — co-located with the rest of the backup business module.
>
> **Core co-location:** core services live under `src/core/services/`, imported via `#core/services/...`, and the permission catalog at `src/core/permissions.ts` — co-located with the rest of the core business module. The nav entries module is transport and lives at `app/core/nav.ts` (imported via `#transport/core/nav`).

Method names describe the action, not a fixed CRUD contract. A service exposes
whatever operations its bounded context needs. Don't force
`list/detail/create/update/delete` onto every service.

## Structure (shape, not a fixed method list)

```typescript
@inject()
export class FooService {
	constructor(
		protected fooRepository: FooRepository,
		protected logService: LogService,
	) {}

	async someAction(payload, userId) {
		// 1. validate / check invariants, throw typed exception or
		//    Object.assign(new Error(msg), { code: 'E_...' }) if violated
		// 2. delegate persistence to this.fooRepository
		// 3. this.logService.logBusiness/logAuth/logSecurity(event, { userId, userEmail }, metadata?)
		// 4. return a model, primitive, or void — never an HTTP response
	}
}
```

## Variants

| Variant                                         | Trait                                                                                                                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Standard service**                            | DI of repo(s) + LogService, methods named per use case                                                                                                                                |
| **Facade over contract**                        | No `@inject()`; dependency injected via manual container binding; adds key namespacing on top of a generic driver interface                                                           |
| **Infra wrapper**                               | Single pass-through method to a framework-provided service, no repo                                                                                                                   |
| **Plain injectable, no deps**                   | Empty constructor, auto-resolved by IoC, used as a dependency of other services                                                                                                       |
| **Function module**                             | Exported function, not a class — no DI at all                                                                                                                                         |
| **Read-only**                                   | Queries the model directly, no mutation repo, exposes listing/lookup only                                                                                                             |
| **Direct infra access** (exception to layering) | Bypasses the repository layer entirely for OS-level operations (raw SQL, child processes, filesystem) — document why in the file header when used                                     |
| **Stateful/cache-backed**                       | No DB repo; state lives in a cache service, namespaced per concern, often TTL-based                                                                                                   |
| **Dashboard collector**                         | Read-only, single `collect(payload)` method; registered in `start/dashboard.ts` to contribute one optional section to the admin dashboard                                             |
| **Nav entries module**                          | Static `{domain}_nav.ts` exporting `AdminNavEntry[]`; registered in `start/nav.ts` to contribute entries to the admin sidebar                                                         |
| **Permission catalog module**                   | Static `{domain}_permissions.ts` exporting the domain's `category → actions` const (`as const`); composed in `start/permissions.ts`, from which the slug values and slug union derive |

## Dashboard collectors

The admin dashboard payload is composed, not hardcoded: each domain owns a `{domain}_dashboard_collector.ts` service implementing `DashboardCollector<Section>` from `#types/dashboard`, and the composition file `start/dashboard.ts` (preloaded) registers one collector per section into the `DashboardRegistry` singleton. `GetDashboardStatsAction` aggregates exactly the registered sections, in parallel; the React page renders only the sections present in the payload. Dropping a domain from the composition therefore removes its dashboard section without leaving empty figures behind.

## Admin navigation

The admin sidebar follows the same composition pattern: each domain owns a `{domain}_nav.ts` module exporting `AdminNavEntry[]` (i18n key labels, route names, icons, permissions, category), and the composition file `start/nav.ts` (preloaded) registers them in sidebar order into the `NavRegistry` singleton. The inertia middleware reads the registry on every admin page render, resolves labels in the request locale, and shares the grouped result as the `admin_menu` prop — the React `useMenu()` hook only reads it. Dropping a domain from the composition removes its sidebar entries without touching kept code.

## System permission catalog

Permissions follow the same composition pattern. Each domain owns a `{domain}_permissions.ts` module exporting a `category → actions` const with `as const` (e.g. `src/identity/permissions.ts`, `src/core/permissions.ts`), and the composition file `start/permissions.ts` spreads the per-domain catalogs into the single `permissionCatalog` matrix. The `permission_seeder` persists exactly that matrix, and `PermissionSlug`/`SystemRoleSlug` are derived from it — renaming a slug therefore touches exactly one file. `start/permissions.ts` is on the prune `REWRITE_ALLOWLIST`, so a flavor rewrites it to drop the catalogs of its pruned domains.

## Decision rule

DB-backed with custom logic → Standard service. Wraps one external system → Infra wrapper. No state/deps → plain injectable. Pure transform, no I/O → function module. Read-only catalogue → Read-only. Needs OS-level tools (CLI, fs) → direct infra access, document why. Ephemeral/real-time state → cache-backed, no repository.

## Kernel mail service

All mail dispatch goes through a single kernel service: `MailService<TPayload>` in `src/core/services/mail_service.ts` (imported via `#core/services/mail_service`). It is generic over the mail payload type — which must at least carry the `MailClientMessage` envelope from `#core/contracts/mail_client` — and depends on `MailClientContract`, bound by the app in `start/container.ts` to a thin wrapper around `@adonisjs/mail`. The service owns the shared dispatch: locale normalisation (`resolveLocale`, falling back to the app's default locale), flavor-aware link building (`buildLink`, the first registered candidate route wins) and sending (`send`, which stamps the resolved locale into the template data before delegating to the client).

Per-domain mail services (auth's `TokenMailService`, account's `EmailChangeMailService`) inject `MailService` typed with their domain's payload (e.g. `MailService<TokenMailMessage>`), keep building their domain-specific payload — i18n strings, token, template data — and resolve the recipient's locale from the account domain's preferences action (`GetPreferencesAction`) before dispatching — the recipient's preferences live in the account domain, and this service→action call is the single documented exception to the layering (see `docs/agents/domain-actions.md`, Dependencies). The kernel never imports a domain: locale _resolution_ (loading the preferences) stays domain-side, and only the resolved locale crosses into the dispatch. There is no events/listeners/mailables chain — every mail flow is a direct, traceable call.

**Token mails are spec-driven.** Each token mail flow (email verification, password reset, invitation, email-change confirmation, email-change notification) is one row of `TOKEN_MAIL_SPECS` in `src/core/token_mail_specs.ts` — i18n key block, flavor-aware candidate routes of the mail link, token TTL and template — and its payload is built by the shared `MailService.buildTokenMail` assembly (spec + resolved locale + token + per-dispatch params). For token-issuing flows, the row's `ttlHours` drives both the token issuance and the rendered expiry copy. A new token mail flow is a spec row, not a hand-assembled payload block.

## Conventions

- Errors: typed exception class or `Object.assign(new Error(msg), { code: 'E_...' })` — both used, no strict preference enforced yet.
- Logging: see /docs/agents/logging.md for conventions and categories.
- Services may call other services directly when one operation depends on another's logic.
- Swappable infrastructure (cache, storage, etc.) goes through a contract interface in the owning domain's business module (e.g. `#core/contracts/mail_client`) — changing backend = new container binding, no call-site changes.
