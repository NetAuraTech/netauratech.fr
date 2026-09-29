# `@foundry/web`

The AdonisJS application workspace. This file documents the workspace itself — its layout, conventions, and how to run it — in a way that stays true on every flavor branch. For the project overview, the feature list, and the routes of your flavor, see the [root README](../../README.md); for architectural conventions, see [`docs/agents/`](../../docs/agents/) at the repo root.

## Running the app

The framework derives the app root from the `bin/` entrypoint location — never from the cwd — so every AdonisJS command runs from this directory:

```bash
# from apps/web/
node ace migration:run
node ace serve --hmr
```

The npm scripts (`dev`, `start`, `build`, `test`, …) are defined in this workspace's `package.json` and can be proxied from the repo root (`npm run dev --workspace @foundry/web`). `node ace codegen` regenerates the committed codegen files under `.adonisjs/` — commit the result when it drifts.

## Layout

The code is organized **per domain** in two trees: a transport layer that binds HTTP surfaces, and a business layer that owns the use cases and data access.

### `app/` — transport layer

Each domain under `app/` exposes a uniform set of entries (only the ones that apply exist per domain):

```
app/<domain>/
├── controllers/    # Thin controllers binding the domain's surfaces (admin, front, api)
├── rest/           # REST resource adapters for the versioned /api/v1 JSON surface
├── middleware/     # Domain middleware (auth, permission, role)
├── transformers/   # Shape data for responses and shared props
├── validators/     # VineJS validators
├── helpers/        # Transport-level helpers
└── routes.ts       # Domain route surface, self-registering, feature-flag gated
```

Controllers stay thin: they validate input, call into the business layer, and return. No business logic lives in this tree.

Routing is self-registering: `start/routes.ts` is a pure per-domain import list, and each `app/<domain>/routes.ts` registers its surfaces on import, gated by the feature flags in `config/features.ts`.

### `src/` — business layer

Each domain under `src/` owns:

```
src/<domain>/
├── actions/        # Use cases — controllers enter a domain through its actions
├── domain/         # Domain entities, value objects and pure rules
├── models/         # Lucid models
├── repositories/   # All database access, no business logic
├── queries/        # Read-side queries
├── services/       # Cross-cutting domain services
├── exceptions/     # Typed domain exceptions
└── types/          # Shared domain types
```

- **Actions** are the use-case entry points: they orchestrate a domain's operations, own transactional boundaries, and throw typed exceptions.
- **Repositories** are the only layer that touches the database; **queries** shape read-side data; **services** hold cross-cutting domain logic (mail, caching, resolvers).
- `src/core/` is the kernel shared by every domain: base classes (`base_repository`, `base_query`, `base_http_exception`), value-object primitives, transaction helpers, and the registries wired from `start/`.
- Domains without an HTTP surface (e.g. `backup`) live entirely in `src/` and are driven by the ace commands in `commands/`.

## Module aliases

Imports resolve through this workspace's `imports` map in `package.json`. The pattern is uniform:

| Alias                                                              | Target                                   |
| ------------------------------------------------------------------ | ---------------------------------------- |
| `#transport/*`                                                     | `app/*` — the transport layer            |
| `<domain>/*` (e.g. `#auth/*`, `#identity/*`)                       | `src/<domain>/*` — the business layer    |
| `#generated/*`                                                     | `.adonisjs/server/*` — framework codegen |
| `#config/*`, `#start/*`, `#database/*`, `#types/*`, `#providers/*` | the matching top-level directories       |

Transport code is addressed through the single `#transport/*` alias with the domain as a path segment (`#transport/auth/controllers/...`); the business layer keeps one alias per domain.

## Supporting directories

| Directory    | Purpose                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `commands/`  | Root-level ace commands (backup, maintenance, log pruning, user creation, …) |
| `config/`    | Feature flags (`features.ts`) and all framework configuration                |
| `database/`  | Migrations, per-domain factories, and seeders                                |
| `resources/` | Locale namespaces (`lang/`) and edge templates (`views/`)                    |
| `start/`     | Kernel, env validation, route index, registries, rate limiting               |
| `tests/`     | Japa suites (unit, integration, functional)                                  |

## Conventions

All architectural conventions — controllers, actions, services, repositories, models, exceptions, validators, logging, JSDoc, CLI commands — are documented in [`docs/agents/`](../../docs/agents/) at the repo root and apply to this workspace unchanged.
