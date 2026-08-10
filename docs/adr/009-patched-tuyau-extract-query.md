---
status: accepted
date: 2026-08-07
supersedes:
  - 006
context:
  - Tuyau generates type definitions in `.adonisjs/` from route declarations
  - `ExtractQuery` in `@tuyau/core` resolves to `unknown` for validators whose inferred input is an open record (`vine.record(...)`)
  - The generated registry then violates Tuyau's own `EndpointTypes` contract (`query: Record<string, any>`), breaking `npm run typecheck`
  - The root cause is upstream and cannot be fixed from application code without casts or semantic changes
---

## Context

The `contact.execute` route validates its payload with `contactValidator` — a `vine.record(vine.string())` whose `InferInput` is `{ [K: string]: string }`. The form is dynamic (fields are defined per CMS page block), so the open-record shape is semantically required.

For non-GET routes with a validator, Tuyau's codegen emits `query: ExtractQuery<InferInput<...>>` in `.adonisjs/client/registry/schema.d.ts`, where:

```ts
type ExtractQuery<T> = 'query' extends keyof T ? (T extends { query?: infer Q } ? Q : {}) : {}
```

For an open-record input:

1. `'query' extends keyof T` is **true** — `keyof { [K: string]: string }` is `string | number`.
2. TypeScript does **not** infer from an index signature into an optional property position — `{ query?: infer Q }` matches, but there is no declared `query` property, so `Q` has no inference candidates and falls back to `unknown`.

The generated `query: unknown` violates `EndpointTypes['query']: Record<string, any>`, so `tsc` fails inside `.adonisjs/client/registry/index.ts` and at the `createTuyau({ registry })` call site in `inertia/client.ts`. This made the typecheck gate permanently red on `main`, which already caused one real regression to slip through review.

This is upstream bug [Julien-R44/tuyau#116](https://github.com/Julien-R44/tuyau/issues/116) (open-record variant of [#115](https://github.com/Julien-R44/tuyau/issues/115)), present in the latest release (`@tuyau/core@1.2.2`).

## Decision

**Patch `@tuyau/core` at install time with [patch-package](https://www.npmjs.com/package/patch-package)** (`patches/@tuyau+core+1.2.2.patch`, applied by the `postinstall` script). The patch hardens `ExtractQuery` so the inferred query type is only kept when it satisfies the `Record<string, any>` constraint that `EndpointTypes` requires, falling back to `{}` otherwise:

```ts
type ExtractQuery<T> = 'query' extends keyof T
  ? T extends { query?: infer Q }
    ? [Q] extends [Record<string, any>]
      ? Q
      : {}
    : {}
  : {}
```

### Rationale

1. **No application-side fix exists.** Keeping the open-record semantics rules out fixed-key validators; hiding the validator from Tuyau's route scanner would distort the documented controller conventions; any type-level tweak of `InferInput` requires an `as` cast that hides the issue. ADR 006 already established that patching application code to satisfy a generator bug is an anti-pattern — the fix belongs in the generator's types.
2. **The patch is semantics-preserving.** It only changes outcomes that are currently hard type errors (`unknown`, or scalar `query` fields as in #115). Object-typed `query` declarations behave exactly as before.
3. **Type-only, zero runtime impact.** The patch touches a single `.d.ts` type alias; the generated JavaScript is unchanged.
4. **Fails loudly on upgrade.** If `@tuyau/core` is bumped and the patch no longer applies, `patch-package` errors at install time — forcing an explicit decision instead of silently restoring the bug.

### What to do on upgrade

When `@tuyau/core` is upgraded:

1. Check whether [#116](https://github.com/Julien-R44/tuyau/issues/116) (and [#115](https://github.com/Julien-R44/tuyau/issues/115)) are fixed upstream.
2. If fixed: delete `patches/@tuyau+core+*.patch` and this ADR becomes historical.
3. If not fixed: refresh the patch (`npx patch-package @tuyau/core` after re-applying the change to the new build output) and keep this ADR current.

## Consequences

- `npm run typecheck` is green and acts as a reliable verification gate again; it runs in CI (see `.github/workflows/ci.yml`).
- `npm install` / `npm ci` apply patches automatically via `postinstall`. `patch-package` is a regular (non-dev) dependency and the Dockerfile copies `patches/` into both deps stages, so the patch is also applied by `npm ci --omit=dev` in the production image build. Environments installed with `--ignore-scripts` skip the patch; it is type-only so runtime is unaffected, but `npm run typecheck` must never be run there.
- The `patches/` directory is committed and must be kept under review — any change to it is a dependency-level change.
- ADR 006 is superseded: `.adonisjs/` typecheck errors are no longer expected noise. Any new generated-file error is a real signal and must be investigated.
