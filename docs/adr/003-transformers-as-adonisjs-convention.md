---
status: accepted
date: 2026-07-10
context:
  - AdonisJS provides BaseTransformer with pick() as a serialization convention
  - Transformers are thin (5-10 lines) but clear and conventional
  - Grouping them into a single ResponseSerializer would break the framework pattern
---

## Context

An architectural review proposed grouping the 9 individual transformers into a single `ResponseSerializer` module, arguing that each transformer is superficial — implementation as complex as the interface.

## Decision

Keep the AdonisJS convention of one transformer per model. The thinness of the modules is intentional: it follows the framework pattern and remains readable with no cognitive effort.

### Rationale

1. **Framework convention** — `BaseTransformer<T>` with `pick()` is the AdonisJS standard, recognized by contributors.
2. **Clarity** — one file per model, easy to find and modify.
3. **No complexity to consolidate** — removing `UserTransformer` would not create any complexity in the proposed ResponseSerializer.

## Consequences

- Transformers remain thin — this is a conscious choice, not technical debt.
- A future review should not propose grouping them again.
