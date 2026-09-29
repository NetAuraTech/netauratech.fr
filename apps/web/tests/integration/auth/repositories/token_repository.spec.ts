import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import { TokenRepository } from '#auth/repositories/token_repository';
import { withTransaction } from '#core/services/with_transaction';
import { UserFactory } from '#factories/identity/user_factory';
import type Token from '#auth/models/token';

/**
 * Integration tests for the pure-query surface of the {@link TokenRepository}.
 * Lifecycle policy (issuance, verification, lockout) is covered at the
 * TokenService seam — see `tests/unit/auth/services/token_service.spec.ts`.
 */
test.group('TokenRepository', () => {
	const repo = new TokenRepository();

	const uniqueUser = async (prefix: string) => {
		const timestamp = Date.now() + Math.floor(Math.random() * 100000);
		return await UserFactory.merge({
			username: `${prefix}_${timestamp}`,
			email: `${prefix}_${timestamp}@example.com`,
		}).create();
	};

	const createTestToken = async (
		userId: number,
		type: string,
		options: { expiresInHours?: number; attempts?: number } = {},
	): Promise<{ tokenModel: Token; plainToken: FullToken }> => {
		const selector = Math.random().toString(36).substring(2, 10);
		const validator = Math.random().toString(36).substring(2, 10);
		const plainToken = `${selector}.${validator}` as FullToken;
		const hashedValidator = await hash.make(validator);

		const tokenModel = await repo.create({
			userId,
			type: type as any,
			selector,
			token: hashedValidator,
			expiresAt: DateTime.now().plus({ hours: options.expiresInHours ?? 1 }),
			attempts: options.attempts ?? 0,
		});

		return { tokenModel, plainToken };
	};

	test('create(), findById(), and delete()', async ({ assert }) => {
		const u = await uniqueUser('create');
		const { tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);

		const found = await repo.findById(tokenModel.id);
		assert.isNotNull(found);

		const deleted = await repo.delete(tokenModel.id);
		assert.isTrue(deleted);

		assert.isNull(await repo.findById(tokenModel.id));
	});

	test('update()', async ({ assert }) => {
		const u = await uniqueUser('update');
		const { tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);

		const updated = await repo.update(tokenModel.id, { attempts: 5 });
		assert.equal(updated!.attempts, 5);
	});

	test('findBySelector() returns the record only when the type matches and the token is live', async ({ assert }) => {
		const u = await uniqueUser('findsel');
		const { tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);
		const selector = tokenModel.selector!;

		assert.equal((await repo.findBySelector(selector, TOKEN_TYPES.PASSWORD_RESET))!.id, tokenModel.id);

		// Wrong type
		assert.isNull(await repo.findBySelector(selector, TOKEN_TYPES.EMAIL_VERIFICATION));

		// Unknown selector
		assert.isNull(await repo.findBySelector('nosuchselector', TOKEN_TYPES.PASSWORD_RESET));

		// Expired token
		const { tokenModel: expiredModel } = await createTestToken(u.id, TOKEN_TYPES.EMAIL_VERIFICATION, {
			expiresInHours: -1,
		});
		assert.isNull(await repo.findBySelector(expiredModel.selector!, TOKEN_TYPES.EMAIL_VERIFICATION));
	});

	test('expireTokensByType() expires every token of the type and leaves other types alone', async ({ assert }) => {
		const u = await uniqueUser('expire');
		const { plainToken: evToken } = await createTestToken(u.id, TOKEN_TYPES.EMAIL_VERIFICATION);
		const { tokenModel: prModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);

		await repo.expireTokensByType(u, TOKEN_TYPES.EMAIL_VERIFICATION);

		// The verification token is expired — a usable lookup no longer finds it.
		assert.isNull(await repo.findBySelector(evToken.split('.')[0], TOKEN_TYPES.EMAIL_VERIFICATION));

		// A token of another type is untouched.
		assert.isAbove(prModel.expiresAt!.toMillis(), DateTime.now().toMillis());
	});

	test('lockBySelector() returns the locked record inside a transaction', async ({ assert }) => {
		const u = await uniqueUser('lock');
		const { plainToken, tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);

		const locked = await withTransaction(async () => {
			return await repo.lockBySelector(plainToken.split('.')[0], TOKEN_TYPES.PASSWORD_RESET);
		});

		assert.equal(locked!.id, tokenModel.id);
	});

	test('lockBySelector() returns null for a missing record', async ({ assert }) => {
		await assert.isNull(await repo.lockBySelector('nosuchsel', TOKEN_TYPES.PASSWORD_RESET));
	});

	test('checkAndIncrementAttempt() increments exactly once per call', async ({ assert }) => {
		const u = await uniqueUser('attempts');
		const { plainToken, tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);
		const selector = plainToken.split('.')[0];

		for (let i = 1; i <= 3; i++) {
			const outcome = await repo.checkAndIncrementAttempt(selector, 3);
			assert.isFalse(outcome!.lockedOut);
			assert.equal((await repo.findById(tokenModel.id))!.attempts, i);
		}
	});

	test('checkAndIncrementAttempt() reports lockout without incrementing at the cap', async ({ assert }) => {
		const u = await uniqueUser('locked');
		const { plainToken, tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET, { attempts: 3 });
		const selector = plainToken.split('.')[0];

		const outcome = await repo.checkAndIncrementAttempt(selector, 3);
		assert.isTrue(outcome!.lockedOut);
		assert.equal((await repo.findById(tokenModel.id))!.attempts, 3);
	});

	test('checkAndIncrementAttempt() returns null for an unknown selector', async ({ assert }) => {
		assert.isNull(await repo.checkAndIncrementAttempt('unknownselector', 3));
	});

	test('checkAndIncrementAttempt() cannot be bypassed by concurrent callers', async ({ assert }) => {
		const u = await uniqueUser('concurrent');
		const { plainToken, tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET);
		const selector = plainToken.split('.')[0];

		// Cap of 3: of 10 concurrent callers, exactly 3 may increment — the
		// rest must observe the lockout. An unlocked check-then-act lets the
		// concurrent readers all see the stale counter, bypass the cap, and
		// clobber each other's increment.
		const outcomes = await Promise.all(Array.from({ length: 10 }, () => repo.checkAndIncrementAttempt(selector, 3)));

		const accepted = outcomes.filter((o) => o && !o.lockedOut);
		const lockedOut = outcomes.filter((o) => o?.lockedOut);

		assert.equal(accepted.length, 3);
		assert.equal(lockedOut.length, 7);

		assert.equal((await repo.findById(tokenModel.id))!.attempts, 3);
	});
});
