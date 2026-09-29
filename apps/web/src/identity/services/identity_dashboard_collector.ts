import { inject } from '@adonisjs/core';
import { UserRepository } from '#identity/repositories/user_repository';
import type { DashboardIdentitySection, DashboardCollector } from '#core/types/dashboard';

/**
 * Contributes the identity section of the admin dashboard: the total user
 * count and the users-by-role breakdown.
 *
 * Read-only: figures come from dedicated repository aggregates — no full
 * table loads — so the dashboard stays cheap as data grows.
 */
@inject()
export class IdentityDashboardCollector implements DashboardCollector<'identity'> {
	constructor(protected userRepository: UserRepository) {}

	/**
	 * Collect the identity dashboard section.
	 *
	 * @returns The total user count and the per-role breakdown.
	 */
	async collect(): Promise<DashboardIdentitySection> {
		const [users, usersByRole] = await Promise.all([this.userRepository.count(), this.userRepository.countByRole()]);

		return { users, usersByRole };
	}
}
