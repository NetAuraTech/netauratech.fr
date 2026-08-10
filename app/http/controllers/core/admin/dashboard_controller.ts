import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { I18nService } from '#services/i18n_service'
import { GetDashboardStatsAction } from '#actions/core/get_dashboard_stats_action'
import DashboardTransformer from '#transformers/dashboard_transformer'
import { buildDashboardPayload } from '#helpers/i18n_payloads/dashboard'

@inject()
export default class DashboardController {
  constructor(
    protected i18n: I18nService,
    protected getDashboardStatsAction: GetDashboardStatsAction
  ) {}

  /**
   * Renders the admin dashboard with aggregated CMS statistics and recent
   * activity, freshly computed on every request.
   */
  async render(ctx: HttpContext) {
    const { inertia } = ctx

    const stats = await this.getDashboardStatsAction.execute()

    return inertia.render('core/admin/dashboard', {
      stats: DashboardTransformer.transform(stats),
      translations: buildDashboardPayload(this.i18n),
    })
  }
}
