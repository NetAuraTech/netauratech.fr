# HTTP Controllers

One controller = one action. `render()` serves the Inertia page; `execute()` performs the mutation. Add `destroy()` only when deleting a resource. Files go in `app/{domain}/controllers/{context}/{name}_controller.ts` (per-domain co-location: the controller lives next to the domain's transformers, validators and routes, under the `app/` transport tree).

**REST exception**: resource controllers in the `api/` context may group the handlers of a single REST resource — one controller per resource, one method per HTTP action (`index`, `show`, `store`, `update`, `destroy`, plus resource-specific actions like `publish`/`move`). They stay thin transport wrappers over domain actions and never duplicate business logic. This is the documented convention for the `/api/v1/admin/*` surface (spec #7), not an invitation to multi-action session controllers.

**REST resource contract**: the `api/` controllers are one-line dispatchers over declarative REST resources (`*_resource.ts` files) co-located per domain in `app/{domain}/rest/` (imported via `#transport/{domain}/rest/...`). Each resource (e.g. `UsersResource`) declares its endpoints once against the shared `RestEndpoint` shape — input selection, `prepare`, Vine validator, domain action, optional `refetch`, transformer — and the adapters' `handle` runs the common transport pipeline (`#transport/core/rest/rest_adapter` for the JSON REST routes, `#transport/core/rest/page_adapter` for the session-rendered Inertia pages): `await handle(ctx, this.usersResource.endpoints.index)`. The shared pipeline (adapter, page adapter, registry hook) lives in `app/core/rest/`. Resources stay pure declarations; when adding a new admin REST resource, add a resource file in `app/{domain}/rest/`, wire the controllers as dispatchers over `endpoints`, and keep the controllers free of validation/serialization logic.

**Intentional exemptions** (deliberately plain controllers, not migration leftovers): one-off endpoints without a resource shape are exempt from the contract — auth flows (register, forgot / reset password, email verification, invitation acceptance, social login), token issuance and identity (`me`), file upload, preview tokens, and builder operations. They keep hand-rolled transport because forcing them through the resource contract would add indirection without consolidating any repeated plumbing.

## Structure

```typescript
import { inject } from '@adonisjs/core';
import type { HttpContext } from '@adonisjs/core/http';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';

@inject()
export default class ExampleController {
	constructor(protected service: SomeService) {}

	async render(ctx: HttpContext) {
		return renderInertiaPage(ctx.inertia, 'path/to/page', {
			translations: {/* i18n */},
		});
	}

	async execute(ctx: HttpContext) {
		const data = await someValidator.validate(ctx.request.all());
		const user = ctx.auth.getUserOrFail();
		const result = await this.service.doAction(data, user.id);
		ctx.session.flash('success', ctx.i18n.t('message.key'));
		return ctx.response.redirect().toRoute('route.name');
	}
}
```

## Variants

- **API**: no `render()`; methods return JSON via `response.ok()`, `response.badRequest()`. Serialize with the domain's transformers (`#transport/{domain}/transformers/...`) + `ctx.serialize()`.
- **Collection** (admin index): no `execute()`; just `render()` + `destroy()` (+ optional custom actions like `setHomepage()`).
- **Execute-only** (front forms): no `render()`; called via POST or fetch, returns redirect.

## Conventions

- DI: always `@inject()` + constructor injection of services. Never touch Eloquent models directly — strict layering: controller → service → repository → model.
- Validation: import from the domain's validators (`#transport/{domain}/validators/...`) or the shared core validators (`#transport/core/validators/...`, e.g. the pagination schema), validate before every service call.
- Routes: every domain self-registers from `app/{domain}/routes.ts` (co-located with its controllers), imported for side effect from `start/routes.ts` — a pure per-domain import list in stable order — and gated by its feature flags (`admin` / `adminApi` / `cms`, …) inside the module. `start/routes.ts` holds only explicit `register*` calls: the health probes (outside the maintenance middleware) and the CMS page-render catch-alls, which register last so they never shadow single-segment routes.
- Codegen: `adonisrc.ts` scans `app/` for `**/*_controller.ts` / `**/*transformer.ts` (import alias `#transport`), so a controller at `app/{domain}/controllers/{context}/{name}_controller.ts` is referenced as `controllers.{domain}.{context}.{Name}`.
- Inertia responses: always pass a `translations` payload with i18n keys, and render through the shared helper `renderInertiaPage(ctx.inertia, page, props)` from `#transport/core/helpers/inertia_render` — never `ctx.inertia.render` directly, which drops per-page prop type safety for pages carrying rich, non-JSON prop types.
- Auth: use `auth.getUserOrFail()` on authenticated routes.
- **Manual front pages are always served by controllers** — never an inline `inertia.render` in route declarations. The controller is where server-side resolution happens (e.g. `FindFileAction` → `FileTransformer`), so every future server-side need stays uniform across manual fronts.

## Documentation

See /docs/agents/jsdoc.md for JSDoc conventions on repository methods.
