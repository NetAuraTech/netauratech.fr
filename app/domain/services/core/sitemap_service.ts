import { inject } from '@adonisjs/core'
import env from '#start/env'
import sitemapConfig from '#config/sitemap'
import { SitemapRegistry } from '#services/core/sitemap_registry'

/** Characters that must be XML-escaped inside a `<loc>` value. */
const XML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

/**
 * Escape a URL for safe inclusion inside an XML `<loc>` element. Per the
 * sitemaps.org spec, entity-escaping is required for `&`, `<`, `>`, `'`, and
 * `"`. URLs produced by the built-in contributors never contain these
 * characters, so escaping is a no-op for them — it only matters for manual
 * additions carrying a query string.
 */
function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPE[char])
}

/**
 * Aggregates sitemap URLs from every registered contributor and wraps them in
 * the `sitemap.xml` envelope.
 *
 * The contributor set is registered once at startup in the composition module
 * (`start/sitemap.ts`); this service reads it through the
 * {@link SitemapRegistry} and stays agnostic of which domains exist in this
 * flavor. Manual additions from `config/sitemap.ts` are merged in, exclusions
 * are applied last (so they always win), and duplicate URLs are collapsed.
 */
@inject()
export class SitemapService {
  constructor(protected sitemapRegistry: SitemapRegistry) {}

  /**
   * Collect URLs from every contributor, merge manual additions, apply
   * exclusions, and return the complete `sitemap.xml` document.
   *
   * @returns A complete `sitemap.xml` XML string.
   *
   * @example
   * const xml = await sitemapService.generate()
   */
  async generate(): Promise<string> {
    const urls = await this.collectUrls()
    return this.buildXml(urls)
  }

  /**
   * Wrap a list of absolute URLs in the `sitemap.xml` envelope. Exposed so the
   * envelope shape can be tested independently of contributors.
   *
   * @param urls - Absolute URLs to list in the document.
   * @returns A complete `sitemap.xml` XML string.
   *
   * @example
   * const xml = sitemapService.buildXml(['https://example.com/about'])
   */
  buildXml(urls: string[]): string {
    let xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    for (const url of urls) {
      xml += `\n  <url><loc>${escapeXml(url)}</loc></url>`
    }
    xml += '\n</urlset>'
    return xml
  }

  /**
   * Collect URLs from every registered contributor, merge manual additions,
   * deduplicate, and drop excluded entries.
   *
   * @returns The final, deduplicated, exclusion-filtered list of URLs.
   */
  protected async collectUrls(): Promise<string[]> {
    const seen = new Set<string>()

    for (const [, factory] of this.sitemapRegistry.entries()) {
      const contributor = await factory()
      for (const url of await contributor.collect()) seen.add(url)
    }

    for (const addition of sitemapConfig.manualAdditions) {
      seen.add(this.normalizeAddition(addition))
    }

    return [...seen].filter((url) => !this.isExcluded(url))
  }

  /**
   * Resolve a manual addition to an absolute URL. Absolute URLs are kept
   * as-is; root-relative URLs are resolved against the application URL.
   *
   * @param addition - An absolute or root-relative URL.
   * @returns The absolute URL to include.
   */
  protected normalizeAddition(addition: string): string {
    if (/^https?:\/\//i.test(addition)) return addition
    return `${env.get('APP_URL')}${addition.startsWith('/') ? addition : `/${addition}`}`
  }

  /**
   * Whether a URL is excluded by `config/sitemap.ts`. Matches against the full
   * absolute URL and against its pathname, so exclusions can be expressed
   * either way.
   */
  protected isExcluded(url: string): boolean {
    const exclusions = sitemapConfig.exclusions
    if (exclusions.includes(url)) return true
    try {
      return exclusions.includes(new URL(url).pathname)
    } catch {
      return false
    }
  }
}
