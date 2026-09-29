import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { ValidatePasswordTokenAction } from '#auth/actions/password/validate_password_token_action';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import TokenModel from '#auth/models/token';
import { TokenRepository } from '#auth/repositories/token_repository';
import User from '#identity/models/user';

test.group('ValidatePasswordTokenAction', () => {
	test('execute() throws on invalid token', async ({ assert }) => {
		const action = await app.container.make(ValidatePasswordTokenAction);

		await assert.rejects(async () => {
			await action.execute({ token: 'invalid.token' as any });
		}, InvalidTokenException);
	});

	test('execute() consumes exactly one attempt for a valid token', async ({ assert }) => {
		const action = await app.container.make(ValidatePasswordTokenAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({
			email: 'validate_count@example.com',
			username: 'validate_count',
		});

		const { selector, validator, token: fullToken } = Token.generateSplit();

		await tokenRepo.create({
			userId: user.id,
			type: TOKEN_TYPES.PASSWORD_RESET,
			selector,
			token: await hash.make(validator),
			expiresAt: DateTime.now().plus({ hours: 1 }),
		});

		await action.execute({ token: fullToken as any });

		assert.equal((await TokenModel.query().where('selector', selector).first())!.attempts, 1);
	});
});
