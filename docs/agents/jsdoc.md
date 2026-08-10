# JSDoc Conventions

Every exported function, class, and public method gets JSDoc. No exception by layer — this applies equally to helpers, services, repositories, models, controllers, exceptions, transformers, events, listeners, mails, and middleware. Existing files missing it are a backlog item, not a documented alternative style.

## Template

```typescript
/**
 * One-line summary of what the method does.
 *
 * Optional second paragraph for non-obvious behavior, edge cases,
 * or why a particular approach was taken.
 *
 * @param paramName - What it represents, not just its type.
 * @returns What is returned, including null/undefined semantics.
 * @throws {SomeException} When and why.
 *
 * @example
 * const result = await thing.method(arg)
 */
```

## Conventions

- `@example` shows realistic usage, not a placeholder — copy-pasteable.
- `@throws` names the actual exception class, not just "an error".
- Use `{@link Type}` / `{@link Method}` for cross-references within JSDoc when referencing related types or methods in the same domain.
- Don't restate the TypeScript type in prose (`@param id - The id, a number`) — explain what it represents instead.
- Even a thin pass-through method (e.g. a one-line repository delegate, a controller `render()`) gets at least a one-line summary — skip the `@param`/`@returns` block only if there's genuinely nothing non-trivial to say about them.
