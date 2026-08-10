import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { createAdminUser } from '#tests/helpers/browser/create_admin_user'

/**
 * Extracts the Inertia page object from the server-rendered HTML — the
 * `data-page` attribute carries the props JSON with HTML-escaped quotes.
 */
function parseInertiaPage(html: string) {
  const match = html.match(/data-page="([^"]+)"/)
  if (!match) throw new Error('No Inertia data-page attribute in response')
  const json = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
  return JSON.parse(json)
}

const VIEW_PERMISSIONS = ['users.view', 'files.view'] as const

test.group('Admin dashboard endpoint (core sections)', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('GET /admin renders the auth and file sections', async ({ client, assert }) => {
    const user = await createAdminUser({
      email: 'core-dashboard@example.com',
      permissionSlugs: VIEW_PERMISSIONS,
    })

    const res = await client.get('/admin').loginAs(user)

    res.assertStatus(200)
    const page = parseInertiaPage(res.text())
    const stats = page.props.stats

    assert.isAbove(stats.auth.users, 0)
  })
})
