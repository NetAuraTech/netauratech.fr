---
status: accepted
date: 2026-08-20
supersedes:
  - 007
  - 008
context:
  - ADR 007 mandated browser E2E tests for every authenticated flow, citing `loginAs()` flakiness and missing React hydration
  - `@japa/api-client` reliably drives session-guarded flows: `.loginAs()` + `.withCsrfToken()` + explicit redirect control (`redirects(0)`)
  - Inertia pages embed their full props in the server-rendered `data-page` attribute, so HTTP responses carry the same payload the browser would hydrate
  - The Playwright suite added a slow CI job, browser downloads, and helper coupling the test matrix to the rendered DOM
  - Issue #135 directed migrating all `tests/browser/*` specs to functional tests
---

## Context

ADR 007 (2026-08-04) established that authenticated flows must be tested with Playwright browser E2E because functional tests with `loginAs()` were flaky and Inertia forms rely on React hydration. The entire `tests/browser/` suite (auth, CMS, builder, templates, dashboard, logs, maintenance) grew on that premise.

In practice the functional suite proved sufficient for every one of those flows once written against the right seams:

1. **Session auth is reliable.** `client.<method>().loginAs(user)` plus `.withCsrfToken()` on state-changing requests exercises the same guard + CSRF + session middleware stack as a browser. Redirect outcomes are asserted with `.redirects(0)` instead of following them.
2. **Inertia payloads are server-rendered.** The rendered HTML carries the full props JSON in the `data-page` attribute; parsing it asserts the exact state the frontend would hydrate — without executing JavaScript.
3. **Browser-specific value was limited to UI interaction fidelity** (typing into React forms, DOM selectors), which the functional tier deliberately does not test.

Keeping the browser suite in parallel doubled maintenance: every flow needed a browser spec _and_ often a functional assertion, and the Playwright tooling (browser binaries, a dedicated CI job, DOM-stability helpers from ADR 008) taxed every merge.

## Decision

**The functional suite (`@japa/api-client`) is the single HTTP test tier. The `browser` Japa suite, `@japa/browser-client`, `@playwright/test` and all Playwright-only test helpers are removed.**

- Authenticated flows are written as functional tests: `loginAs()` for the session guard, `.withCsrfToken()` for mutations, `redirects(0)` to assert raw 302/303 outcomes.
- Inertia page state is asserted by parsing the `data-page` attribute of the rendered HTML.
- Client-side-only behavior (React picker state, DOM interactions that produce no server request) is either covered by the Vitest frontend unit tier or intentionally left to manual verification; it is no longer a gap the E2E tier must fill.

## Consequences

- ADR 007's "browser E2E for authenticated flows" rule and ADR 008's Playwright selector conventions are obsolete — both are marked superseded. ADR 008's underlying principle (stable, locale-independent hooks: `name`/`id` attributes) still informs component design but no longer constrains tests.
- All 18 `tests/browser/*` specs were migrated to `tests/functional/*` (auth session/self-service flows, CMS template/builder flows, dashboard, audit logs) or verified already covered by existing functional specs (maintenance middleware + admin REST maintenance endpoints).
- CI no longer installs browsers or runs a `browser-tests` job; the functional suite runs in the standard backend test matrix.
- Flavor prune manifests (`api`, `inertia`) no longer carry browser-spec or Playwright-helper inventory; session-based functional specs are pruned per flavor like any other flavor-foreign file.
