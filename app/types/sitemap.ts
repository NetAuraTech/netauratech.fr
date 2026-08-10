/**
 * Contract for a sitemap URL source.
 *
 * A contributor returns a list of absolute URLs to include in `sitemap.xml`.
 * Contributors are registered in the sitemap composition module
 * (`start/sitemap.ts`) — the same startup pattern as the dashboard
 * collectors — and aggregated by the {@link SitemapService}.
 */
export interface SitemapContributor {
  /**
   * Unique contributor name, used for logging and as a stable identifier
   * across the composition module.
   */
  readonly name: string

  /**
   * Collect the absolute URLs this contributor contributes to the sitemap.
   *
   * @returns Absolute URLs (with scheme and host) to include in `sitemap.xml`.
   */
  collect(): Promise<string[]>
}

/**
 * Lazily resolves a sitemap contributor instance — typically through the IoC
 * container, so contributors keep their constructor injection.
 */
export type SitemapContributorFactory = () => Promise<SitemapContributor>
