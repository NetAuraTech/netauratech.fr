# Domain Queries

One query = one read. Lives in `src/{domain}/queries/{verb}_{noun}_query.ts` — co-located with the domain's models and imported through the domain alias (`#identity/queries/...`, `#file/queries/...`, `#log/queries/...`). Pure, focused wrappers around Lucid read queries — callers never touch the ORM directly. No business logic, no mutation. The shared `BaseQuery` lives in `src/core/queries/base_query.ts`.

Queries are the read-side counterpart to repositories: repositories own the write path (`create`/`update`/`delete`), queries own the read path (`list`/`get`). When a read needs preloading, shaping, or filtering that a repository's CRUD methods don't express, it lives here.

> **Identity co-location:** identity queries (user, role, permission) live under `src/identity/queries/`, imported via `#identity/queries/...` — co-located with the identity domain's models and actions in the `src/identity/` business module.
>
> **File co-location:** file queries (file, file_folder) live under `src/file/queries/`, imported via `#file/queries/...` — co-located with the file domain's models and actions in the `src/file/` business module.
>
> **Log co-location:** log queries (log_entry) live under `src/log/queries/`, imported via `#log/queries/...` — co-located with the log domain's models and actions in the `src/log/` business module.
>
> **Account/backup co-location:** account and backup queries live under `src/{domain}/queries/`, imported via `#account/queries/...` / `#backup/queries/...`.

## Structure

```typescript
import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import User from '#identity/models/user';
import type { User as UserDomain } from '#identity/domain/user';

interface ListUsersCriteria {
	search?: string;
	role?: string;
	pagination: PaginationFilters;
}

/**
 * Read-side query for listing users with optional search and role filters.
 */
export class ListUsersQuery extends BaseQuery {
	async execute(criteria: ListUsersCriteria): Promise<PaginatedResult<UserDomain>> {
		const query = User.query(this.client()).preload('role').orderBy('created_at', 'desc');

		if (criteria.search) {
			query.whereILike('email', `%${criteria.search}%`);
		}

		const result = await query.paginate(criteria.pagination.page ?? 1, criteria.pagination.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
```

## Conventions

- **Returns domain entities, never raw models.** Every row is hydrated to its domain entity via `row.toDomain()` (or a domain factory like `FileFolder.fromModel`). Raw Lucid models do not cross the query boundary — this is the core reason the layer exists.
- **Stateless.** No `@inject()`, no constructor. A query has no injected dependencies; the IoC container instantiates it on demand.
- **Single method**: Each query has exactly one public `execute(...)` method. No additional public methods.
- **Criteria contract**: A single typed parameter — a colocated `<Name>Criteria` interface for list queries, a scalar (`id`, `userId`) for single-entity lookups, or an imported domain filter type. Default values are applied at the boundary (`?? 1`, `?? 20`).
- **Transaction-aware, read-only.** Every `.query()`/`.find()` takes `this.client()`, which resolves the ambient transaction if one is active. Queries never import `transactionContext` themselves and never start a transaction — they only ever participate in one an action opened via `withTransaction()`.
- **Preload, don't N+1.** Use `.preload()`, `.load()`, or a single-scan builder (see Tree building) rather than lazy relation loads in a loop.

## Return shapes

| Shape              | Lucid call                                         | Hydration                                           | Returns                   |
| ------------------ | -------------------------------------------------- | --------------------------------------------------- | ------------------------- |
| **Paginated list** | `.paginate(page, perPage)`                         | `this.toPaginated(result, (row) => row.toDomain())` | `PaginatedResult<Domain>` |
| **Single entity**  | `.where(...).first()` / `.find(id, this.client())` | `row.toDomain()`                                    | `Domain \| null`          |
| **Collection**     | `.where(...)`                                      | `rows.map((row) => row.toDomain())`                 | `Domain[]`                |

`PaginatedResult<T>` (from `base_query`) carries the domain-hydrated rows plus the raw Lucid pagination metadata (`total`, `all()`, `getMeta()`) so callers get pagination without the models leaking through.

A single-entity query preloads its relations before hydrating:

```typescript
async execute(id: number): Promise<UserDomain | null> {
	const user = await User.query(this.client()).where('id', id).first();
	if (!user) return null;

	await user.load('role', (query) => {
		query.preload('permissions');
	});

	return user.toDomain();
}
```

## Tree building

When a read must return a nested structure (e.g. a folder tree), fetch the flat rows in a single query and shape them with a pure helper in the same `queries/` directory instead of recursive relation loads. `buildFolderForest` in `src/file/queries/folder_tree.ts` groups flat rows by `parentId` in one pass and hydrates each node via its domain factory.

## Dependencies

- **Queries depend on models** for reads — they import the Lucid model directly and hydrate via the model's `toDomain()` (or a domain factory).
- **Queries never import another query.** Cross-entity composition belongs in the action or service layer.
- **Actions inject queries** through the action's constructor (`@inject()` on the action), then delegate their single `execute()` to the query — the read-side mirror of an action delegating to a repository.

## Naming

- File: `<verb>_<noun>_query.ts` — e.g., `list_users_query.ts`, `get_user_detail_query.ts`, `list_file_alts_query.ts`
- Class: PascalCase version of the file name — e.g., `ListUsersQuery`, `GetUserDetailQuery`
- Criteria interface: `<Name>Criteria` colocated in the file (or an imported domain filter type) — e.g., `ListUsersCriteria`

## Directory Structure

```
src/
  core/queries/        # BaseQuery + PaginatedResult (shared base)
  account/queries/     # get_user_preference
  backup/queries/      # list_backups
  file/queries/        # list_files, list_root_folders, list_folder_children, list_file_alts,
                       # get_folder_detail, get_file_detail, folder_tree (pure helper)
  identity/queries/    # list_users, list_roles, list_permissions, get_user_detail, get_role_detail
  log/queries/         # list_log_entries
  webhook/queries/     # list_webhook_deliveries
```

## Documentation

See `docs/agents/jsdoc.md` for JSDoc conventions. Every exported query class and its `execute()` method must have JSDoc; return types use `{@link DomainType}` references to the entity they hydrate.
