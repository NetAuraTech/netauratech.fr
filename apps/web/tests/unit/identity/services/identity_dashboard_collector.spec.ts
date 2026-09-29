import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { UserFactory, RoleFactory } from '#factories/identity/user_factory';
import { IdentityDashboardCollector } from '#identity/services/identity_dashboard_collector';

/**
 * The test database is not truncated between tests, so count assertions are
 * expressed as deltas against a baseline snapshot taken before seeding.
 */
test.group('IdentityDashboardCollector', () => {
	test('collect() returns the user count matching seeded data', async ({ assert }) => {
		const collector = await app.container.make(IdentityDashboardCollector);
		const before = await collector.collect();

		await UserFactory.createMany(2);

		const after = await collector.collect();

		assert.equal(after.users, before.users + 2);
	});

	test('collect() breaks down user counts by role, most populous first', async ({ assert }) => {
		const collector = await app.container.make(IdentityDashboardCollector);
		const before = await collector.collect();
		const beforeNoRole = before.usersByRole.find((entry) => entry.name === null)?.count ?? 0;

		const adminRole = await RoleFactory.merge({ name: 'dash-admin' }).create();
		const editorRole = await RoleFactory.merge({ name: 'dash-editor' }).create();
		await UserFactory.merge({ roleId: adminRole.id }).createMany(2);
		await UserFactory.merge({ roleId: editorRole.id }).createMany(3);
		await UserFactory.merge({ roleId: null }).create();

		const section = await collector.collect();

		const admin = section.usersByRole.find((entry) => entry.name === 'dash-admin');
		const editor = section.usersByRole.find((entry) => entry.name === 'dash-editor');
		const noRole = section.usersByRole.find((entry) => entry.name === null);

		assert.equal(admin?.count, 2);
		assert.equal(editor?.count, 3);
		assert.equal(noRole?.count, beforeNoRole + 1);
		// Most populous first: editor (3) sorts ahead of admin (2).
		const editorIndex = section.usersByRole.findIndex((entry) => entry.name === 'dash-editor');
		const adminIndex = section.usersByRole.findIndex((entry) => entry.name === 'dash-admin');
		assert.isBelow(editorIndex, adminIndex);
	});
});
