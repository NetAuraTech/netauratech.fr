---
status: accepted
date: 2026-06-21
context:
  - Infrastructure backends (cache, storage) must be swappable without changing call sites
  - Some services need namespacing and path prefixing on top of the raw driver
  - Not all infrastructure follows the same abstraction pattern
---

## Context

AdonisJS provides built-in drivers for caching (Redis via `@adonisjs/redis`) and storage (`@adonisjs/drive`). Using them directly couples application code to the framework API — swapping Redis for Memcached or S3 for R2 requires changing every call site.

Two abstraction patterns exist in this codebase:

| Pattern               | Example                                  | Trait                                                                            |
| --------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| **Contract + Facade** | `CacheDriver` interface + `CacheService` | Full abstraction; driver injected via IoC; facade adds namespacing               |
| **Thin wrapper**      | `StorageService`                         | Wraps AdonisJS Drive directly; adds path prefixing and env-based disk resolution |

## Decision

Use the **contract + facade** pattern when:

- The backend may be swapped in the future (e.g., Redis to Memcached).
- Multiple implementations need a shared interface.
- The service benefits from cross-cutting concerns like namespacing or key prefixing.

Use a **thin wrapper** when:

- The underlying driver is stable and unlikely to change.
- The only added value is path prefixing, env resolution, or minor convenience methods.
- A full contract would add ceremony without tangible benefit.

### Contract pattern structure

```
app/domain/contracts/{area}/
  └── {name}_driver.ts    # Interface with JSDoc per method

app/domain/services/{area}/
  └── {name}_service.ts   # Facade that delegates to the driver + adds cross-cutting concerns
```

The facade is injected via IoC (`start/container.ts`). Swapping backend = new class implementing the contract + updated binding. No call-site changes.

### Thin wrapper structure

A single service file that imports the AdonisJS driver directly and adds a thin layer of convenience (prefixing, env resolution). No separate contract interface.

## Consequences

- **Positive**: Contract-backed services are fully swappable; thin wrappers stay simple when swapping is not a concern.
- **Negative**: Two patterns coexist — new contributors must understand when to use which. The decision rule above should be referenced when adding new infrastructure services.
