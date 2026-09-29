import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { LogEntryFactory } from '#factories/log/log_entry_factory';
import { LogCategory, LogLevel } from '#log/types/logging';
import { createAdminUser } from '#tests/helpers/create_admin_user';
import { parseInertiaPage } from '#tests/helpers/inertia_page';

/** Every `message` rendered on the logs page, regardless of the filter applied. */
function renderedMessages(page: { props?: { entries?: { data?: Array<{ message?: string }> } } }) {
	return (page.props?.entries?.data ?? []).map((e) => e.message);
}

/**
 * Functional seam for the admin logs viewer (`GET /admin/logs`), replacing the
 * Playwright browser E2E. We assert the HTTP contract + the Inertia props a
 * client receives: the `logs.view` permission gate (403 for an authorized
 * admin without it), the rendered paginated entries, and the server-side level
 * and search filtering.
 */
test.group('Admin logs viewer', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('denies access to a user without the logs.view permission', async ({ client, assert }) => {
		const user = await createAdminUser({ email: 'no-logs-perm@example.com' });

		const res = await client.get('/admin/logs').loginAs(user).accept('json').send();

		res.assertStatus(403);
		assert.equal(res.body().error.code, 'E_FORBIDDEN');
	});

	test('renders persisted log entries for an authorized user', async ({ client, assert }) => {
		const user = await createAdminUser({
			email: 'logs-admin@example.com',
			permissionSlugs: ['logs.view'],
		});
		const marker = `functional_render_${Date.now()}`;
		await LogEntryFactory.merge({
			level: LogLevel.INFO,
			category: LogCategory.BUSINESS,
			message: `Business Event: ${marker}`,
		}).create();

		const res = await client.get('/admin/logs').loginAs(user).send();
		res.assertStatus(200);

		assert.include(renderedMessages(parseInertiaPage(res.text())), `Business Event: ${marker}`);
	});

	test('filters rendered entries by level', async ({ client, assert }) => {
		const user = await createAdminUser({
			email: 'logs-level@example.com',
			permissionSlugs: ['logs.view'],
		});
		const marker = `functional_level_${Date.now()}`;
		await LogEntryFactory.merge({
			level: LogLevel.ERROR,
			category: LogCategory.SYSTEM,
			message: `${marker} error entry`,
		}).create();
		await LogEntryFactory.merge({
			level: LogLevel.INFO,
			category: LogCategory.SYSTEM,
			message: `${marker} info entry`,
		}).create();

		const res = await client.get('/admin/logs?level=error').loginAs(user).send();
		const messages = renderedMessages(parseInertiaPage(res.text()));

		assert.include(messages, `${marker} error entry`);
		assert.notInclude(messages, `${marker} info entry`);
	});

	test('filters rendered entries by search term', async ({ client, assert }) => {
		const user = await createAdminUser({
			email: 'logs-search@example.com',
			permissionSlugs: ['logs.view'],
		});
		const needle = `functional_search_${Date.now()}`;
		await LogEntryFactory.merge({ message: `${needle} needle` }).create();
		await LogEntryFactory.merge({ message: 'unrelated haystack entry' }).create();

		const res = await client.get(`/admin/logs?search=${needle}`).loginAs(user).send();
		const messages = renderedMessages(parseInertiaPage(res.text()));

		assert.include(messages, `${needle} needle`);
		assert.notInclude(messages, 'unrelated haystack entry');
	});
});
