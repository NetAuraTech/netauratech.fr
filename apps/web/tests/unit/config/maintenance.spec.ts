import { test } from '@japa/runner';
import maintenanceConfig, { resolveSchedule } from '#config/maintenance';

/**
 * Unit seam for the env-driven maintenance schedule resolution
 * ({@link resolveSchedule}) and the shipped defaults. This is the decision the
 * `start/scheduler.ts` preload turns into queue schedules: enabled tasks are
 * scheduled on their interval, zero (or invalid) values fall back / disable.
 */
test.group('Maintenance schedule config', () => {
	test('resolveSchedule() returns the default when the value is unset or blank', ({ assert }) => {
		assert.deepEqual(resolveSchedule(undefined, '1d'), { enabled: true, interval: '1d', intervalMs: 86_400_000 });
		assert.deepEqual(resolveSchedule('', '1d'), { enabled: true, interval: '1d', intervalMs: 86_400_000 });
	});

	test('resolveSchedule() honours a configured interval', ({ assert }) => {
		assert.deepEqual(resolveSchedule('30m', '1d'), { enabled: true, interval: '30m', intervalMs: 30 * 60_000 });
	});

	test('resolveSchedule() disables on a zero interval', ({ assert }) => {
		assert.deepEqual(resolveSchedule('0', '1d'), { enabled: false, interval: '0', intervalMs: 0 });
	});

	test('resolveSchedule() falls back to the default on an invalid interval', ({ assert }) => {
		const result = resolveSchedule('nonsense', '1d');
		assert.isTrue(result.enabled);
		assert.equal(result.interval, '1d');
		assert.equal(result.intervalMs, 86_400_000);
	});

	test('default config enables both schedules with a positive lock TTL', ({ assert }) => {
		assert.isTrue(maintenanceConfig.schedules.logPrune.enabled);
		assert.isTrue(maintenanceConfig.schedules.backupRetention.enabled);
		assert.isNumber(maintenanceConfig.lockTtlSeconds);
		assert.isAbove(maintenanceConfig.lockTtlSeconds, 0);
	});
});
