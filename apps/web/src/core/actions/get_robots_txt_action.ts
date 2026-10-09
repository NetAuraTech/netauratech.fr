import { inject } from '@adonisjs/core';
import env from '#start/env';

/**
 * Generate a robots.txt string for the site.
 */
@inject()
export class GetRobotsTxtAction {
	/**
	 * Execute robots.txt generation.
	 *
	 * @returns The complete robots.txt string.
	 */
	async execute(): Promise<string> {
		const appUrl = env.get('APP_URL') ?? 'http://localhost:3000';
		return this.buildRobotsTxt(appUrl);
	}

	/**
	 * Constructs the robots.txt content.
	 *
	 * The authenticated back-office (`/admin`, `/settings`) and the versioned
	 * REST API (`/api/*`) are kept out of the crawl space: they are session- or
	 * token-gated and carry no public SEO value.
	 */
	buildRobotsTxt(appUrl: string): string {
		const lines = [
			'User-agent: *',
			'Allow: /',
			'Disallow: /admin/*',
			'Disallow: /settings/*',
			'Disallow: /api/*',
			'',
			`Sitemap: ${appUrl}/sitemap.xml`,
		];
		return lines.join('\n') + '\n';
	}
}
