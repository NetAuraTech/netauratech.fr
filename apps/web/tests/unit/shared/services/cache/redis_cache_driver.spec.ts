import redis from '@adonisjs/redis/services/main';
import { test } from '@japa/runner';
import { RedisCacheDriver } from '#shared/services/cache/drivers/redis_cache_driver';
import { cacheDriverContractTests } from './cache_driver_contract.js';

cacheDriverContractTests('redis', () => new RedisCacheDriver());

test.group('RedisCacheDriver', (group) => {
	let driver: RedisCacheDriver;
	let available = true;

	group.setup(async () => {
		try {
			await redis.connection().ping();
		} catch {
			available = false;
		}
	});

	group.each.skip(() => !available, 'Redis unavailable');

	group.each.setup(async () => {
		driver = new RedisCacheDriver();
		await driver.flush();
	});

	group.each.teardown(async () => {
		await driver.flush();
	});

	test('get() returns null when JSON parsing fails', async ({ assert }) => {
		// Manually set invalid JSON directly via Redis
		await redis.connection().set('test:invalid', 'not-valid-json{');

		const retrieved = await driver.get('test:invalid');
		assert.isNull(retrieved);
	});
});
