import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { MaintenanceService } from '#core/services/maintenance_service';
import { createAdminUser, MAINTENANCE_PERMISSIONS } from '#tests/helpers/create_admin_user';
import { resetSharedState } from '#tests/helpers/shared_state';

/**
 * Functional seam for the admin maintenance settings endpoint.
 *
 * Exercises the `POST /admin/settings/maintenance` contract a browser observes
 * — the 302 redirect on save, the auth guard (unauthenticated) and permission
 * guard (insufficient scope) — and asserts the persisted maintenance config as
 * the observable effect. The HTTP 503/200 behaviour of the middleware is
 * covered separately in `maintenance_middleware.spec.ts`.
 */
test.group('Maintenance | Admin settings', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);

	test('redirects unauthenticated requests to login', async ({ client }) => {
		// Satisfy Shield's CSRF check so the request reaches the auth guard,
		// isolating the authentication requirement from the CSRF requirement.
		const res = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.withCsrfToken()
			.form({ enabled: 'on', message: 'Under maintenance' })
			.send();
		res.assertStatus(302);
		res.assertHeader('location', '/login');
	});

	test('rejects a user without the settings.maintenance permission (403)', async ({ client, assert }) => {
		const admin = await createAdminUser({ email: 'admin-no-maint@example.com' });

		const res = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.accept('json')
			.loginAs(admin)
			.withCsrfToken()
			.form({ enabled: 'on', message: 'Under maintenance' })
			.send();

		res.assertStatus(403);
		assert.equal(res.body().error.code, 'E_FORBIDDEN');
	});

	test('enables maintenance mode (admin with permission)', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-maint-enable@example.com',
			permissionSlugs: MAINTENANCE_PERMISSIONS,
		});

		const res = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.loginAs(admin)
			.withCsrfToken()
			.form({ enabled: 'on', message: 'Under maintenance' })
			.send();

		res.assertStatus(302);

		const service = await app.container.make(MaintenanceService);
		const config = await service.getConfig();
		assert.isOk(config.enabled);
		assert.equal(config.message, 'Under maintenance');
	});

	test('restricts maintenance mode to an IP allowlist', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-maint-allowlist@example.com',
			permissionSlugs: MAINTENANCE_PERMISSIONS,
		});

		const res = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.loginAs(admin)
			.withCsrfToken()
			.form({
				enabled: 'on',
				message: 'Under maintenance',
				allowed_ips: '127.0.0.1/32\n::1/128',
			})
			.send();

		res.assertStatus(302);

		const service = await app.container.make(MaintenanceService);
		const config = await service.getConfig();
		assert.isOk(config.enabled);
		assert.deepEqual(config.allowedIps, ['127.0.0.1/32', '::1/128']);
	});

	test('disables maintenance mode', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-maint-disable@example.com',
			permissionSlugs: MAINTENANCE_PERMISSIONS,
		});

		const enable = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.loginAs(admin)
			.withCsrfToken()
			.form({ enabled: 'on', message: 'Under maintenance' })
			.send();
		enable.assertStatus(302);

		const disable = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.loginAs(admin)
			.withCsrfToken()
			.form({ message: 'Under maintenance' })
			.send();
		disable.assertStatus(302);

		const service = await app.container.make(MaintenanceService);
		const config = await service.getConfig();
		assert.equal(config.enabled, false);
	});

	test('rejects an over-limit allowlist (config unchanged)', async ({ client, assert }) => {
		const admin = await createAdminUser({
			email: 'admin-maint-overflow@example.com',
			permissionSlugs: MAINTENANCE_PERMISSIONS,
		});

		const res = await client
			.post('/admin/settings/maintenance')
			.redirects(0)
			.loginAs(admin)
			.withCsrfToken()
			.form({
				enabled: 'on',
				allowed_ips: Array.from({ length: 101 }, (_, i) => `${i}.0.0.1/32`).join('\n'),
			})
			.send();

		res.assertStatus(302);

		const service = await app.container.make(MaintenanceService);
		const config = await service.getConfig();
		assert.equal(config.enabled, false);
		assert.deepEqual(config.allowedIps, []);
	});
});
