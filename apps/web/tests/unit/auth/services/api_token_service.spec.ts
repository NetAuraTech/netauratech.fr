import { Secret } from '@adonisjs/core/helpers';
import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import db from '@adonisjs/lucid/services/db';
import { test } from '@japa/runner';
import { ApiTokenService } from '#auth/services/api_token_service';
import User from '#identity/models/user';

test.group('ApiTokenService', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('issue() creates a persisted access token and returns its secret', async ({ assert }) => {
		const service = await app.container.make(ApiTokenService);
		const timestamp = Date.now();

		const user = await User.create({
			email: `svctoken${timestamp}@test.com`,
			username: `svctoken_${timestamp}`,
			password: 'password123',
		});

		const result = await service.issue(user);

		assert.isString(result.token);
		assert.isNotEmpty(result.token);
		assert.isNotNull(result.expiresAt);

		const row = await db.from('auth_access_tokens').where('tokenable_id', user.id).first();
		assert.exists(row, 'the token must be persisted in auth_access_tokens');

		const verified = await User.accessTokens.verify(new Secret(result.token));
		assert.equal(verified?.tokenableId, user.id);
	});

	test('revoke() deletes the token row owned by the user', async ({ assert }) => {
		const service = await app.container.make(ApiTokenService);
		const timestamp = Date.now();

		const user = await User.create({
			email: `svcrevoke${timestamp}@test.com`,
			username: `svcrevoke_${timestamp}`,
			password: 'password123',
		});

		const token = await User.accessTokens.create(user);
		await service.revoke(user, token.identifier);

		const row = await db
			.from('auth_access_tokens')
			.where('tokenable_id', user.id)
			.where('id', String(token.identifier))
			.first();
		assert.isNull(row ?? null, 'the token row must be deleted');
	});
});
