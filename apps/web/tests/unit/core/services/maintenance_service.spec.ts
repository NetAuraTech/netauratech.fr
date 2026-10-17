import logger from '@adonisjs/core/services/logger';
import { test } from '@japa/runner';
import { type CacheDriver } from '#core/contracts/cache_driver';
import { MAX_ALLOWED_IPS, MaintenanceService } from '#core/services/maintenance_service';
import { FailoverCacheDriver } from '#shared/services/cache/drivers/failover_cache_driver';
import { InMemoryCacheDriver } from '#shared/services/cache/drivers/in_memory_cache_driver';
import { CacheService } from '#shared/services/cache_service';

/**
 * Test double standing in for a flapping primary tier: throws on every
 * operation while `state.down` is `true`, otherwise delegates to `inner`.
 */
function unstableDriver(inner: CacheDriver, state: { down: boolean }): CacheDriver {
	function guard(): void {
		if (state.down) {
			throw new Error('primary tier down');
		}
	}

	return {
		async get(key) {
			guard();
			return inner.get(key);
		},
		async set(key, value, ttl) {
			guard();
			await inner.set(key, value, ttl);
		},
		async delete(key) {
			guard();
			await inner.delete(key);
		},
		async deletePattern(pattern) {
			guard();
			await inner.deletePattern(pattern);
		},
		async remember(key, factory, ttl) {
			guard();
			return inner.remember(key, factory, ttl);
		},
		async has(key) {
			guard();
			return inner.has(key);
		},
		async increment(key, by) {
			guard();
			return inner.increment(key, by);
		},
		async flush() {
			guard();
			await inner.flush();
		},
		async keys(pattern) {
			guard();
			return inner.keys(pattern);
		},
		async list(pattern) {
			guard();
			return inner.list(pattern);
		},
		async setIfAbsent(key, value, ttl) {
			guard();
			return inner.setIfAbsent(key, value, ttl);
		},
		async compareAndSet(key, expected, value, ttl) {
			guard();
			return inner.compareAndSet(key, expected, value, ttl);
		},
		async compareAndDelete(key, expected) {
			guard();
			return inner.compareAndDelete(key, expected);
		},
	};
}

/**
 * Hermetic base suite: the service runs on a single-tier in-memory driver
 * (no tier state, every operation serves directly). Covers the config API,
 * the scheduled-window folding, the IP allowlist and the payload
 * compatibility with the pre-seam transport.
 */
test.group('MaintenanceService (single-tier driver)', (group) => {
	let driver: InMemoryCacheDriver;
	let service: MaintenanceService;

	group.each.setup(async () => {
		driver = new InMemoryCacheDriver();
		service = new MaintenanceService(new CacheService(driver));
		await service.initializeMemoryFallback();
	});

	// ---------- Collar ----------

	test('isEnabled reports disabled state on fresh boot', async ({ assert }) => {
		assert.isFalse(await service.isEnabled());
	});

	test('getConfig returns safe defaults on fresh boot', async ({ assert }) => {
		const config = await service.getConfig();

		assert.isFalse(config.enabled);
		assert.equal(config.message, '');
		assert.deepEqual(config.allowedIps, []);
		assert.equal(config.retryAfter, 3600);
		// No stored value anywhere - the in-process copy is served and
		// reported as 'memory', exactly like the pre-seam behaviour.
		assert.equal(config.source, 'memory');
	});

	test('getSource and isRedisAvailable report the primary on a single-tier driver', async ({ assert }) => {
		assert.equal(service.getSource(), 'redis');
		assert.isTrue(service.isRedisAvailable());
	});

	test('getRetryAfter returns the default window', async ({ assert }) => {
		assert.equal(service.getRetryAfter(), 3600);
	});

	test('setConfig persists and round-trips', async ({ assert }) => {
		await service.setConfig({ enabled: true, message: 'Down for maintenance', allowedIps: ['10.0.0.0/8'] });

		const config = await service.getConfig();

		assert.isTrue(config.enabled);
		assert.equal(config.message, 'Down for maintenance');
		assert.deepEqual(config.allowedIps, ['10.0.0.0/8']);
	});

	test('setConfig rejects an allowlist over the cap', async ({ assert }) => {
		const ips = Array.from(
			{ length: MAX_ALLOWED_IPS + 1 },
			(_, i) => '10.0.' + Math.floor(i / 256) + '.' + (i % 256) + '/32',
		);

		await assert.rejects(async () => service.setConfig({ allowedIps: ips }), RangeError);
	});

	test('setConfig accepts exactly 100 allowed IPs', async ({ assert }) => {
		const ips = Array.from(
			{ length: MAX_ALLOWED_IPS },
			(_, i) => '10.0.' + Math.floor(i / 256) + '.' + (i % 256) + '/32',
		);

		await service.setConfig({ allowedIps: ips });

		assert.equal((await service.getConfig()).allowedIps.length, MAX_ALLOWED_IPS);
	});

	test('config persists across service instances via the shared driver', async ({ assert }) => {
		await service.setConfig({ enabled: true, message: 'Persistent message', allowedIps: ['10.0.0.0/8'] });

		// A new service over the same driver simulates a process restart with
		// a durable backend.
		const restarted = new MaintenanceService(new CacheService(driver));
		await restarted.initializeMemoryFallback();

		const config = await restarted.getConfig();

		assert.isTrue(config.enabled);
		assert.equal(config.message, 'Persistent message');
		assert.deepEqual(config.allowedIps, ['10.0.0.0/8']);
	});

	test('toggle flips the enabled flag and keeps the other fields', async ({ assert }) => {
		await service.setConfig({ message: 'Base message', allowedIps: ['192.168.0.0/16'] });
		await service.toggle(true);

		const config = await service.getConfig();

		assert.isTrue(config.enabled);
		assert.equal(config.message, 'Base message');
		assert.deepEqual(config.allowedIps, ['192.168.0.0/16']);

		await service.toggle(false);
		assert.isFalse(await service.isEnabled());
	});

	// ---------- Scheduled windows ----------

	test('getEffectiveConfig folds an active schedule window', async ({ assert }) => {
		const startAt = new Date(Date.now() - 60_000).toISOString();
		const endAt = new Date(Date.now() + 120_000).toISOString();
		await service.setSchedule({ enabled: true, startAt, endAt });

		const config = await service.getEffectiveConfig();

		assert.isTrue(config.enabled);
		assert.isTrue(config.retryAfter > 0);
		assert.isTrue(config.retryAfter <= 120);
	});

	test('getEffectiveConfig keeps maintenance off before the window', async ({ assert }) => {
		const startAt = new Date(Date.now() + 120_000).toISOString();
		const endAt = new Date(Date.now() + 300_000).toISOString();
		await service.setSchedule({ enabled: true, startAt, endAt });

		assert.isFalse(await service.isEnabled());
	});

	test('an expired schedule is lazily disarmed on read', async ({ assert }) => {
		const startAt = new Date(Date.now() - 300_000).toISOString();
		const endAt = new Date(Date.now() - 120_000).toISOString();
		await service.setSchedule({ enabled: true, startAt, endAt });

		const config = await service.getConfig();

		assert.isFalse(config.enabled);
		assert.equal(config.scheduled?.enabled, false);
	});

	test('setSchedule arms a window and null clears it', async ({ assert }) => {
		const startAt = new Date(Date.now() + 120_000).toISOString();
		const endAt = new Date(Date.now() + 300_000).toISOString();
		await service.setSchedule({ enabled: true, startAt, endAt });
		assert.deepEqual((await service.getConfig()).scheduled, { enabled: true, startAt, endAt });

		await service.setSchedule(null);
		assert.isUndefined((await service.getConfig()).scheduled);
	});

	// ---------- Stored payload ----------

	test('reads a payload stored by the pre-seam transport unchanged', async ({ assert }) => {
		// The pre-seam transport stored a single-encoded JSON object
		// (redis.set(key, JSON.stringify(payload))); the seam decodes that
		// exact shape to the same object, so pre-rollout values need no
		// migration.
		await driver.set('maintenance:config', {
			enabled: true,
			message: 'pre-seam',
			allowedIps: ['192.168.1.1'],
			retryAfter: 900,
			source: 'redis',
		});

		const config = await service.getConfig();

		assert.isTrue(config.enabled);
		assert.equal(config.message, 'pre-seam');
		assert.deepEqual(config.allowedIps, ['192.168.1.1']);
		assert.equal(config.retryAfter, 900);
	});

	test('normalizes an invalid stored retryAfter on read', async ({ assert }) => {
		await driver.set('maintenance:config', {
			enabled: false,
			message: '',
			allowedIps: [],
			retryAfter: 0,
			source: 'redis',
		});

		assert.equal((await service.getConfig()).retryAfter, 3600);
	});

	// ---------- IP allowlist (pure logic) ----------

	test('checkIpAllowed rejects everything when the allowlist is empty', async ({ assert }) => {
		assert.isFalse(service.checkIpAllowed('10.0.0.1'));
	});

	test('checkIpAllowed matches bare IPs and CIDR ranges', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['10.1.2.3', '192.168.0.0/16'] });

		assert.isTrue(service.checkIpAllowed('10.1.2.3'));
		assert.isFalse(service.checkIpAllowed('10.1.2.4'));
		assert.isTrue(service.checkIpAllowed('192.168.5.9'));
		assert.isFalse(service.checkIpAllowed('172.16.0.1'));
	});

	test('checkIpAllowed normalizes IPv4-mapped IPv6 addresses', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['10.1.2.3'] });

		assert.isTrue(service.checkIpAllowed('::ffff:10.1.2.3'));
	});

	test('checkIpAllowed skips malformed entries and keeps matching the rest', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['not-a-cidr', '10.0.0.0/8'] });

		assert.isTrue(service.checkIpAllowed('10.9.9.9'));
	});

	test('checkIpAllowed returns false for unparseable input', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['10.0.0.0/8'] });

		assert.isFalse(service.checkIpAllowed('nope'));
	});

	test('checkIpAllowed matches an exact IPv6', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['::1'] });

		assert.isTrue(service.checkIpAllowed('::1'));
		assert.isFalse(service.checkIpAllowed('2001:db8::1'));
	});

	test('checkIpAllowed matches an IPv6 /32 CIDR range', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['2001:db8::/32'] });

		assert.isTrue(service.checkIpAllowed('2001:db8::1'));
		assert.isTrue(service.checkIpAllowed('2001:db8:ffff:ffff:ffff:ffff:ffff:ffff'));
		assert.isFalse(service.checkIpAllowed('2002:db8::1'));
	});

	test('checkIpAllowed is case-insensitive for IPv6', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['2001:DB8::1'] });

		assert.isTrue(service.checkIpAllowed('2001:db8::1'));
	});

	test('checkIpAllowed handles a mix of IPv4 and IPv6', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['10.0.0.1', '::1'] });

		assert.isTrue(service.checkIpAllowed('10.0.0.1'));
		assert.isTrue(service.checkIpAllowed('::1'));
		assert.isFalse(service.checkIpAllowed('192.168.1.1'));
	});

	test('checkIpAllowed matches multiple CIDR ranges', async ({ assert }) => {
		await service.setConfig({ allowedIps: ['10.0.0.0/8', '172.16.0.0/12'] });

		assert.isTrue(service.checkIpAllowed('10.0.0.5'));
		assert.isTrue(service.checkIpAllowed('172.16.255.1'));
		assert.isFalse(service.checkIpAllowed('192.168.1.1'));
	});
});

/**
 * Failover lifecycle suite: the service runs on the production-shaped
 * composite (flapping primary tier, process-local fallback) and exercises
 * the documented initialize → explicit override → reconcile-on-recovery
 * lifecycle.
 */
test.group('MaintenanceService (failover lifecycle)', (group) => {
	let primary: InMemoryCacheDriver;
	let state: { down: boolean };
	let service: MaintenanceService;

	group.each.setup(() => {
		state = { down: false };
		primary = new InMemoryCacheDriver();
		const composite = new FailoverCacheDriver(unstableDriver(primary, state), new InMemoryCacheDriver());
		service = new MaintenanceService(new CacheService(composite));
	});

	/**
	 * A fresh service sharing the primary store simulates a process restart:
	 * the fallback tier is gone with the old process, the primary is not.
	 */
	async function restart(): Promise<MaintenanceService> {
		const fresh = new MaintenanceService(
			new CacheService(new FailoverCacheDriver(unstableDriver(primary, state), new InMemoryCacheDriver())),
		);
		await fresh.initializeMemoryFallback();
		return fresh;
	}

	test('startup with the primary down initializes the memory fallback', async ({ assert }) => {
		state.down = true;
		await service.initializeMemoryFallback();

		assert.isFalse(service.isRedisAvailable());
		assert.equal(service.getSource(), 'memory');
		assert.isFalse(await service.isEnabled());
		assert.isFalse(service.getMemoryConfig()?._explicitlySet);
	});

	test('startup with the primary down logs a warning', async ({ assert }) => {
		const originalPino = logger.pino;
		const records: string[] = [];
		logger.pino = {
			warn: (_obj: unknown, msg: string) => records.push(msg),
			info: () => undefined,
		} as never;

		try {
			state.down = true;
			await service.initializeMemoryFallback();
		} finally {
			logger.pino = originalPino;
		}

		assert.isTrue(records.some((msg) => msg.includes('Primary tier unavailable at startup')));
	});

	test('a write made while the primary is down is flagged for reconciliation', async ({ assert }) => {
		state.down = true;
		await service.initializeMemoryFallback();
		await service.setConfig({ enabled: true, message: 'outage' });

		// Served from the fallback tier, flagged as an admin override made
		// while the primary was down.
		assert.isTrue(await service.isEnabled());
		assert.isTrue(service.getMemoryConfig()?._explicitlySet);
		assert.isFalse(service.isRedisAvailable());
	});

	test('reconcile is a no-op while the primary is still down', async ({ assert }) => {
		state.down = true;
		await service.initializeMemoryFallback();
		await service.setConfig({ enabled: true, message: 'outage' });

		await service.reconcileWithRedis();

		assert.isTrue(service.getMemoryConfig()?._explicitlySet);
		assert.isNull(await primary.get('maintenance:config'));
	});

	test('reconcile pushes the explicitly-set config to the primary on recovery', async ({ assert }) => {
		state.down = true;
		await service.initializeMemoryFallback();
		await service.setConfig({ enabled: true, message: 'outage' });
		state.down = false;

		await service.reconcileWithRedis();

		const stored = (await primary.get('maintenance:config')) as { enabled: boolean; message: string } | null;
		assert.isNotNull(stored);
		assert.equal(stored?.enabled, true);
		assert.equal(stored?.message, 'outage');
		assert.instanceOf(service.getMemoryConfig()?._lastRedisSync, Date);
	});

	test('a change made during an outage is visible after a restart once reconciled', async ({ assert }) => {
		state.down = true;
		await service.initializeMemoryFallback();
		await service.setConfig({ enabled: true, message: 'outage' });
		state.down = false;
		await service.reconcileWithRedis();

		const restarted = await restart();
		const config = await restarted.getConfig();

		assert.isTrue(config.enabled);
		assert.equal(config.message, 'outage');
		assert.equal(config.source, 'redis');
	});

	test('reconcile syncs the primary value into the local copy when nothing was overridden', async ({ assert }) => {
		state.down = true;
		await service.initializeMemoryFallback();
		// Another process wrote a config while this one was down.
		await primary.set('maintenance:config', {
			enabled: true,
			message: 'other',
			allowedIps: [],
			retryAfter: 3600,
			updatedAt: new Date().toISOString(),
			source: 'redis',
		});
		state.down = false;

		await service.reconcileWithRedis();

		const memory = service.getMemoryConfig();
		assert.equal(memory?.message, 'other');
		assert.isFalse(memory?._explicitlySet);
	});
});
