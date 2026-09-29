import { inject } from '@adonisjs/core';
import router from '@adonisjs/core/services/router';
import sitemapConfig from '#config/sitemap';
import env from '#start/env';
import type { SitemapContributor } from '#core/types/sitemap';
import type { RouteJSON } from '@adonisjs/core/types/http';

/**
 * Always-present sitemap contributor that enumerates hand-written public pages.
 *
 * Every GET route whose name starts with `core.` and ends with `.render` and
 * whose pattern carries no path parameter is included, which lets developers
 * add a static front route (`router.get('/about').as('core.about.render')`) and
 * see it in the sitemap with no further wiring. Parameterised, non-GET,
 * unnamed, and non-`core.*.render` routes are excluded by construction — so
 * auth, admin, and API routes never leak, and the core utility routes
 * (`core.sitemap.show`, `core.robots.show`) stay out of the sitemap.
 *
 * Route names and patterns listed in `config/sitemap.ts` `exclusions` are
 * dropped here, before URL construction.
 */
@inject()
export class RouteSitemapCollector implements SitemapContributor {
	readonly name = 'routes';

	/**
	 * Enumerate the collectable `core.*.render` routes as absolute URLs.
	 *
	 * @returns Absolute URLs for every parameter-free GET route named
	 * `core.*.render`, minus exclusions.
	 */
	async collect(): Promise<string[]> {
		router.commit();

		const baseUrl = env.get('APP_URL');
		const routes = Object.values(router.toJSON()).flat() as RouteJSON[];

		return routes.filter((route) => this.isCollectable(route)).map((route) => `${baseUrl}${route.pattern}`);
	}

	/**
	 * Whether a route should appear in the sitemap.
	 *
	 * A route is collectable when it is named `core.*.render`, responds to GET,
	 * has a parameter-free pattern, and is not excluded by name or pattern.
	 *
	 * @param route - A serialized route from `router.toJSON()`.
	 */
	protected isCollectable(route: RouteJSON): boolean {
		if (!route.name || !route.name.startsWith('core.') || !route.name.endsWith('.render')) return false;
		if (!route.methods.includes('GET')) return false;
		if (route.pattern.includes(':') || route.pattern.includes('*')) return false;

		const exclusions = sitemapConfig.exclusions;
		if (exclusions.includes(route.name)) return false;
		if (exclusions.includes(route.pattern)) return false;

		return true;
	}
}
