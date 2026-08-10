---
status: accepted
date: 2026-08-04
context:
  - The project is multilingual (en/fr) — UI labels come from translation keys
  - Browser E2E tests interact with real rendered pages via Playwright
  - A test broke because it located a button by its English label, which differed from another button's label after translation changes
  - Form helpers (`fillField`) already locate fields by `name` attribute, not by label
---

## Context

The CMS UI is translated (`resources/lang/en|fr`). Any selector based on visible text — `getByRole('button', { name: 'Apply template' })`, `getByText('Save')`, `getByLabel('Email')` — is coupled to:

1. **The active locale** — the same button renders "Apply template" in English and "Appliquer un modèle" in French.
2. **Wording drift** — rewording a translation key (e.g. "Apply" → "Confirm") breaks tests without any behavior change.

Real breakage observed: `template_apply.spec.ts` located the confirmation button with `getByRole('button', { name: 'Apply template', exact: true })`. The confirm button's label is `builder.apply_page_template.apply_button` ("Apply"), not "Apply template" — the locator silently matched the toolbar button behind the modal, the click re-toggled the modal, and the apply request was never sent.

## Decision

**Never locate an HTML element (button, input, link, menu item…) by a translated label or text string in tests. Locate by `name` attribute (preferred) or `id`.**

### Rationale

1. **Locale independence** — `name`/`id` attributes are not translated; tests pass regardless of the UI language.
2. **Refactoring safety** — rewording a translation key never breaks a selector.
3. **Unambiguity** — several elements may share a label ("Apply template" toolbar button vs "Apply" confirm button); `name` attributes are unique per page by convention.
4. **Consistency** — form fields are already located this way via `fillField(page, 'input', 'email', …)`; buttons and other elements follow the same rule.

### How to locate elements

| Element type     | Selector                              | Example                                                 |
| ---------------- | ------------------------------------- | ------------------------------------------------------- |
| Input / textarea | `fillField()` helper (by `name`)      | `await fillField(page, 'input', 'email', 'a@b.c')`      |
| Button           | `page.locator('button[name="…"]')`    | `page.locator('button[name="apply-template-confirm"]')` |
| Other element    | `page.locator('[name="…"]')` or `#id` | `page.locator('[data-template-preview]')`               |

### When no hook exists, add one — don't fall back to labels

If the target element has no `name` or `id`, add a `name` attribute to the component. The `Button` atom already forwards `name` to the underlying `<button>`:

```tsx
// inertia/pages/page/cms/edit.tsx
<Button variant="outline" fitContent name="apply-template-open" onClick={…}>
  <Icon name="LayoutTemplate" size={16} />
  {t('toolbar.apply_template')}
</Button>
```

On `<button type="button">`, the `name` attribute has no functional effect (only submit buttons include name/value in form data), so it is a free, stable hook.

### Use the provided helpers first

Before writing a raw locator, check `tests/helpers/browser/`:

- `login()` — authenticates via the real login form
- `fillField()` — fills by `name` with `pressSequentially()` so React `onChange` fires (Playwright's `fill()` does not)
- `visitPage()` — navigates and waits for `networkidle` (React hydration complete)
- `waitForInertiaResponse()` — captures the Inertia response while triggering the action
- `waitForBuilderReady()` — waits for the builder client app to mount

These helpers encode the timing and event-synchronization pitfalls already hit in this project. Reusing them is faster and safer than re-deriving them.

### Exception: test-created data

Selecting by text that the test itself created is acceptable — it is data, not a translation:

```ts
// The template name was seeded by the test — stable regardless of locale
await editor.getByRole('button', { name: 'ApplyFlow Template' }).click()
```

## Consequences

- New browser tests MUST NOT use `getByRole(…, { name: <translated label> })`, `getByText()`, or `getByLabel()` with translation-dependent strings.
- When an interactive element lacks a `name`/`id` hook, add one in the component as part of the test change.
- Code review checklist: any Playwright locator containing a literal UI string that comes from `resources/lang/` is a red flag unless it is test-seeded data.
- Existing tests using translated labels SHOULD be migrated opportunistically when touched.
