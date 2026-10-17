import { test } from '@japa/runner';
import { InMemoryCacheDriver } from '#shared/services/cache/drivers/in_memory_cache_driver';
import { CacheService } from '#shared/services/cache_service';
import { LockService } from '#shared/services/lock_service';

/**
 * Unit seam for {@link LockService} — the no-double-process guarantee behind
 * the scheduled maintenance jobs. Exercised against the in-memory driver so
 * the suite stays hermetic (no Redis required); the primary tier speaks the
 * same atomic contract (`setIfAbsent` / `compareAndDelete`) behind the seam.
 */
test.group('LockService', (group) => {
	let locks: LockService;

	group.each.setup(() => {
		locks = new LockService(new CacheService(new InMemoryCacheDriver()));
	});

	test('acquire() returns a token for a free lock', async ({ assert }) => {
		const token = await locks.acquire('foo', 30);
		assert.isString(token as string);
	});

	test('a second acquire() on a held lock returns null', async ({ assert }) => {
		const first = await locks.acquire('foo', 30);
		const second = await locks.acquire('foo', 30);
		assert.exists(first);
		assert.isNull(second);
	});

	test('independent locks do not interfere with each other', async ({ assert }) => {
		assert.exists(await locks.acquire('a', 30));
		assert.exists(await locks.acquire('b', 30));
	});

	test('release() frees the lock so it can be re-acquired', async ({ assert }) => {
		const token = (await locks.acquire('foo', 30)) as string;
		await locks.release('foo', token);
		assert.exists(await locks.acquire('foo', 30));
	});

	test('release() by a non-holder leaves the lock held', async ({ assert }) => {
		const token = (await locks.acquire('foo', 30)) as string;
		await locks.release('foo', 'not-the-token');
		assert.isNull(await locks.acquire('foo', 30));
		assert.isString(token);
	});

	test('a lock expires after its TTL and can be re-acquired', async ({ assert }) => {
		await locks.acquire('foo', 1);
		await new Promise((resolve) => setTimeout(resolve, 1100));
		assert.exists(await locks.acquire('foo', 30));
	}).timeout(3000);

	test('acquire() with a TTL of 0 holds the lock until released', async ({ assert }) => {
		const token = await locks.acquire('foo', 0);
		assert.exists(token);
		await new Promise((resolve) => setTimeout(resolve, 5));
		assert.isNull(await locks.acquire('foo', 30));
	});

	test('withLock() runs fn, returns true, and releases when the lock is free', async ({ assert }) => {
		let ran = false;
		const acquired = await locks.withLock('foo', 30, async () => {
			ran = true;
		});
		assert.isTrue(acquired);
		assert.isTrue(ran);
		assert.exists(await locks.acquire('foo', 30));
	});

	test('withLock() skips fn and returns false when the lock is held', async ({ assert }) => {
		await locks.acquire('foo', 30);
		let ran = false;
		const acquired = await locks.withLock('foo', 30, async () => {
			ran = true;
		});
		assert.isFalse(acquired);
		assert.isFalse(ran);
	});

	test('withLock() releases the lock even when fn throws', async ({ assert }) => {
		await assert.rejects(
			() =>
				locks.withLock('foo', 30, async () => {
					throw new Error('boom');
				}),
			'boom',
		);
		assert.exists(await locks.acquire('foo', 30));
	});
});
