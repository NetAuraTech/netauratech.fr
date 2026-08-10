# Domain Services

One service = one bounded context. Lives in `app/domain/services/{area}/{name}_service.ts`. Owns business logic, delegates persistence to a repository, never returns HTTP responses — only models, primitives, or `void`.

> **CMS exception (ADR-0001):** CMS services (page, template) live under `app/cms/domain/services/{area}/`, imported via `#cms/domain/services/...`. The layout above applies to everything outside the CMS module.

Method names describe the action, not a fixed CRUD contract. A service exposes
whatever operations its bounded context needs. Don't force
`list/detail/create/update/delete` onto every service.

## Structure (shape, not a fixed method list)

```typescript
@inject()
export class FooService {
  constructor(
    protected fooRepository: FooRepository,
    protected logService: LogService
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

| Variant                                         | Trait                                                                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Standard service**                            | DI of repo(s) + LogService, methods named per use case                                                                                            |
| **Facade over contract**                        | No `@inject()`; dependency injected via manual container binding; adds key namespacing on top of a generic driver interface                       |
| **Infra wrapper**                               | Single pass-through method to a framework-provided service, no repo                                                                               |
| **Plain injectable, no deps**                   | Empty constructor, auto-resolved by IoC, used as a dependency of other services                                                                   |
| **Function module**                             | Exported function, not a class — no DI at all                                                                                                     |
| **Read-only**                                   | Queries the model directly, no mutation repo, exposes listing/lookup only                                                                         |
| **Direct infra access** (exception to layering) | Bypasses the repository layer entirely for OS-level operations (raw SQL, child processes, filesystem) — document why in the file header when used |
| **Stateful/cache-backed**                       | No DB repo; state lives in a cache service, namespaced per concern, often TTL-based                                                               |
| **Dashboard collector**                         | Read-only, single `collect(payload)` method; registered in `start/dashboard.ts` to contribute one optional section to the admin dashboard         |
| **Nav entries module**                          | Static `{domain}_nav.ts` exporting `AdminNavEntry[]`; registered in `start/nav.ts` to contribute entries to the admin sidebar                     |

## Dashboard collectors

The admin dashboard payload is composed, not hardcoded: each domain owns a `{domain}_dashboard_collector.ts` service implementing `DashboardCollector<Section>` from `#types/dashboard`, and the composition file `start/dashboard.ts` (preloaded) registers one collector per section into the `DashboardRegistry` singleton. `GetDashboardStatsAction` aggregates exactly the registered sections, in parallel; the React page renders only the sections present in the payload. Dropping a domain from the composition therefore removes its dashboard section without leaving empty figures behind.

## Admin navigation

The admin sidebar follows the same composition pattern: each domain owns a `{domain}_nav.ts` module exporting `AdminNavEntry[]` (i18n key labels, route names, icons, permissions, category), and the composition file `start/nav.ts` (preloaded) registers them in sidebar order into the `NavRegistry` singleton. The inertia middleware reads the registry on every admin page render, resolves labels in the request locale, and shares the grouped result as the `admin_menu` prop — the React `useMenu()` hook only reads it. Dropping a domain from the composition removes its sidebar entries without touching kept code.

## Decision rule

DB-backed with custom logic → Standard service. Wraps one external system → Infra wrapper. No state/deps → plain injectable. Pure transform, no I/O → function module. Read-only catalogue → Read-only. Needs OS-level tools (CLI, fs) → direct infra access, document why. Ephemeral/real-time state → cache-backed, no repository.

## Conventions

- Errors: typed exception class or `Object.assign(new Error(msg), { code: 'E_...' })` — both used, no strict preference enforced yet.
- Logging: see /docs/agents/logging.md for conventions and categories.
- Services may call other services directly when one operation depends on another's logic.
- Swappable infrastructure (cache, storage, etc.) goes through a contract interface in `app/domain/contracts/` — changing backend = new container binding, no call-site changes.
