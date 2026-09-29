This is the `@foundry/web` app workspace — the complete AdonisJS application (transport layer, business layer, Inertia frontend, config, database, providers, root-level ace commands, Japa suite, public/storage/resources, codegen and rc files, bundler and vitest configs, env example files). The repo root holds the workspaces, the prune tooling, repo-wide lint/format configs, CI, Docker and docs.

## Running the app

The framework derives the app root from the `bin/` entrypoint file location — never from cwd — so every AdonisJS command must run from this directory:

- `npm run dev` / `npm run start` / `npm run build` / `npm run test` / `npm run test:front` — or run the workspace scripts from the repo root (`npm run dev --workspace @foundry/web`).
- `node ace codegen` — regenerates every committed codegen file under `.adonisjs/`; commit the result when it drifts.

## Module aliases

`#*` imports resolve through this package's `imports` map (see `package.json`) plus Node's package imports. The prune tests (`tests/unit/prune/`) are the one boundary-escaping case: they exercise the repo-root tooling through a relative import (`../../../../../tooling/prune/*`) rather than a `#prune` alias, because Node forbids a package `imports` target from leaving the package. The root `tsconfig.json` typechecks them (both `tooling/` and the tests share its `rootDir`), so they are excluded from this workspace's tsconfig.

Transport code is addressed through the single `#transport/*` alias with the domain as a path segment (`#transport/auth/validators/...`), not through per-domain aliases: Node's flat `imports` map already assigns `#{domain}/*` to the business layer (`src/{domain}/`), so a second per-domain alias per transport domain is not expressible. Imports still name the domain — the spec's per-domain alias decision (issue #161) is realized in the path segment.

## Repo-wide tooling

Lint (`oxlint`), formatting (`oxfmt`), typecheck (`tsc` fan-out) and the lockfile live at the repo root — run them there, not from this workspace. This workspace owns no lockfile; the root lockfile is the single one under workspaces.

## Conventions

All architectural conventions (controllers, services, repositories, models, exceptions, validators, logging, JSDoc, TOCTOU, CLI commands) live in the repo-root `docs/agents/` and apply to this workspace unchanged.
