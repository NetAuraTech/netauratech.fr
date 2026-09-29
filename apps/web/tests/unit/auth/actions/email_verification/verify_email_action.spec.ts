import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { VerifyEmailAction } from '#auth/actions/email_verification/verify_email_action';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import TokenModel from '#auth/models/token';
import { TokenRepository } from '#auth/repositories/token_repository';
import { TokenService } from '#auth/services/token_service';
import User from '#identity/models/user';

test.group('VerifyEmailAction', () => {
	test('execute() updates user email verified status and expires tokens', async ({ assert }) => {
		const action = await app.container.make(VerifyEmailAction);
		const tokenRepo = await app.container.make(TokenRepository);
		const tokenService = await app.container.make(TokenService);

		const user = await User.create({
			email: 'verify_me@test.com',
			username: 'verify_me',
			password: 'pwd',
		});

		assert.isFalse(user.isEmailVerified);

		const { selector, validator, token: fullToken } = Token.generateSplit();
		const hashedValidator = await hash.make(validator);

		await tokenRepo.create({
			userId: user.id,
			type: TOKEN_TYPES.EMAIL_VERIFICATION,
			selector,
			token: hashedValidator,
			expiresAt: DateTime.now().plus({ hours: 1 }),
		});

		const verifiedUser = await action.execute({ token: fullToken as any });

		assert.isNotNull(verifiedUser);
		assert.isTrue(verifiedUser!.isEmailVerified);

		await assert.rejects(async () => {
			await tokenService.resolveUser(fullToken as any, TOKEN_TYPES.EMAIL_VERIFICATION);
		}, InvalidTokenException);
	});

	test('execute() throws on invalid token', async ({ assert }) => {
		const action = await app.container.make(VerifyEmailAction);

		await assert.rejects(async () => {
			await action.execute({ token: 'invalid.token' as any });
		}, InvalidTokenException);
	});

	test('execute() called concurrently with the same token: exactly one presentation acts', async ({ assert }) => {
		const action = await app.container.make(VerifyEmailAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({
			email: 'verify_race@test.com',
			username: 'verify_race',
			password: 'pwd',
		});

		const { selector, validator, token: fullToken } = Token.generateSplit();
		await tokenRepo.create({
			userId: user.id,
			type: TOKEN_TYPES.EMAIL_VERIFICATION,
			selector,
			token: await hash.make(validator),
			expiresAt: DateTime.now().plus({ hours: 1 }),
		});

		// Two presentations of the same token racing: the token row is locked
		// inside the transaction, so the second one must observe the token
		// consumed by the first and be rejected.
		const results = await Promise.allSettled([
			action.execute({ token: fullToken as any }),
			action.execute({ token: fullToken as any }),
		]);

		const statuses = results.map((r) => r.status).sort();
		assert.deepEqual(statuses, ['fulfilled', 'rejected']);

		const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
		assert.instanceOf(rejected.reason, InvalidTokenException);

		const reloaded = await User.findOrFail(user.id);
		assert.isTrue(reloaded.isEmailVerified);

		// The counter is under-counted under true concurrency: checkAttempts is
		// a non-atomic read-modify-write (pre-existing), so both presentations
		// can read 0 and write 1. Assert the bounded outcome, not the exact sum.
		const attempts = (await TokenModel.query().where('selector', selector).first())!.attempts;
		assert.isTrue(attempts >= 1 && attempts <= 2, `attempts=${attempts} not in [1,2]`);
	});
});
