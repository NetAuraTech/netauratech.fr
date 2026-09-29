import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import { CreateApiTokenAction } from '#auth/actions/token/create_api_token_action';
import User from '#identity/models/user';

test.group('CreateApiTokenAction', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('execute() creates a persisted access token and returns its secret', async ({ assert }) => {
		const action = await app.container.make(CreateApiTokenAction);
		const timestamp = Date.now();

		const user = await User.create({
			email: `apitoken${timestamp}@test.com`,
			username: `apitoken_${timestamp}`,
			password: 'password123',
		});

		const result = await action.execute({ user });

		assert.isString(result.token);
		assert.isNotEmpty(result.token);
		assert.isNotNull(result.expiresAt);

		const row = await db.from('auth_access_tokens').where('tokenable_id', user.id).first();
		assert.exists(row, 'the token must be persisted in auth_access_tokens');
	});
});
