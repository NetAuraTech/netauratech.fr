import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { login } from '#tests/helpers/browser/login'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { waitForInertiaResponse } from '#tests/helpers/browser/wait_for_inertia_response'
import { createAdminUser } from '#tests/helpers/browser/create_admin_user'
import { LogEntryFactory } from '#factories/log_entry_factory'
import { LogCategory, LogLevel } from '#types/logging'

test.group('Admin Logs E2E', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
  })

  test('denies access without the logs.view permission', async ({ visit, assert }) => {
    const user = await createAdminUser({ email: 'noaccess@example.com' })
    const page = await login('/login', visit, user.email, 'TestPassword123!')

    // BaseHttpException redirects HTML requests with a flash message, so the
    // raw 403 status is only observable on a JSON request. Fetching from the
    // page keeps the authenticated session cookies.
    const status = await page.evaluate(async () => {
      const response = await fetch('/admin/logs', { headers: { Accept: 'application/json' } })
      return response.status
    })

    assert.equal(status, 403)
  })

  test('renders persisted log entries', async ({ visit }) => {
    const user = await createAdminUser({
      email: 'admin@example.com',
      permissionSlugs: ['logs.view'],
    })
    const marker = `e2e_render_${Date.now()}`
    await LogEntryFactory.merge({
      level: LogLevel.INFO,
      category: LogCategory.BUSINESS,
      message: `Business Event: ${marker}`,
      actorEmail: user.email,
    }).create()

    await login('/login', visit, user.email, 'TestPassword123!')
    const page = await visitPage('/admin/logs', visit)

    await page.waitForSelector(`text=${marker}`)
    await page.assertPath('/admin/logs')
  })

  test('filters entries by level', async ({ visit, assert }) => {
    const user = await createAdminUser({
      email: 'filter@example.com',
      permissionSlugs: ['logs.view'],
    })
    const marker = `e2e_filter_${Date.now()}`
    await LogEntryFactory.merge({
      level: LogLevel.ERROR,
      category: LogCategory.SYSTEM,
      message: `${marker} error entry`,
    }).create()
    await LogEntryFactory.merge({
      level: LogLevel.INFO,
      category: LogCategory.SYSTEM,
      message: `${marker} info entry`,
    }).create()

    await login('/login', visit, user.email, 'TestPassword123!')
    const page = await visitPage('/admin/logs', visit)

    await page.locator('select[name="level"]').selectOption(LogLevel.ERROR)
    const response = await waitForInertiaResponse(page, '/admin/logs', () =>
      page.locator('button[name="logs-filter-submit"]').click()
    )
    assert.isTrue(response.ok())

    await page.waitForSelector(`text=${marker} error entry`)
    assert.equal(await page.locator(`text=${marker} info entry`).count(), 0)
  })

  test('filters entries by search term', async ({ visit, assert }) => {
    const user = await createAdminUser({
      email: 'search@example.com',
      permissionSlugs: ['logs.view'],
    })
    const marker = `e2e_search_${Date.now()}`
    await LogEntryFactory.merge({ message: `${marker} needle` }).create()
    await LogEntryFactory.merge({ message: 'unrelated haystack entry' }).create()

    await login('/login', visit, user.email, 'TestPassword123!')
    const page = await visitPage('/admin/logs', visit)

    await page.locator('input[name="search"]').pressSequentially(marker)
    const response = await waitForInertiaResponse(page, '/admin/logs', () =>
      page.locator('button[name="logs-filter-submit"]').click()
    )
    assert.isTrue(response.ok())

    await page.waitForSelector(`text=${marker} needle`)
    assert.equal(await page.locator('text=unrelated haystack entry').count(), 0)
  })
})
