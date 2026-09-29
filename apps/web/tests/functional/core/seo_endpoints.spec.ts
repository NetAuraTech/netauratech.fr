import { test } from '@japa/runner';
import env from '#start/env';

/**
 * Core functional tests for the SEO endpoints `/robots.txt` and
 * `/sitemap.xml`.
 *
 * These verify the content type and base structure of the responses. Tests
 * that CMS page URLs surface in the sitemap live in
 * `tests/functional/cms/seo_endpoints_cms.spec.ts` so the `inertia` flavor
 * can prune them.
 */
test.group('SEO endpoints (core)', () => {
	test('GET /robots.txt returns the robots body with a text/plain content type', async ({ client, assert }) => {
		const res = await client.get('/robots.txt');

		res.assertStatus(200);
		assert.include(res.header('content-type'), 'text/plain');
		assert.include(res.text(), 'User-agent: *');
		assert.include(res.text(), 'Allow: /');
		assert.include(res.text(), `Sitemap: ${env.get('APP_URL')}/sitemap.xml`);
	});

	test('GET /sitemap.xml returns an XML document with the sitemap content type', async ({ client, assert }) => {
		const res = await client.get('/sitemap.xml');

		res.assertStatus(200);
		assert.include(res.header('content-type'), 'application/xml');
		assert.include(res.text(), '<?xml version="1.0" encoding="UTF-8"?>');
		assert.include(res.text(), '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		assert.include(res.text(), '</urlset>');
	});
});
