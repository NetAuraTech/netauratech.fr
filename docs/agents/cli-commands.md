# CLI Commands (Ace)

AdonisJS provides the `ace` CLI for scaffolding, migrations, and project management. Always use Ace commands instead of creating files manually when a scaffold command exists — it ensures proper registration, naming conventions, and boilerplate consistency.

## Running commands

Ace commands run from the app workspace (`apps/web/`); npm scripts (`dev`, `build`, `test`, …) run from the repo root.

```bash
cd apps/web
node ace <command>
```

## Scaffolding

| Command                           | Creates             | Location                                                                  |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `node ace make:domain`            | Complete DDD domain | see below                                                                 |
| `node ace make:model <Name>`      | Model + migration   | move it to `src/{domain}/models/` + database migrations                   |
| `node ace make:controller <Name>` | Controller class    | `app/` — move it to `app/{domain}/controllers/{context}/`                 |
| `node ace make:migration <name>`  | Migration file      | `database/migrations/`                                                    |
| `node ace make:service <Name>`    | Service class       | Use manually in `src/{domain}/services/`                                  |
| `node ace make:repository <Name>` | Repository class    | Use manually in `src/{domain}/repositories/`                              |
| `node ace make:exception <Name>`  | Exception class     | Use manually in `src/{domain}/exceptions/`                                |
| `node ace make:validator <Name>`  | Validator file      | Use manually in `app/{domain}/validators/`                                |
| `node ace make:middleware <Name>` | Middleware class    | Use manually in `app/{domain}/middleware/` (core: `app/core/middleware/`) |

> The application has **no event/listener chain** (`start/events.ts` registers nothing, `app/events/` and `app/listeners/` do not exist) — mail flows go through the mail client directly, so `make:event` / `make:listener` have no use here.

### Domain scaffolding

`make:domain` scaffolds a complete domain-driven (DDD) module end to end for the
app workspace. Run it from `apps/web/`:

```bash
cd apps/web
node ace make:domain
```

It prompts for a singular lowercase domain name (e.g. `widget`) and generates
the full vertical slice, mirroring the existing `log` domain:

- **Business layer** (`src/{domain}/`): types, domain object + identifier,
  model (extending the generated `{Entity}Schema`), permission catalog, domain
  service (with business logging), repository, list query, and
  list/create/delete actions.
- **Transport layer** (`app/{domain}/`): routes (self-registering, feature-gated),
  admin + API controllers, REST resource, transformer, validators, i18n payload
  and admin nav entries.
- **Frontend**: Inertia page (`inertia/pages/{domain}/admin/index.tsx`), `en`/`fr`
  translations.
- **Persistence + tests**: migration (timestamped), factory, unit spec and
  functional spec.

The command also applies four idempotent registration edits:
`start/routes.ts`, `start/permissions.ts`, `start/nav.ts` and the `package.json`
`imports` map. Nothing is ever overwritten — retry after removing conflicting
files.

After generating, run `node ace codegen` and `node ace migration:run` (regenerates
`database/schema.ts`), then the quality gates below.

### Model scaffolding

When creating a new model, use the `--migration` flag to generate both at once:

```bash
node ace make:model Foo --migration
```

After running migrations with `node ace migration:run`, the schema file (`database/schema.ts`) is regenerated automatically. The model extends this generated schema — never edit it manually.

## Migrations

| Command                                       | Description                                               |
| --------------------------------------------- | --------------------------------------------------------- |
| `node ace make:migration add_column_to_table` | Create a new migration                                    |
| `node ace migration:run`                      | Run pending migrations (regenerates `database/schema.ts`) |
| `node ace migration:rollback`                 | Rollback last batch                                       |
| `node ace migration:status`                   | Show migration status                                     |

Always run `node ace migration:run` after creating or modifying a migration — this regenerates the schema classes that models extend.

## Development

| Command         | Description                                        |
| --------------- | -------------------------------------------------- |
| `npm run dev`   | Start dev server with HMR (`node ace serve --hmr`) |
| `npm run build` | Build for production (`node ace build`)            |
| `npm start`     | Run production server                              |
| `npm test`      | Run tests (`node ace test`)                        |

## Quality gates

Run these before committing — they are enforced by the repository expectations:

```bash
npm run lint        # oxlint
npm run format      # oxfmt
npm run typecheck   # TypeScript (app + Inertia)
npm run test:front  # Vitest (frontend)
```

## Key generation

When setting up a new environment, generate an application key (from `apps/web/`):

```bash
node ace generate:key
```

This writes the `APP_KEY` value to `apps/web/.env`.

## Conventions

- Always prefer Ace commands over manual file creation when available.
- Model files go in `src/{domain}/models/`. If `ace make:model` places it elsewhere, move it to the correct domain folder.
- Migration names use snake_case with action + table: `add_slug_to_pages`, `create_tokens_table`.
