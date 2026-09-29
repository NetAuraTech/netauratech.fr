# HTTP Controllers

One controller = one action. `render()` serves the Inertia page; `execute()` performs the mutation. Add `destroy()` only when deleting a resource. Files go in `app/http/controllers/{domain}/{context}/{name}_controller.ts`.

**REST exception**: resource controllers in the `api/` context may group the handlers of a single REST resource — one controller per resource, one method per HTTP action (`index`, `show`, `store`, `update`, `destroy`, plus resource-specific actions like `publish`/`move`). They stay thin transport wrappers over domain actions and never duplicate business logic. This is the documented convention for the `/api/v1/admin/*` surface (spec #7), not an invitation to multi-action session controllers.

## Structure

```typescript
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ExampleController {
  constructor(protected service: SomeService) {}

  async render(ctx: HttpContext) {
    return ctx.inertia.render('path/to/page', {
      translations: {/* i18n */},
    })
  }

  async execute(ctx: HttpContext) {
    const data = await someValidator.validate(ctx.request.all())
    const user = ctx.auth.getUserOrFail()
    const result = await this.service.doAction(data, user.id)
    ctx.session.flash('success', ctx.i18n.t('message.key'))
    return ctx.response.redirect().toRoute('route.name')
  }
}
```

## Variants

- **API**: no `render()`; methods return JSON via `response.ok()`, `response.badRequest()`. Serialize with transformers (`#transformers/...`) + `ctx.serialize()`.
- **Collection** (admin index): no `execute()`; just `render()` + `destroy()` (+ optional custom actions like `setHomepage()`).
- **Execute-only** (front forms): no `render()`; called via POST or fetch, returns redirect.

## Conventions

- DI: always `@inject()` + constructor injection of services. Never touch Eloquent models directly — strict layering: controller → service → repository → model.
- Validation: import from `#validators/...`, validate before every service call.
- Inertia responses: always pass a `translations` payload with i18n keys.
- Auth: use `auth.getUserOrFail()` on authenticated routes.
- **Manual front pages are always served by controllers** — never an inline `inertia.render` in route declarations. The controller is where server-side resolution happens (e.g. `FindFileAction` → `FileTransformer`), so every future server-side need stays uniform across manual fronts.

## Documentation

See /docs/agents/jsdoc.md for JSDoc conventions on repository methods.
