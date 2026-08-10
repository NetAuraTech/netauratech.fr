# Validators

VineJS schemas live in `app/validators/{domain}.ts`, grouped by domain (not one file per endpoint). Exported as `camelCaseValidator` constants or factory functions.

> **CMS exception (ADR-0001):** CMS validators (page, template, builder, contact) live in `app/cms/validators/`, imported via `#cms/validators/...`. The layout above applies to everything outside the CMS module.

## Two forms

**Plain validator** — no dynamic context needed:

```typescript
export const showFileValidator = vine.create({
  id: vine.number().positive(),
})
```

**Factory function** — use only when the schema needs a closure over a runtime value, almost always for uniqueness checks that must exclude the current record (e.g. "email must be unique, except for this user's own current email"):

```typescript
export const updateEmailValidator = (id: User['id']) =>
  vine.create({
    email: email().unique(async (query, value) => {
      const user = await query.from('users').where('email', value).whereNot('id', id).first()
      return !user
    }),
  })
```

Don't default to a factory function — only reach for it when a plain `vine.create()` can't express the constraint.

## Conventions

- Shared field rules (`email()`, `password()`, `slug()`) are defined as local arrow functions at the top of the file and reused across that domain's validators — don't duplicate the same `.string().trim().email()...` chain inline more than once in a file.
- Domain-grouped, not endpoint-grouped: all validators for "page" operations live in `page.ts`, not split into `create_page_validator.ts`, `update_page_validator.ts`, etc.
- Optional fields on update validators use `.optional()`; required fields stay required even on update unless explicitly partial.
- Complex or dynamic per-operation payloads (e.g. builder operations with many op-specific shapes) validate only the common envelope strictly and accept `vine.any()` for op-specific fields, deferring detailed shape validation to the service layer.
