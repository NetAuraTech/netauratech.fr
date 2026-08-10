# CLI Commands (Ace)

AdonisJS provides the `ace` CLI for scaffolding, migrations, and project management. Always use Ace commands instead of creating files manually when a scaffold command exists — it ensures proper registration, naming conventions, and boilerplate consistency.

## Running commands

```bash
node ace <command>
```

## Scaffolding

| Command                           | Creates           | Location                            |
| --------------------------------- | ----------------- | ----------------------------------- |
| `node ace make:model <Name>`      | Model + migration | `app/models/` + database migrations |
| `node ace make:controller <Name>` | Controller class  | `app/http/controllers/`             |
| `node ace make:migration <name>`  | Migration file    | `database/migrations/`              |
| `node ace make:service <Name>`    | Service class     | Use manually in correct domain path |
| `node ace make:repository <Name>` | Repository class  | Use manually in correct domain path |
| `node ace make:exception <Name>`  | Exception class   | `app/exceptions/`                   |
| `node ace make:validator <Name>`  | Validator file    | `app/validators/`                   |
| `node ace make:middleware <Name>` | Middleware class  | `app/http/middleware/`              |
| `node ace make:event <Name>`      | Event class       | `app/events/`                       |
| `node ace make:listener <Name>`   | Listener class    | `app/listeners/`                    |

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
npm run lint        # ESLint with auto-fix
npm run format      # Prettier
npm run typecheck   # TypeScript (app + Inertia)
```

## Key generation

When setting up a new environment, generate an application key:

```bash
node ace app:key --generate
```

This writes the `APP_KEY` value to `.env`.

## Conventions

- Always prefer Ace commands over manual file creation when available.
- Model files go in `app/models/{area}/`, not the root of `models/`. If `ace make:model` places it at the root, move it to the correct domain folder.
- Migration names use snake_case with action + table: `add_slug_to_pages`, `create_tokens_table`.
