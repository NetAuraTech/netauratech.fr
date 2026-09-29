import { test } from '@japa/runner';
import { GetDashboardStatsAction } from '#core/actions/get_dashboard_stats_action';
import { DashboardRegistry } from '#core/services/dashboard_registry';
import { LogService } from '#log/services/log_service';
import type {
	DashboardCollector,
	DashboardCollectorPayload,
	DashboardFileSection,
	DashboardIdentitySection,
} from '#core/types/dashboard';

test.group('GetDashboardStatsAction', () => {
	test('returns an empty payload when no collector is registered', async ({ assert }) => {
		const action = new GetDashboardStatsAction(new DashboardRegistry(), new LogService());

		assert.deepEqual(await action.execute(), {});
	});

	test('returns only the sections of registered collectors', async ({ assert }) => {
		class FakeIdentityCollector implements DashboardCollector<'identity'> {
			async collect(): Promise<DashboardIdentitySection> {
				return { users: 7, usersByRole: [] };
			}
		}

		const registry = new DashboardRegistry();
		registry.register('identity', async () => new FakeIdentityCollector());

		const action = new GetDashboardStatsAction(registry, new LogService());
		const stats = await action.execute();

		assert.deepEqual(stats, { identity: { users: 7, usersByRole: [] } });
	});

	test('runs registered collectors in parallel', async ({ assert }) => {
		const events: string[] = [];
		let releaseIdentity!: () => void;
		const identityGate = new Promise<void>((resolve) => {
			releaseIdentity = resolve;
		});

		class GatedIdentityCollector implements DashboardCollector<'identity'> {
			async collect(): Promise<DashboardIdentitySection> {
				events.push('identity:start');
				await identityGate;
				events.push('identity:end');
				return { users: 1, usersByRole: [] };
			}
		}

		class ReleasingFileCollector implements DashboardCollector<'file'> {
			async collect(): Promise<DashboardFileSection> {
				events.push('file:start');
				releaseIdentity();
				return { files: 2, fileFolders: 0, filesByFolder: [], recentFiles: [] };
			}
		}

		const registry = new DashboardRegistry();
		registry.register('identity', async () => new GatedIdentityCollector());
		registry.register('file', async () => new ReleasingFileCollector());

		const action = new GetDashboardStatsAction(registry, new LogService());
		const stats = await action.execute();

		assert.deepEqual(events, ['identity:start', 'file:start', 'identity:end']);
		assert.deepEqual(Object.keys(stats), ['identity', 'file']);
	});

	test('rejects when a collector fails', async ({ assert }) => {
		class FailingCollector implements DashboardCollector<'identity'> {
			async collect(): Promise<DashboardIdentitySection> {
				throw new Error('collector exploded');
			}
		}

		const registry = new DashboardRegistry();
		registry.register('identity', async () => new FailingCollector());

		const action = new GetDashboardStatsAction(registry, new LogService());

		await assert.rejects(() => action.execute(), 'collector exploded');
	});

	test('forwards the recent-activity limit to collectors, defaulting to 5', async ({ assert }) => {
		const receivedLimits: number[] = [];

		class ProbingIdentityCollector implements DashboardCollector<'identity'> {
			async collect(payload: DashboardCollectorPayload): Promise<DashboardIdentitySection> {
				receivedLimits.push(payload.recentLimit);
				return { users: 0, usersByRole: [] };
			}
		}

		const registry = new DashboardRegistry();
		registry.register('identity', async () => new ProbingIdentityCollector());

		const action = new GetDashboardStatsAction(registry, new LogService());
		await action.execute({ recentLimit: 12 });
		await action.execute();

		assert.deepEqual(receivedLimits, [12, 5]);
	});
});
