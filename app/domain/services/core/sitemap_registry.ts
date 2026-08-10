import type { SitemapContributorFactory } from '#types/sitemap'

/**
 * Registry of sitemap contributors.
 *
 * Populated once at startup by the composition module (`start/sitemap.ts`),
 * which is the only place knowing which domains exist in this flavor of the
 * application. The {@link SitemapService} reads it to aggregate URLs without
 * knowing the contributing domains.
 */
export class SitemapRegistry {
  private factories = new Map<string, SitemapContributorFactory>()

  /**
   * Register a contributor factory. Registering the same name twice replaces
   * the previous factory.
   *
   * @param name - Unique contributor name.
   * @param factory - Resolver returning the contributor instance.
   *
   * @example
   * registry.register('routes', () => app.container.make(RouteSitemapCollector))
   */
  register(name: string, factory: SitemapContributorFactory): void {
    this.factories.set(name, factory)
  }

  /**
   * List the registered contributor names and their factories, in registration
   * order.
   */
  entries(): [string, SitemapContributorFactory][] {
    return [...this.factories.entries()]
  }
}
