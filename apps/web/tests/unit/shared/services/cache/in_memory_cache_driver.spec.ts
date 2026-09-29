import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { InMemoryCacheDriver } from '#shared/services/cache/drivers/in_memory_cache_driver';
import { cacheDriverContractTests } from './cache_driver_contract.js';

cacheDriverContractTests('in-memory', () => new InMemoryCacheDriver());

test.group('InMemoryCacheDriver', (group) => {
	let driver: InMemoryCacheDriver;

	group.each.setup(() => {
		driver = new InMemoryCacheDriver();
	});

	test('is injectable via the container', async ({ assert }) => {
		const resolved = await app.container.make(InMemoryCacheDriver);
		assert.instanceOf(resolved, InMemoryCacheDriver);
	});

	test('is a container singleton (same instance across resolutions)', async ({ assert }) => {
		const first = await app.container.make(InMemoryCacheDriver);
		const second = await app.container.make(InMemoryCacheDriver);
		assert.equal(first, second);
	});

	test('instances are isolated from each other', async ({ assert }) => {
		const other = new InMemoryCacheDriver();
		await driver.set('shared', 'value');

		assert.isNull(await other.get('shared'));
		await other.flush();
		assert.isTrue(await driver.has('shared'));
	});

	test('increment() throws for a non-numeric value', async ({ assert }) => {
		await driver.set('text', 'not-a-number');

		assert.rejects(() => driver.increment('text'), /value at "text" is not a number/);
	});
});
