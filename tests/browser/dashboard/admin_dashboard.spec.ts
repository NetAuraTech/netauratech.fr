import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { login } from '#tests/helpers/browser/login'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { createAdminUser } from '#tests/helpers/browser/create_admin_user'

const VIEW_PERMISSIONS = ['users.view', 'files.view'] as const

test.group('Admin Dashboard E2E (core sections)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('renders auth and file dashboard sections', async ({ visit, assert }) => {
    const user = await createAdminUser({
      email: 'e2e-core@example.com',
      permissionSlugs: VIEW_PERMISSIONS,
    })

    await login('/login', visit, user.email, 'TestPassword123!')

    const page = await visitPage('/admin', visit)
    const content = await page.locator('body').innerText()

    assert.match(content, /Users/)
    assert.match(content, /Folders: \d+/)
  })
})
