import { test } from '@japa/runner'
import router from '@adonisjs/core/services/router'

/**
 * Routes structure integration test.
 *
 * Verifies that the refactored modular routing produces the same
 * route table as the original monolithic file — same names,
 * same patterns, same middleware wiring.
 *
 * The assertions here cover routes shared by every flavor. CMS route names
 * (`admin.pages.*`, `admin.templates.*`, the `page.*` public front) are
 * asserted in `tests/integration/routes_structure_cms.spec.ts` so the
 * `inertia` flavor can prune them.
 */
test.group('Routes structure', (group) => {
  group.each.setup(() => {
    router.commit()
  })

  test('all critical named routes are registered', ({ assert }) => {
    const json = router.toJSON()
    const routes = json['root']
    const names = routes.map((r) => r.name).filter(Boolean) as string[]

    // Routes referenced by toRoute() calls across controllers
    const expectedNames = [
      // Auth
      'auth.session.render',
      'auth.session.execute',
      'auth.session.destroy',
      'auth.social.redirect',
      'auth.social.callback',
      'auth.social.unlink',

      // Settings (referenced by many controllers)
      'settings.profile.render',
      'settings.profile.execute',
      'settings.account.render',
      'settings.account.execute',
      'settings.account.destroy',
      'settings.preferences.render',
      'settings.preferences.execute',
      'settings.index',

      // Admin back-office
      'admin.dashboard.render',
      'admin.users.render',
      'admin.users_create.render',
      'admin.users_create.execute',
      'admin.users_show.render',
      'admin.users_update.render',
      'admin.users_update.execute',
      'admin.files.render',
      'admin.file_folders.render',

      // SEO
      'robots.show',
      'sitemap.show',
    ]

    for (const expectedName of expectedNames) {
      assert.include(names, expectedName, `Expected route "${expectedName}" to be registered`)
    }
  })

  test('route count matches expected total after modularisation', ({ assert }) => {
    const json = router.toJSON()
    const routes = json['root']

    // Count all route entries (named + unnamed). The floor is the shared
    // core (auth + settings + admin back-office + SEO); the `inertia`
    // flavor drops the CMS routes on top of it.
    assert.isTrue(
      routes.length >= 60,
      `Expected at least 60 registered routes, got ${routes.length}`
    )
  })

  test('public routes have correct patterns', ({ assert }) => {
    const json = router.toJSON()
    const routes = json['root']
    const byName = new Map(routes.filter((r) => r.name).map((r) => [r.name!, r]))

    // The home route is `page.home` on `main` and `front.home` in the
    // `inertia` flavor — both must point at `/`.
    const home = byName.get('page.home') ?? byName.get('front.home')
    assert.ok(home, 'Expected a home route (page.home or front.home)')
    assert.equal(home!.pattern, '/')

    // Settings index redirects to profile
    assert.equal(byName.get('settings.index')?.pattern, '/settings')
  })

  test('admin routes are under /admin prefix', ({ assert }) => {
    const json = router.toJSON()
    const routes = json['root']
    const adminRoutes = routes.filter((r) => r.name?.startsWith('admin.'))

    for (const route of adminRoutes) {
      assert.ok(
        route.pattern.startsWith('/admin'),
        `Admin route "${route.name}" should start with /admin prefix, got: ${route.pattern}`
      )
    }
  })

  test('settings routes are under /settings prefix', ({ assert }) => {
    const json = router.toJSON()
    const routes = json['root']
    const settingsRoutes = routes.filter((r) => r.name?.startsWith('settings.'))

    for (const route of settingsRoutes) {
      assert.ok(
        route.pattern.startsWith('/settings'),
        `Settings route "${route.name}" should start with /settings prefix, got: ${route.pattern}`
      )
    }
  })

  test('REST API admin endpoints are registered', ({ assert }) => {
    const json = router.toJSON()
    const routes = json['root'].map((r) => r.pattern)

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
    ]

    for (const pattern of expectedPatterns) {
      assert.include(routes, pattern, `Expected REST API route "${pattern}" to be registered`)
    }
  })
})
