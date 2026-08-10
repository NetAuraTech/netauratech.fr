import { test } from '@japa/runner'
import { GetDashboardStatsAction } from '#actions/core/get_dashboard_stats_action'
import { DashboardRegistry } from '#services/core/dashboard_registry'
import { LogService } from '#services/logging/log_service'
import type {
  DashboardAuthSection,
  DashboardCollector,
  DashboardCollectorPayload,
  DashboardFileSection,
} from '#types/dashboard'

test.group('GetDashboardStatsAction', () => {
  test('returns an empty payload when no collector is registered', async ({ assert }) => {
    const action = new GetDashboardStatsAction(new DashboardRegistry(), new LogService())

    assert.deepEqual(await action.execute(), {})
  })

  test('returns only the sections of registered collectors', async ({ assert }) => {
    class FakeAuthCollector implements DashboardCollector<'auth'> {
      async collect(): Promise<DashboardAuthSection> {
        return { users: 7, usersByRole: [] }
      }
    }

    const registry = new DashboardRegistry()
    registry.register('auth', async () => new FakeAuthCollector())

    const action = new GetDashboardStatsAction(registry, new LogService())
    const stats = await action.execute()

    assert.deepEqual(stats, { auth: { users: 7, usersByRole: [] } })
  })

  test('runs registered collectors in parallel', async ({ assert }) => {
    const events: string[] = []
    let releaseAuth!: () => void
    const authGate = new Promise<void>((resolve) => {
      releaseAuth = resolve
    })

    class GatedAuthCollector implements DashboardCollector<'auth'> {
      async collect(): Promise<DashboardAuthSection> {
        events.push('auth:start')
        await authGate
        events.push('auth:end')
        return { users: 1, usersByRole: [] }
      }
    }

    class ReleasingFileCollector implements DashboardCollector<'file'> {
      async collect(): Promise<DashboardFileSection> {
        events.push('file:start')
        releaseAuth()
        return { files: 2, fileFolders: 0, filesByFolder: [], recentFiles: [] }
      }
    }

    const registry = new DashboardRegistry()
    registry.register('auth', async () => new GatedAuthCollector())
    registry.register('file', async () => new ReleasingFileCollector())

    const action = new GetDashboardStatsAction(registry, new LogService())
    const stats = await action.execute()

    assert.deepEqual(events, ['auth:start', 'file:start', 'auth:end'])
    assert.deepEqual(Object.keys(stats), ['auth', 'file'])
  })

  test('rejects when a collector fails', async ({ assert }) => {
    class FailingCollector implements DashboardCollector<'auth'> {
      async collect(): Promise<DashboardAuthSection> {
        throw new Error('collector exploded')
      }
    }

    const registry = new DashboardRegistry()
    registry.register('auth', async () => new FailingCollector())

    const action = new GetDashboardStatsAction(registry, new LogService())

    await assert.rejects(() => action.execute(), 'collector exploded')
  })

  test('forwards the recent-activity limit to collectors, defaulting to 5', async ({ assert }) => {
    const receivedLimits: number[] = []

    class ProbingAuthCollector implements DashboardCollector<'auth'> {
      async collect(payload: DashboardCollectorPayload): Promise<DashboardAuthSection> {
        receivedLimits.push(payload.recentLimit)
        return { users: 0, usersByRole: [] }
      }
    }

    const registry = new DashboardRegistry()
    registry.register('auth', async () => new ProbingAuthCollector())

    const action = new GetDashboardStatsAction(registry, new LogService())
    await action.execute({ recentLimit: 12 })
    await action.execute()

    assert.deepEqual(receivedLimits, [12, 5])
  })
})
