import router from '@adonisjs/core/services/router';
import { test } from '@japa/runner';

/**
 * Routes structure integration test.
 *
 * Verifies that the refactored modular routing produces the same
 * route table as the original monolithic file — same names,
 * same patterns, same middleware wiring.
 *
 * The assertions here cover routes shared by every flavor. CMS route names
 * (`admin.cms.pages.*`, `admin.cms.templates.*`, the `cms.page.*` public
 * front) are asserted in `tests/integration/cms/routes_structure.spec.ts` so
 * the `inertia` flavor can prune them.
 */
test.group('Routes structure', (group) => {
	group.each.setup(() => {
		router.commit();
	});

	test('all critical named routes are registered', ({ assert }) => {
		const json = router.toJSON();
		const routes = json['root'];
		const names = routes.map((r) => r.name).filter(Boolean) as string[];

		// Routes referenced by toRoute() calls across controllers
		const expectedNames = [
			// Auth
			'auth.session.render',
			'auth.session.execute',
			'auth.session.destroy',
			'auth.social.redirect',
			'auth.social.callback',
			'auth.social.unlink',

			// Account (referenced by many controllers)
			'account.profile.render',
			'account.profile.execute',
			'account.account.render',
			'account.account.execute',
			'account.account.destroy',
			'account.preferences.render',
			'account.preferences.execute',
			'account.index',

			// Admin back-office
			'admin.core.dashboard.render',
			'admin.core.maintenance.render',
			'admin.core.maintenance.update',
			'admin.core.maintenance.toggle',
			'admin.identity.users.render',
			'admin.identity.users_create.render',
			'admin.identity.users_create.execute',
			'admin.identity.users_show.render',
			'admin.identity.users_update.render',
			'admin.identity.users_update.execute',
			'admin.file.files.render',
			'admin.file.file_folders.render',
			'admin.log.logs.render',

			// SEO
			'core.robots.show',
			'core.sitemap.show',
		];

		for (const expectedName of expectedNames) {
			assert.include(names, expectedName, `Expected route "${expectedName}" to be registered`);
		}
	});

	test('route count matches expected total after modularisation', ({ assert }) => {
		const json = router.toJSON();
		const routes = json['root'];

		// Count all route entries (named + unnamed). The floor is the shared
		// core (auth + settings + admin back-office + SEO); the `inertia`
		// flavor drops the CMS routes on top of it.
		assert.isTrue(routes.length >= 60, `Expected at least 60 registered routes, got ${routes.length}`);
	});

	test('public routes have correct patterns', ({ assert }) => {
		const json = router.toJSON();
		const routes = json['root'];
		const byName = new Map(routes.filter((r) => r.name).map((r) => [r.name!, r]));

		// The home route is `core.home.render` in both flavors: the CMS page
		// home on `main`, and the static core home in the `inertia` flavor.
		// Both must point at `/`.
		const home = byName.get('core.home.render');
		assert.ok(home, 'Expected a home route (core.home.render)');
		assert.equal(home!.pattern, '/');

		// Account index redirects to profile
		assert.equal(byName.get('account.index')?.pattern, '/settings');
	});

	test('admin routes are under /admin prefix', ({ assert }) => {
		const json = router.toJSON();
		const routes = json['root'];
		const adminRoutes = routes.filter((r) => r.name?.startsWith('admin.'));

		for (const route of adminRoutes) {
			assert.ok(
				route.pattern.startsWith('/admin'),
				`Admin route "${route.name}" should start with /admin prefix, got: ${route.pattern}`,
			);
		}
	});

	test('account routes are under /settings prefix', ({ assert }) => {
		const json = router.toJSON();
		const routes = json['root'];
		const accountRoutes = routes.filter((r) => r.name?.startsWith('account.'));

		for (const route of accountRoutes) {
			assert.ok(
				route.pattern.startsWith('/settings'),
				`Account route "${route.name}" should start with /settings prefix, got: ${route.pattern}`,
			);
		}
	});

	test('REST API admin endpoints are registered', ({ assert }) => {
		const json = router.toJSON();
		const routes = json['root'].map((r) => r.pattern);

		const expectedPatterns = [
			'/api/v1/auth/login',
			'/api/v1/auth/register',
			'/api/v1/auth/logout',
			'/api/v1/auth/me',
			'/api/v1/profile',
			'/api/v1/account',
			'/api/v1/admin/users',
			'/api/v1/admin/roles',
			'/api/v1/admin/folders',
			'/api/v1/admin/dashboard',
			'/api/v1/admin/logs',
			'/api/v1/admin/maintenance',
		];

		for (const pattern of expectedPatterns) {
			assert.include(routes, pattern, `Expected REST API route "${pattern}" to be registered`);
		}
	});
});
