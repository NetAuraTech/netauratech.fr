import env from '#start/env';

/**
 * Configuration for `sitemap.xml` generation.
 *
 * Parsed once at boot from environment variables. The route and page
 * contributors read `exclusions` to filter their own output; the
 * {@link SitemapService} applies `manualAdditions` and a final
 * `exclusions` pass on the merged URL set.
 */
const sitemapConfig = {
	/**
	 * Extra URLs to inject into the sitemap that no contributor can enumerate —
	 * for example an externally-hosted landing page. Comma-separated in
	 * `SITEMAP_ADDITIONS`. Both absolute (`https://...`) and root-relative
	 * (`/path`) URLs are accepted; root-relative URLs are resolved against the
	 * application URL.
	 */
	manualAdditions: env
		.get('SITEMAP_ADDITIONS', '')
		.split(',')
		.map((url) => url.trim())
		.filter((url) => url.length > 0),

	/**
	 * URLs to strip from the sitemap, expressed as route names (`front.blog.*`),
	 * paths (`/blog`), or absolute URLs. Comma-separated in
	 * `SITEMAP_EXCLUSIONS`. Applied at both the contributor level (route names
	 * and patterns) and the service level (paths and absolute URLs), so an
	 * exclusion always wins over a contributor.
	 */
	exclusions: env
		.get('SITEMAP_EXCLUSIONS', '')
		.split(',')
		.map((value) => value.trim())
		.filter((value) => value.length > 0),
};

export default sitemapConfig;
