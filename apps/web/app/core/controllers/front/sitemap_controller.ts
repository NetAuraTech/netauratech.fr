import { inject } from '@adonisjs/core';
import { SitemapService } from '#core/services/sitemap_service';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Serves `sitemap.xml` for search engines.
 *
 * The XML document is assembled by the {@link SitemapService} from every
 * registered contributor, so this controller is transport only — it carries no
 * domain knowledge of which URLs appear in the sitemap.
 */
@inject()
export default class SitemapController {
	constructor(protected sitemapService: SitemapService) {}

	/**
	 * `GET /sitemap.xml`
	 *
	 * @returns The complete `sitemap.xml` document with an XML content type.
	 */
	async show({ response }: HttpContext) {
		const xml = await this.sitemapService.generate();

		return response.header('Content-Type', 'application/xml').header('Cache-Control', 'public, max-age=3600').send(xml);
	}
}
