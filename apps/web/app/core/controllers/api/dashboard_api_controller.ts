import { inject } from '@adonisjs/core';
import { GetDashboardStatsAction } from '#core/actions/get_dashboard_stats_action';
import DashboardTransformer from '#transport/core/transformers/dashboard_transformer';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * GET /api/v1/admin/dashboard — aggregated CMS statistics for admin dashboards.
 */
@inject()
export default class DashboardApiController {
	constructor(protected getDashboardStatsAction: GetDashboardStatsAction) {}

	async index({ serialize }: HttpContext) {
		const stats = await this.getDashboardStatsAction.execute();
		return serialize(DashboardTransformer.transform(stats));
	}
}
