import { inject } from '@adonisjs/core'
import { UserRepository } from '#repositories/auth/user_repository'
import type { DashboardAuthSection, DashboardCollector } from '#types/dashboard'

/**
 * Contributes the auth section of the admin dashboard: the total user count
 * and the users-by-role breakdown.
 *
 * Read-only: figures come from dedicated repository aggregates — no full
 * table loads — so the dashboard stays cheap as data grows.
 */
@inject()
export class AuthDashboardCollector implements DashboardCollector<'auth'> {
  constructor(protected userRepository: UserRepository) {}

  /**
   * Collect the auth dashboard section.
   *
   * @returns The total user count and the per-role breakdown.
   */
  async collect(): Promise<DashboardAuthSection> {
    const [users, usersByRole] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countByRole(),
    ])

    return { users, usersByRole }
  }
}
