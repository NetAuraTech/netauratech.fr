# Domain Repositories

One repository per model, in `src/{domain}/repositories/{name}_repository.ts` (area subdirectories for large domains) — co-located with the domain's models and imported through the domain alias (`#cms/repositories/...`, `#identity/repositories/...`). Pure, focused wrappers around Lucid ORM queries — callers never touch the ORM directly. No business logic. The shared `BaseRepository` lives in `src/core/repositories/base_repository.ts`.

> **CMS exception (ADR-0001):** CMS repositories (page, template) live under `src/cms/repositories/{area}/`, imported via `#cms/repositories/...`. The layout above applies to everything outside the CMS module.
>
> **Identity co-location:** identity repositories (user, role, permission) live under `src/identity/repositories/`, imported via `#identity/repositories/...` — co-located with the identity domain's models and actions in the `src/identity/` business module.
>
> **File co-location:** file repositories (file, file_folder) live under `src/file/repositories/`, imported via `#file/repositories/...` — co-located with the file domain's models and actions in the `src/file/` business module.
>
> **Log co-location:** log repositories (log_entry) live under `src/log/repositories/`, imported via `#log/repositories/...` — co-located with the log domain's models and actions in the `src/log/` business module.

## Structure

```typescript
export class FooRepository {
	async findById(id: number): Promise<Foo | null> {
		return Foo.find(id);
	}
	async findByIdOrFail(id: number): Promise<Foo> {
		return Foo.findOrFail(id);
	}
	async findAll(options?: FindOptions): Promise<Foo[]> {
		/* optional orderBy/limit/offset */
	}
	async create(data: Partial<Foo>): Promise<Foo> {
		return Foo.create(data);
	}
	async delete(id: number): Promise<boolean | void> {
		/* find, then .delete() */
	}
}
```

Only include the methods the model actually needs — don't pad a repository with `findMany`/`count`/`exists` if nothing calls them.

## `update()` — two accepted signatures

Both are used in this codebase; pick based on what the caller already has in hand.

- **By id**: `update(id: number, data: Partial<Foo>): Promise<Foo | null>` — repository re-fetches internally. Use when the caller only has an id (e.g. coming straight from a route param).
- **By instance**: `update(model: Foo, data: Partial<Foo>): Promise<Foo>` — caller already loaded the record. Use when the service already fetched/validated the instance beforehand, to avoid a redundant query.

Stay consistent within a single repository — don't mix both signatures on the same class.

## Conventions

- `findById` returns `null` on miss; `findByIdOrFail` throws (Lucid's `findOrFail`).
- `create`/`update` accept `Partial<Model>` — never the full model shape.
- A repository that needs cross-table audit logging (e.g. tracking token verification attempts) may inject `LogService` — this is the only DI exception in this layer.
- A repository never imports another repository. Cross-entity composition belongs in the service layer.
- A sub-entity tightly coupled to a parent with no independent lifecycle (e.g. alt text on a file) is managed via dedicated methods on the parent's repository (`upsertAlt`, `listAlts`) rather than its own repository class.

## Documentation

See /docs/agents/jsdoc.md for JSDoc conventions on repository methods.
