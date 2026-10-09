import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { GetRobotsTxtAction } from '#core/actions/get_robots_txt_action';

test.group('GetRobotsTxtAction', () => {
	test('buildRobotsTxt() returns correct robots.txt content', async ({ assert }) => {
		const action = await app.container.make(GetRobotsTxtAction);

		const result = action.buildRobotsTxt('http://localhost:3000');

		assert.include(result, 'User-agent: *');
		assert.include(result, 'Allow: /');
		assert.include(result, 'Disallow: /admin/*');
		assert.include(result, 'Disallow: /settings/*');
		assert.include(result, 'Disallow: /api/*');
		assert.include(result, 'Sitemap: http://localhost:3000/sitemap.xml');
	});

	test('execute() returns robots.txt string', async ({ assert }) => {
		const action = await app.container.make(GetRobotsTxtAction);

		const result = await action.execute();

		assert.isString(result);
		assert.include(result, 'User-agent');
	});
});
