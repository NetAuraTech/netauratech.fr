---
status: accepted
date: 2026-08-04
context:
  - Functional tests use Japa's API client (`client.get()`, `client.post()`)
  - Browser E2E tests use Playwright via Japa's browser client (`visit`, `page`)
  - Inertia form submissions rely on React state synchronized via DOM events
  - Japa's API client does not execute JavaScript — no React hydration occurs
  - Session cookies are not persisted across API client requests in some cases
---

## Context

This project has two test tiers for HTTP behavior:

| Tier        | Tooling                             | JavaScript | Auth persistence |
| ----------- | ----------------------------------- | ---------- | ---------------- |
| Functional  | `@japa/api-client`                  | No         | Unreliable       |
| Browser E2E | `@japa/browser-client` (Playwright) | Yes        | Reliable         |

Functional tests with authentication fail intermittently with Inertia because:

1. **No React hydration** — Inertia forms depend on React event handlers (`onChange`, `onInput`) to synchronize state. The API client sends raw HTTP requests without executing JavaScript, so the request body contains stale or empty values.
2. **Auth session loss** — the API client's `loginAs()` helper does not reliably persist session cookies across requests in the functional suite, causing 302 redirects to login instead of the expected response.

Browser E2E tests solve both problems by running a real Chromium instance: React hydrates, form state updates via `pressSequentially()`, and session cookies persist naturally.

## Decision

**Prefer browser E2E tests over functional tests whenever authentication is required.**

### Rationale

1. **Reliability** — browser tests authenticate once via the `login()` helper and maintain the session through real cookie handling. Functional tests with `loginAs()` are flaky.
2. **Inertia fidelity** — form submissions in browser tests exercise the exact same code path as production: React state → Inertia router → AdonisJS controller. Functional tests bypass React entirely.
3. **Helper ecosystem** — the project already provides battle-tested browser helpers (`login`, `fillField`, `visitPage`, `waitForInertiaResponse`) that handle timing and event synchronization correctly.
4. **Debugging** — browser failures produce screenshots and traces; functional failures produce raw HTTP logs that are harder to interpret for UI flows.

### When functional tests are still appropriate

- **Public API endpoints** (no auth required) that return JSON.
- **Token-protected routes** where the token is passed as a query parameter or header, and the response is not an Inertia page.
- **Unit-level HTTP validation** (e.g., testing VineJS validators in isolation via `request.validateUsing()`).

### Migration pattern

When converting a functional test to browser E2E:

```typescript
// Before: functional test (flaky with auth)
const response = await client
  .post(route('admin.templates.update', { id: template.id }))
  .json({ name: 'Updated' })
  .loginAs(admin)

// After: browser E2E test (reliable)
await login(route('auth.session.render'), visit, admin.email, 'TestPassword123!')
const page = await visitPage(route('admin.templates.edit', { id: template.id }), visit)
await fillField(page, 'input', 'name', 'Updated')
const response = await waitForInertiaResponse(page, '/admin/templates/', () =>
  page.getByRole('button', { name: /Save changes/i }).click()
)
```

Key helpers:

- `login()` — authenticates via the real login form, waits for redirect
- `fillField()` — uses `pressSequentially()` to trigger React `onChange` events
- `visitPage()` — waits for `networkidle` so React hydration completes
- `waitForInertiaResponse()` — captures the Inertia response while triggering an action

## Consequences

- New tests requiring authentication MUST be written as browser E2E tests.
- Existing functional tests with auth SHOULD be migrated opportunistically when touched.
- The functional suite remains for unauthenticated API endpoints and validator unit tests.
- CI must run the browser suite with a display server (Playwright headless) — already configured in the project.
