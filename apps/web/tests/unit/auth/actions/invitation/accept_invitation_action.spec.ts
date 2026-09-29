import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { AcceptInvitationAction } from '#auth/actions/invitation/accept_invitation_action';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import { TokenRepository } from '#auth/repositories/token_repository';
import { TokenService } from '#auth/services/token_service';
import User from '#identity/models/user';

test.group('AcceptInvitationAction', () => {
	test('execute() updates password, sets emailVerifiedAt and expires tokens', async ({ assert }) => {
		const action = await app.container.make(AcceptInvitationAction);
		const tokenRepo = await app.container.make(TokenRepository);
		const tokenService = await app.container.make(TokenService);

		const user = await User.create({
			email: 'invite_accept@test.com',
			username: 'invite_accept',
		});
		assert.isUndefined(user.password);
		assert.isFalse(user.isEmailVerified);

		const { selector, validator, token: fullToken } = Token.generateSplit();
		const hashedValidator = await hash.make(validator);

		await tokenRepo.create({
			userId: user.id,
			type: TOKEN_TYPES.PENDING_INVITE,
			selector,
			token: hashedValidator,
			expiresAt: DateTime.now().plus({ hours: 1 }),
		});

		const updatedUser = await action.execute({
			token: fullToken as any,
			password: 'new_password123',
		});

		assert.equal(updatedUser.id, user.id);
		assert.isNotNull(updatedUser.password);
		assert.isTrue(await hash.verify(updatedUser.password!, 'new_password123'));
		assert.isTrue(updatedUser.isEmailVerified);

		await assert.rejects(async () => {
			await tokenService.resolveUser(fullToken as any, TOKEN_TYPES.PENDING_INVITE);
		}, InvalidTokenException);
	});
});
