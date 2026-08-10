import { test } from '@japa/runner'
import { DashboardRegistry } from '#services/core/dashboard_registry'
import type { DashboardCollector, DashboardCollectorPayload } from '#types/dashboard'

const payload: DashboardCollectorPayload = { recentLimit: 5 }

test.group('DashboardRegistry', () => {
  test('entries() is empty on a fresh registry', ({ assert }) => {
    const registry = new DashboardRegistry()

    assert.deepEqual(registry.entries(), [])
  })

  test('entries() lists registered sections in registration order', ({ assert }) => {
    const registry = new DashboardRegistry()
    const collector: DashboardCollector<'auth'> = {
      collect: async () => ({ users: 0, usersByRole: [] }),
    }
    const fileCollector: DashboardCollector<'file'> = {
      collect: async () => ({ files: 0, fileFolders: 0, filesByFolder: [], recentFiles: [] }),
    }

    registry.register('auth', async () => collector)
    registry.register('file', async () => fileCollector)

    assert.deepEqual(
      registry.entries().map(([section]) => section),
      ['auth', 'file']
    )
  })

  test('register() does not invoke the factory', async ({ assert }) => {
    const registry = new DashboardRegistry()
    let invoked = false

    registry.register('auth', async () => {
      invoked = true
      return { collect: async () => ({ users: 0, usersByRole: [] }) }
    })

    assert.isFalse(invoked)
  })

  test('registering the same section twice replaces the previous factory', async ({ assert }) => {
    const registry = new DashboardRegistry()
    const replacement: DashboardCollector<'auth'> = {
      collect: async () => ({ users: 42, usersByRole: [] }),
    }

    registry.register('auth', async () => ({
      collect: async () => ({ users: 0, usersByRole: [] }),
    }))
    registry.register('auth', async () => replacement)

    const entries = registry.entries()
    assert.lengthOf(entries, 1)
    const factory = entries[0][1]
    const collector = await factory()
    assert.deepEqual(await collector.collect(payload), { users: 42, usersByRole: [] })
  })
})
