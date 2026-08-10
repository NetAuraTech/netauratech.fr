import type { DashboardCollector, DashboardStats } from '#types/dashboard'

/**
 * Lazily resolves a dashboard collector instance — typically through the IoC
 * container, so collectors keep their constructor injection.
 */
export type DashboardCollectorFactory<K extends keyof DashboardStats = keyof DashboardStats> =
  () => Promise<DashboardCollector<K>>

/**
 * Registry of dashboard section collectors.
 *
 * Populated once at startup by the composition module (`start/dashboard.ts`),
 * which is the only place knowing which domains exist in this flavor of the
 * application. `GetDashboardStatsAction` reads it to aggregate the dashboard
 * payload without knowing the contributing domains.
 */
export class DashboardRegistry {
  private factories = new Map<keyof DashboardStats, DashboardCollectorFactory>()

  /**
   * Register the collector factory for a dashboard section. Registering the
   * same section twice replaces the previous factory.
   *
   * @param section - Payload key the collector contributes to.
   * @param factory - Resolver returning the collector instance.
   *
   * @example
   * registry.register('page', () => app.container.make(PageDashboardCollector))
   */
  register<K extends keyof DashboardStats>(
    section: K,
    factory: DashboardCollectorFactory<K>
  ): void {
    this.factories.set(section, factory as DashboardCollectorFactory)
  }

  /**
   * List the registered sections and their collector factories, in
   * registration order.
   */
  entries(): [keyof DashboardStats, DashboardCollectorFactory][] {
    return [...this.factories.entries()]
  }
}
