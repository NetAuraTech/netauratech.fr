# TOCTOU Protection

Time-of-check time-of-use (TOCTOU) vulnerabilities occur when a check and its subsequent action are not atomic — another process can modify the data between the two steps.

## Problem

The "check-then-act" pattern is used throughout this codebase:

```typescript
// Check
if (!(await User.findBy('slug', slug))) {
  throw new ResourceNotFoundException()
}

// Act (data may have changed between check and act)
const user = await User.findOrFail(id)
await user.something()
```

Database constraints (unique indexes, foreign keys) catch some violations but provide poor error messages and don't cover all race conditions.

## Solution

For operations where the data must remain consistent between verification and mutation, use **explicit row locking** within a transaction:

### PostgreSQL `SELECT FOR UPDATE`

```typescript
const result = await db.transaction(async (trx) => {
  const user = await User.query()
    .where('id', id)
    .forUpdate() // exclusive lock until commit/rollback
    .firstUsing trx

  if (!user) {
    throw new ResourceNotFoundException()
  }

  // Safe to mutate — no concurrent transaction can modify this row
  user.some_field = newValue
  await user.save({ client: trx })
})
```

### Key rules

1. **Lock early** — Acquire the lock on the first query inside the transaction. Do not do a separate check outside the transaction.
2. **Keep it short** — The locked row is blocked for other transactions. Hold the lock only as long as needed.
3. **Use `forUpdate()`** — This is the PostgreSQL mechanism. Use `forShare()` when multiple readers can coexist but writers are blocked.
4. **Always transact** — Row locks are released on commit or rollback. Never use `forUpdate()` outside a transaction.

## When to apply

Apply TOCTOU protection when:

- The operation is idempotency-sensitive (e.g., token verification, one-time actions).
- Multiple requests can target the same resource concurrently (e.g., concurrent password resets on the same account).
- Business correctness depends on the check and act being atomic.

Do not apply it for read-only operations or when eventual consistency is acceptable.

## Repository pattern

When adding a new repository method that involves check-then-act, consider whether it needs locking:

```typescript
async acquireAndMutate(id: string, mutation: (resource: Model) => Promise<void>): Promise<Model> {
  return db.transaction(async (trx) => {
    const resource = await this.model.query()
      .where('id', id)
      .forUpdate()
      .firstUsing(trx)

    if (!resource) throw new ResourceNotFoundException()

    await mutation(resource)
    return resource
  })
}
```

## Refactoring existing code

When refactoring a service that uses check-then-act on a sensitive resource, wrap the critical section in a transaction with `forUpdate()`. Prioritize operations involving:

- Token verification and consumption
- One-time actions (email verification, invitation acceptance)
- Financial or quota-sensitive mutations
