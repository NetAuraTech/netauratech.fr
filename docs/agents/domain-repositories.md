# Domain Repositories

One repository per model, in `app/domain/repositories/{area}/{name}_repository.ts`. Pure, focused wrappers around Lucid ORM queries — callers never touch the ORM directly. No business logic.

> **CMS exception (ADR-0001):** CMS repositories (page, template) live under `app/cms/domain/repositories/{area}/`, imported via `#cms/domain/repositories/...`. The layout above applies to everything outside the CMS module.

## Structure

```typescript
export class FooRepository {
  async findById(id: number): Promise<Foo | null> {
    return Foo.find(id)
  }
  async findByIdOrFail(id: number): Promise<Foo> {
    return Foo.findOrFail(id)
  }
  async findAll(options?: FindOptions): Promise<Foo[]> {
    /* optional orderBy/limit/offset */
  }
  async create(data: Partial<Foo>): Promise<Foo> {
    return Foo.create(data)
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
