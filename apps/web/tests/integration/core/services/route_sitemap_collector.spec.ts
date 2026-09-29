import router from '@adonisjs/core/services/router';
import { test } from '@japa/runner';
import sitemapConfig from '#config/sitemap';
import { RouteSitemapCollector } from '#core/services/route_sitemap_collector';
import env from '#start/env';

/**
 * Integration tests for `RouteSitemapCollector`.
 *
 * The collector is exercised against a small set of `core.*.render` test
 * routes registered at module load time (before any `router.commit()` call
 * freezes registration). This verifies the real router introspection seam
 * plus the inclusion and exclusion rules.
 */

// Register throwaway `core.*.render` routes that exist only for these tests.
// They are never executed (closure handlers) — they only need to appear in the
// route table so the collector can enumerate them.
router.get('/test-front/about', () => '').as('core.test.about.render');
router.get('/test-front/blog/:slug', () => '').as('core.test.post.render');
router.post('/test-front/submit', () => '').as('core.test.submit.render');
router.get('/test-front/admin-ish', () => '').as('misc.test.nope');
router.get('/test-front/unnamed', () => '');

test.group('RouteSitemapCollector', (group) => {
	const baseExclusions = [...sitemapConfig.exclusions];

	group.each.setup(() => {
		sitemapConfig.exclusions.length = 0;
		sitemapConfig.exclusions.push(...baseExclusions);
	});

	test('collect() includes a parameter-free GET route named core.*.render', async ({ assert }) => {
		const collector = await import('#core/services/route_sitemap_collector').then((m) => new m.RouteSitemapCollector());

		const urls = await collector.collect();

		assert.include(urls, `${env.get('APP_URL')}/test-front/about`);
	});

	test('collect() excludes a core.*.render route with a path parameter', async ({ assert }) => {
		const collector = new RouteSitemapCollector();

		const urls = await collector.collect();

		assert.isFalse(urls.some((url) => url.includes('/test-front/blog/')));
	});

	test('collect() excludes a core.*.render route that is POST-only', async ({ assert }) => {
		const collector = new RouteSitemapCollector();

		const urls = await collector.collect();

		assert.isFalse(urls.some((url) => url.includes('/test-front/submit')));
	});

	test('collect() excludes a GET route named with a different prefix', async ({ assert }) => {
		const collector = new RouteSitemapCollector();

		const urls = await collector.collect();

		assert.isFalse(urls.some((url) => url.includes('/test-front/admin-ish')));
	});

	test('collect() excludes an unnamed GET route even under the front path', async ({ assert }) => {
		const collector = new RouteSitemapCollector();

		const urls = await collector.collect();

		assert.isFalse(urls.some((url) => url.includes('/test-front/unnamed')));
	});

	test('collect() excludes a route whose name is in the exclusions list', async ({ assert }) => {
		sitemapConfig.exclusions.push('core.test.about.render');
		const collector = new RouteSitemapCollector();

		const urls = await collector.collect();

		assert.isFalse(urls.some((url) => url.includes('/test-front/about')));
	});

	test('collect() excludes a route whose pattern is in the exclusions list', async ({ assert }) => {
		sitemapConfig.exclusions.push('/test-front/about');
		const collector = new RouteSitemapCollector();

		const urls = await collector.collect();

		assert.isFalse(urls.some((url) => url.includes('/test-front/about')));
	});

	test('collect() returns the contributor name "routes"', ({ assert }) => {
		const collector = new RouteSitemapCollector();

		assert.equal(collector.name, 'routes');
	});
});
