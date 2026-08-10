import { test } from '@japa/runner'
import { adminRestApiEnabled } from '#start/routes/admin_rest_api.routes'
import { identityApiEnabled } from '#start/routes/api.routes'
import { enabledAuthGuards } from '#config/auth'

/**
 * Feature-flag gating of the `/api/v1` surfaces.
 *
 * The routing entry points (`registerAdminRestApiRoutes`, `registerApiRoutes`)
 * short-circuit before registering any route when the `adminApi` feature flag
 * is off. These predicates make that gate testable without booting an app per
 * flag state.
 */
test.group('REST API feature-flag gating', () => {
  test('admin REST surface is enabled when adminApi is on', ({ assert }) => {
    assert.isTrue(adminRestApiEnabled({ adminApi: true }))
  })

  test('admin REST surface is disabled when adminApi is off', ({ assert }) => {
    assert.isFalse(adminRestApiEnabled({ adminApi: false }))
  })

  test('identity surface is enabled only when adminApi is on', ({ assert }) => {
    if (enabledAuthGuards.api) {
      assert.isTrue(identityApiEnabled({ adminApi: true }))
    }
  })

  test('identity surface is disabled when adminApi is off', ({ assert }) => {
    assert.isFalse(identityApiEnabled({ adminApi: false }))
  })
})
