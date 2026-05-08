import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'

@inject()
export default class DashboardController {
  async render(ctx: HttpContext) {
    const { inertia } = ctx

    return inertia.render('core/cms/dashboard', {})
  }
}
