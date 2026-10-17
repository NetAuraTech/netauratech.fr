import logger from '@adonisjs/core/services/logger';
import { test } from '@japa/runner';
import { type CacheDriver } from '#core/contracts/cache_driver';
import { FailoverCacheDriver } from '#shared/services/cache/drivers/failover_cache_driver';
import { InMemoryCacheDriver } from '#shared/services/cache/drivers/in_memory_cache_driver';
import { RedisCacheDriver } from '#shared/services/cache/drivers/redis_cache_driver';
import { cacheDriverContractTests } from './cache_driver_contract.js';

/**
 * Shared contract suite for the composite driver, production-shaped (Redis
 * primary, in-memory fallback). When Redis is reachable the suite runs
 * against the primary tier; when it is not, every operation transparently
 * lands on the memory tier — either way the composite is exercised end to
 * end, and the suite never needs a skip.
 */
cacheDriverContractTests('failover', () => new FailoverCacheDriver(new RedisCacheDriver()));

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

test.group('FailoverCacheDriver', (group) => {
	let primaryStore: InMemoryCacheDriver;
	let fallback: InMemoryCacheDriver;
	let driver: FailoverCacheDriver;
	let state: { down: boolean };

	group.each.setup(() => {
		state = { down: false };
		primaryStore = new InMemoryCacheDriver();
		fallback = new InMemoryCacheDriver();
		driver = new FailoverCacheDriver(unstableDriver(primaryStore, state), fallback);
	});

	test('operations use the primary tier while it is healthy', async ({ assert }) => {
		await driver.set('key', 'value');

		assert.equal(await driver.get('key'), 'value');
		assert.equal(await primaryStore.get('key'), 'value');
		assert.isNull(await fallback.get('key'));
	});

	test('operations fail over to the memory tier when the primary throws', async ({ assert }) => {
		state.down = true;

		await driver.set('key', 'value');

		assert.equal(await driver.get('key'), 'value');
		assert.isNull(await primaryStore.get('key'));
		assert.equal(await fallback.get('key'), 'value');
	});

	test('the next operation retries the primary and recovers after an outage', async ({ assert }) => {
		state.down = true;
		await driver.set('during-outage', 'value');
		assert.isNull(await primaryStore.get('during-outage'));

		state.down = false;
		await driver.set('after-recovery', 'value');

		assert.equal(await primaryStore.get('after-recovery'), 'value');
		assert.isNull(await fallback.get('after-recovery'));
		// Values written to the fallback tier during the outage are not
		// visible on the primary afterwards — failover is per-call, not
		// per-value (see ADR-012).
		assert.isNull(await primaryStore.get('during-outage'));
	});

	test('atomic primitives fail over with the rest of the contract', async ({ assert }) => {
		state.down = true;

		assert.isTrue(await driver.setIfAbsent('lock', 'first', 60));
		assert.isFalse(await driver.setIfAbsent('lock', 'second', 60));
		assert.equal(await fallback.get('lock'), 'first');

		assert.isTrue(await driver.compareAndSet('lock', 'first', 'third', 60));
		assert.isFalse(await driver.compareAndDelete('lock', 'first'));
		assert.isTrue(await driver.compareAndDelete('lock', 'third'));
		assert.isFalse(await fallback.has('lock'));
	});

	test('repeated failures keep serving the fallback tier without error', async ({ assert }) => {
		state.down = true;

		await driver.set('a', 1);
		assert.equal(await driver.increment('a'), 2);
		assert.isTrue(await driver.has('a'));
		assert.deepEqual(await driver.list('a'), { a: 2 });
		await driver.deletePattern('a');

		assert.isNull(await fallback.get('a'));
	});

	test('logs one warn per fallback transition and one info per recovery', async ({ assert }) => {
		const originalPino = logger.pino;
		const records: Array<{ level: 'warn' | 'info' }> = [];
		logger.pino = {
			warn: () => records.push({ level: 'warn' }),
			info: () => records.push({ level: 'info' }),
		} as never;

		try {
			state.down = true;
			await driver.get('a');
			await driver.get('b');
			await driver.set('c', 'd'); // outage: one fallback transition only

			state.down = false;
			await driver.get('a'); // recovery: one info, no warn

			state.down = true;
			await driver.get('a'); // a second fallback transition: another warn
		} finally {
			logger.pino = originalPino;
		}

		assert.lengthOf(
			records.filter((r) => r.level === 'warn'),
			2,
		);
		assert.lengthOf(
			records.filter((r) => r.level === 'info'),
			1,
		);
	});
});
