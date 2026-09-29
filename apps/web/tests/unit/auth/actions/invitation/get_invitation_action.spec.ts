import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { GetInvitationAction } from '#auth/actions/invitation/get_invitation_action';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import { TokenRepository } from '#auth/repositories/token_repository';
import User from '#identity/models/user';

test.group('GetInvitationAction', () => {
	test('execute() returns user associated with the token', async ({ assert }) => {
		const action = await app.container.make(GetInvitationAction);
		const tokenRepo = await app.container.make(TokenRepository);

		const user = await User.create({ email: 'invite_get@test.com', username: 'invite_get' });
		const { selector, validator, token: fullToken } = Token.generateSplit();
		const hashedValidator = await hash.make(validator);

		await tokenRepo.create({
			userId: user.id,
			type: TOKEN_TYPES.PENDING_INVITE,
			selector,
			token: hashedValidator,
			expiresAt: DateTime.now().plus({ hours: 1 }),
		});

		const foundUser = await action.execute({ token: fullToken as any });
		assert.equal(foundUser.id, user.id);
	});

	test('execute() throws on invalid token', async ({ assert }) => {
		const action = await app.container.make(GetInvitationAction);

		await assert.rejects(async () => {
			await action.execute({ token: 'invalid.token' as any });
		}, InvalidTokenException);
	});
});
