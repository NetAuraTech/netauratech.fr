---
status: accepted
date: 2026-07-10
context:
  - throw MyException() is readable at the call site, a factory would not be
  - The base class centralizes rendering logic (handle + 3 overridable hooks)
  - Thin subclasses are a readability choice, not technical debt
---

## Context

An architectural review proposed grouping the 18 HTTP exceptions into a single factory, arguing that ~15 of them are 3-line classes.

## Decision

Keep one class per exception. Readability at the call site (`throw new ForbiddenException()`) is worth the cost of a 3-line file.

### Rationale

1. **Readability** — `throw new ForbiddenException()` is self-documenting; `throw HttpExceptionFactory.forbidden()` adds mental indirection with no gain.
2. **Rich base class** — the 3 overridable hooks (`details`, `i18nParams`, `redirectPath`) allow subclasses to override precisely what they need.
3. **IDE discovery** — each class is indexed individually by autocompletion, easier to find than an entry in a factory.

## Consequences

- Exceptions remain individual — this is a conscious readability choice.
- A cross-cutting test (`tests/unit/exceptions.spec.ts`) verifies that all codes exist in every locale.
