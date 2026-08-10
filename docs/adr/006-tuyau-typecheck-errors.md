---
status: superseded
date: 2026-08-04
superseded_by:
  - 009
context:
  - Tuyau generates type definitions in `.adonisjs/` from route declarations
  - The generated code sometimes produces typecheck errors (e.g., `contact.execute`)
  - These files are auto-generated and should never be edited manually
  - Regenerating them does not fix the underlying type mismatches
---

> **Superseded by [ADR 009](./009-patched-tuyau-extract-query.md).** The upstream root cause was identified ([Julien-R44/tuyau#116](https://github.com/Julien-R44/tuyau/issues/116)) and `@tuyau/core` is now patched at install time, so `npm run typecheck` is green. `.adonisjs/` typecheck errors are no longer expected noise — treat any new one as a real signal.

## Context

The Tuyau codegen produces TypeScript type definitions in `.adonisjs/client/registry/` and `.adonisjs/server/` based on the application's routes. These types power the type-safe `route()` helper and Inertia page props.

Occasionally, `npm run typecheck` reports errors inside these generated files — for example:

```
.adonisjs/client/registry/index.ts(547,5): error TS2322: Type '{ body: Omit<...> }' is not assignable to type 'EndpointTypes'.
```

The `contact.execute` route is a recurring offender. The error stems from a mismatch between the route's inferred types and Tuyau's `EndpointTypes` contract — a bug or limitation in the codegen, not in application code.

## Decision

**Do not attempt to fix typecheck errors originating from `.adonisjs/` generated files.** Treat them as noise.

### Rationale

1. **Generated files are ephemeral** — they are deleted and recreated on every dev server boot. Any manual edit is lost immediately.
2. **The root cause is upstream** — the type mismatch lives in Tuyau's codegen logic, not in how routes are declared. Patching application code to satisfy a generator bug creates unmaintainable workarounds.
3. **No runtime impact** — these are compile-time type errors only. The generated JavaScript works correctly at runtime; the `route()` helper and Inertia navigation function as expected.
4. **Signal-to-noise ratio** — fixing generated-file errors trains agents to ignore all typecheck output, increasing the risk of missing real errors in application code.

### What to do instead

- **Scope typecheck to application code**: when validating changes, run `npm run typecheck` and filter out errors whose file path starts with `.adonisjs/`.
- **Report upstream**: if a Tuyau error blocks legitimate work, open an issue on the Tuyau repository with the route definition and the generated output.
- **Regenerate, don't patch**: if types appear stale, delete `.adonisjs/` and restart the dev server — never edit the files directly.

## Consequences

- Agents MUST ignore typecheck errors in `.adonisjs/` files.
- Agents MUST NOT modify files under `.adonisjs/` (already covered by the critical rule in `AGENTS.md`).
- CI pipelines should exclude `.adonisjs/` from typecheck failures, or the project accepts a baseline of known Tuyau errors.
