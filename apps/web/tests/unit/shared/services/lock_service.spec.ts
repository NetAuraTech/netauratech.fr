import { test } from '@japa/runner';
import { LockService } from '#shared/services/lock_service';

/**
 * Unit seam for {@link LockService} — the no-double-process guarantee behind the
 * scheduled maintenance jobs. Exercised against the in-memory backend
 * (`new LockService(false)`) so the suite stays hermetic (no Redis required);
 * the Redis path is the same contract behind an atomic `SET NX EX`.
 */
test.group('LockService', () => {
	test('acquire() returns a token for a free lock', async ({ assert }) => {
		const locks = new LockService(false);
		const token = await locks.acquire('foo', 30);
		assert.isString(token as string);
	});

	test('a second acquire() on a held lock returns null', async ({ assert }) => {
		const locks = new LockService(false);
		const first = await locks.acquire('foo', 30);
		const second = await locks.acquire('foo', 30);
		assert.exists(first);
		assert.isNull(second);
	});

	test('independent locks do not interfere with each other', async ({ assert }) => {
		const locks = new LockService(false);
		assert.exists(await locks.acquire('a', 30));
		assert.exists(await locks.acquire('b', 30));
	});

	test('release() frees the lock so it can be re-acquired', async ({ assert }) => {
		const locks = new LockService(false);
		const token = (await locks.acquire('foo', 30)) as string;
		await locks.release('foo', token);
		assert.exists(await locks.acquire('foo', 30));
	});

	test('release() by a non-holder leaves the lock held', async ({ assert }) => {
		const locks = new LockService(false);
		const token = (await locks.acquire('foo', 30)) as string;
		await locks.release('foo', 'not-the-token');
		assert.isNull(await locks.acquire('foo', 30));
		assert.isString(token);
	});

	test('a lock expires after its TTL and can be re-acquired', async ({ assert }) => {
		const locks = new LockService(false);
		const token = await locks.acquire('foo', 0);
		assert.exists(token);
		await new Promise((resolve) => setTimeout(resolve, 5));
		assert.exists(await locks.acquire('foo', 30));
	});

	test('withLock() runs fn, returns true, and releases when the lock is free', async ({ assert }) => {
		const locks = new LockService(false);
		let ran = false;
		const acquired = await locks.withLock('foo', 30, async () => {
			ran = true;
		});
		assert.isTrue(acquired);
		assert.isTrue(ran);
		assert.exists(await locks.acquire('foo', 30));
	});

	test('withLock() skips fn and returns false when the lock is held', async ({ assert }) => {
		const locks = new LockService(false);
		await locks.acquire('foo', 30);
		let ran = false;
		const acquired = await locks.withLock('foo', 30, async () => {
			ran = true;
		});
		assert.isFalse(acquired);
		assert.isFalse(ran);
	});

	test('withLock() releases the lock even when fn throws', async ({ assert }) => {
		const locks = new LockService(false);
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
