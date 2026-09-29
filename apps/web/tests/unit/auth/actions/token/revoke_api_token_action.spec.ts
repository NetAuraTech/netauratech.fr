import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import { RevokeApiTokenAction } from '#auth/actions/token/revoke_api_token_action';
import User from '#identity/models/user';

test.group('RevokeApiTokenAction', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('execute() deletes the token row owned by the user', async ({ assert }) => {
		const action = await app.container.make(RevokeApiTokenAction);
		const timestamp = Date.now();

		const user = await User.create({
			email: `apirevoke${timestamp}@test.com`,
			username: `apirevoke_${timestamp}`,
			password: 'password123',
		});

		const token = await User.accessTokens.create(user);
		await action.execute({ user, tokenIdentifier: token.identifier });

		const row = await db
			.from('auth_access_tokens')
			.where('tokenable_id', user.id)
			.where('id', String(token.identifier))
			.first();
		assert.isNull(row ?? null, 'the token row must be deleted');
	});
});
