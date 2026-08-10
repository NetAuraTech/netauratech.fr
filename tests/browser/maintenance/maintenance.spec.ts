import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import type { Browser, Response } from '@playwright/test'
import { login } from '#tests/helpers/browser/login'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { fillField } from '#tests/helpers/browser/fill_field'
import { waitForInertiaResponse } from '#tests/helpers/browser/wait_for_inertia_response'
import { createAdminUser, MAINTENANCE_PERMISSIONS } from '#tests/helpers/browser/create_admin_user'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * Reset maintenance to a known OFF state through the service.
 */
async function resetMaintenance() {
  const service = await app.container.make(MaintenanceService)
  await service.setConfig({
    enabled: false,
    allowedIps: [],
    scheduled: { enabled: false, startAt: '', endAt: '' },
  })
}

/**
 * Open a fresh, unauthenticated browser context and request the public
 * robots.txt route. Returns the HTTP response so tests can assert whether
 * maintenance blocked the request (503) or let it through (200).
 */
async function fetchPublicRoute(browser: Browser, baseUrl: string): Promise<Response | null> {
  const context = await browser.newContext()
  try {
    const publicPage = await context.newPage()
    return await publicPage.goto(`${baseUrl}/robots.txt`, { waitUntil: 'networkidle' })
  } finally {
    await context.close()
  }
}

test.group('Maintenance E2E', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
    await resetMaintenance()
  })

  group.each.teardown(async () => {
    await resetMaintenance()
    try {
      const limiterModule = await import('@adonisjs/limiter/services/main')
      await limiterModule.default.clear()
    } catch {}
  })

  test('e2e-enable: admin enables maintenance via UI and public site is blocked', async ({
    visit,
    route,
    assert,
    browser,
  }) => {
    const admin = await createAdminUser({
      email: 'maint-enable@example.com',
      permissionSlugs: MAINTENANCE_PERMISSIONS,
    })

    const page = await login(route('auth.session.render'), visit, admin.email, 'TestPassword123!')
    await page.assertPath('/settings/profile')

    const maintPage = await visitPage(route('admin.settings.maintenance.render'), visit)
    await maintPage.assertPath('/admin/settings/maintenance')

    await maintPage.locator('input[name="enabled"]').check()
    await fillField(maintPage, 'textarea', 'message', 'E2E scheduled maintenance')
    await waitForInertiaResponse(maintPage, '/admin/settings/maintenance', () =>
      maintPage.locator('button[type="submit"]').click()
    )

    const baseUrl = new URL(maintPage.url()).origin
    const response = await fetchPublicRoute(browser, baseUrl)
    assert.isNotNull(response)
    assert.equal(response!.status(), 503)
  })

  test('e2e-allowlist: allowlisted IP bypasses maintenance', async ({
    visit,
    route,
    assert,
    browser,
  }) => {
    const admin = await createAdminUser({
      email: 'maint-allowlist@example.com',
      permissionSlugs: ['settings.maintenance'],
    })

    const page = await login(route('auth.session.render'), visit, admin.email, 'TestPassword123!')
    await page.assertPath('/settings/profile')

    const maintPage = await visitPage(route('admin.settings.maintenance.render'), visit)
    await maintPage.assertPath('/admin/settings/maintenance')

    await maintPage.locator('input[name="enabled"]').check()
    await fillField(maintPage, 'textarea', 'allowed_ips', '127.0.0.1/32\n::1/128')
    await waitForInertiaResponse(maintPage, '/admin/settings/maintenance', () =>
      maintPage.locator('button[type="submit"]').click()
    )

    const baseUrl = new URL(maintPage.url()).origin
    const response = await fetchPublicRoute(browser, baseUrl)
    assert.isNotNull(response)
    assert.equal(response!.status(), 200)
  })

  test('e2e-disable: admin disables maintenance via UI and public site is accessible', async ({
    visit,
    route,
    assert,
    browser,
  }) => {
    const admin = await createAdminUser({
      email: 'maint-disable@example.com',
      permissionSlugs: ['settings.maintenance'],
    })

    // Pre-enable maintenance so the admin UI shows an active state.
    const service = await app.container.make(MaintenanceService)
    await service.setConfig({ enabled: true, message: 'E2E active before disable' })

    const page = await login(route('auth.session.render'), visit, admin.email, 'TestPassword123!')
    await page.assertPath('/settings/profile')

    const maintPage = await visitPage(route('admin.settings.maintenance.render'), visit)
    await maintPage.assertPath('/admin/settings/maintenance')

    await maintPage.locator('input[name="enabled"]').uncheck()
    await waitForInertiaResponse(maintPage, '/admin/settings/maintenance', () =>
      maintPage.locator('button[type="submit"]').click()
    )

    const baseUrl = new URL(maintPage.url()).origin
    const response = await fetchPublicRoute(browser, baseUrl)
    assert.isNotNull(response)
    assert.equal(response!.status(), 200)
  })
})
