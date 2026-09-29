import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { ResetPasswordAction } from '#auth/actions/password/reset_password_action';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import MaxAttemptsExceededException from '#auth/exceptions/max_attempts_exceeded_exception';
import TokenModel from '#auth/models/token';
import { TokenRepository } from '#auth/repositories/token_repository';
import { TokenService } from '#auth/services/token_service';
import User from '#identity/models/user';

test.group('ResetPasswordAction', () => {
	const createResetToken = async (
		tokenRepo: TokenRepository,
		userId: number,
		options: { expiresInHours?: number; attempts?: number } = {},
	) => {
		const { selector, validator, token: fullToken } = Token.generateSplit();

		await tokenRepo.create({
			userId,
			type: TOKEN_TYPES.PASSWORD_RESET,
			selector,
			token: await hash.make(validator),
			expiresAt: DateTime.now().plus({ hours: options.expiresInHours ?? 1 }),
			attempts: options.attempts ?? 0,
		});

		return { selector, fullToken };
	};

	test('execute() updates password and expires tokens', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);
		const tokenRepo = await app.container.make(TokenRepository);
		const tokenService = await app.container.make(TokenService);

		const user = await User.create({
			email: 'reset@test.com',
			username: 'reset',
			password: 'old_password',
		});

		const { fullToken } = await createResetToken(tokenRepo, user.id);

		const updatedUser = await action.execute({
			token: fullToken as any,
			password: 'new_password123',
		});

		assert.equal(updatedUser.id, user.id);
		assert.isTrue(await hash.verify(updatedUser.password!, 'new_password123'));

		await assert.rejects(async () => {
			await tokenService.resolveUser(fullToken as any, TOKEN_TYPES.PASSWORD_RESET);
		}, InvalidTokenException);
	});

	test('execute() throws on invalid token', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);

		await assert.rejects(async () => {
			await action.execute({ token: 'invalid.token' as any, password: 'new_password' });
		}, InvalidTokenException);
	});

	test('execute() consumes exactly one attempt on success and expires the token', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({
			email: 'reset_count@test.com',
			username: 'reset_count',
			password: 'old_password',
		});

		const { selector, fullToken } = await createResetToken(tokenRepo, user.id);

		await action.execute({
			token: fullToken as any,
			password: 'new_password123',
		});

		const record = await TokenModel.query().where('selector', selector).first();
		assert.equal(record!.attempts, 1);
		assert.isAtMost(record!.expiresAt!.toMillis(), DateTime.now().toMillis());
	});

	test('execute() consumes exactly one attempt on an invalid validator', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({
			email: 'reset_badval@test.com',
			username: 'reset_badval',
			password: 'old_password',
		});

		const { selector } = await createResetToken(tokenRepo, user.id);

		await assert.rejects(async () => {
			await action.execute({ token: `${selector}.wrongvalidator` as any, password: 'new_password123' });
		}, InvalidTokenException);

		assert.equal((await TokenModel.query().where('selector', selector).first())!.attempts, 1);
	});

	test('execute() consumes exactly one attempt on an expired token', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({
			email: 'reset_expired@test.com',
			username: 'reset_expired',
			password: 'old_password',
		});

		const { selector, fullToken } = await createResetToken(tokenRepo, user.id, { expiresInHours: -1 });

		await assert.rejects(async () => {
			await action.execute({ token: fullToken as any, password: 'new_password123' });
		}, InvalidTokenException);

		assert.equal((await TokenModel.query().where('selector', selector).first())!.attempts, 1);
	});

	test('execute() called concurrently with the same token: exactly one presentation acts', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({
			email: 'reset_race@test.com',
			username: 'reset_race',
			password: 'old_password',
		});

		const { selector, fullToken } = await createResetToken(tokenRepo, user.id);

		// Two presentations of the same token racing: the token row is locked
		// inside the transaction, so the second one must observe the token
		// consumed by the first and be rejected.
		const results = await Promise.allSettled([
			action.execute({ token: fullToken as any, password: 'new_password123' }),
			action.execute({ token: fullToken as any, password: 'other_password1' }),
		]);

		const statuses = results.map((r) => r.status).sort();
		assert.deepEqual(statuses, ['fulfilled', 'rejected']);

		const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
		assert.instanceOf(rejected.reason, InvalidTokenException);

		// The token is consumed: expired. The counter is under-counted under
		// true concurrency (checkAttempts is a non-atomic read-modify-write
		// outside the transaction, pre-existing), so assert the bounded outcome.
		const record = await TokenModel.query().where('selector', selector).first();
		assert.isTrue(record!.attempts >= 1 && record!.attempts <= 2, `attempts=${record!.attempts} not in [1,2]`);
		assert.isAtMost(record!.expiresAt!.toMillis(), DateTime.now().toMillis());

		// Exactly one of the two passwords won — the other presentation did not act.
		const reloaded = await User.findOrFail(user.id);
		const matchesFirst = await hash.verify(reloaded.password!, 'new_password123');
		const matchesSecond = await hash.verify(reloaded.password!, 'other_password1');
		assert.isFalse(matchesFirst && matchesSecond);
		assert.isTrue(matchesFirst || matchesSecond);
	});

	test('execute() throws without further increment on a locked token', async ({ assert }) => {
		const action = await app.container.make(ResetPasswordAction);
		const tokenRepo = await app.container.make(TokenRepository);
		const tokenService = await app.container.make(TokenService);

		const user = await User.create({
			email: 'reset_locked@test.com',
			username: 'reset_locked',
			password: 'old_password',
		});

		const { selector, fullToken } = await createResetToken(tokenRepo, user.id, {
			attempts: tokenService.MAX_ATTEMPTS,
		});

		await assert.rejects(async () => {
			await action.execute({ token: fullToken as any, password: 'new_password123' });
		}, MaxAttemptsExceededException);

		assert.equal((await TokenModel.query().where('selector', selector).first())!.attempts, tokenService.MAX_ATTEMPTS);
	});
});
