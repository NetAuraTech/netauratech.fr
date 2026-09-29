import { inject } from '@adonisjs/core';
import { DashboardRegistry } from '#core/services/dashboard_registry';
import { LogService } from '#log/services/log_service';
import { LogCategory } from '#log/types/logging';
import type { DashboardStats } from '#core/types/dashboard';

interface GetDashboardStatsPayload {
	/** Maximum number of entries per recent-activity list. Defaults to 5. */
	recentLimit?: number;
}

/** Default number of entries per recent-activity list. */
const DEFAULT_RECENT_LIMIT = 5;

/**
 * Aggregate the domain figures and recent activity shown on the admin dashboard.
 *
 * Orchestration only: the registered collectors (see {@link DashboardRegistry})
 * each compute their own domain section. All collectors run in parallel and
 * their results are assembled into a payload keyed by section, so a domain
 * absent from the registry simply disappears from the dashboard.
 */
@inject()
export class GetDashboardStatsAction {
	constructor(
		protected registry: DashboardRegistry,
		protected logService: LogService,
	) {}

	/**
	 * Execute the dashboard aggregation.
	 *
	 * A collector failure is logged and propagated: the request fails loudly
	 * instead of serving a partial dashboard.
	 *
	 * @param payload - Optional recent-activity list limit.
	 * @returns The aggregated {@link DashboardStats} snapshot, keyed by section.
	 *
	 * @example
	 * const stats = await getDashboardStatsAction.execute({ recentLimit: 5 })
	 */
	async execute(payload: GetDashboardStatsPayload = {}): Promise<DashboardStats> {
		const collectorPayload = { recentLimit: payload.recentLimit ?? DEFAULT_RECENT_LIMIT };

		const collected = await Promise.all(
			this.registry.entries().map(async ([section, makeCollector]) => {
				try {
					const collector = await makeCollector();
					return [section, await collector.collect(collectorPayload)] as const;
				} catch (error) {
					this.logService.error({
						message: `Dashboard collector "${String(section)}" failed`,
						category: LogCategory.SYSTEM,
						error,
					});
					throw error;
				}
			}),
		);

		return Object.fromEntries(collected) as DashboardStats;
	}
}
