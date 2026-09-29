import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import User from '#identity/models/user';
import { createAdminUser } from '#tests/helpers/create_admin_user';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { resetSharedState } from '#tests/helpers/shared_state';

/**
 * Per-API-client rate limiting — the `api_client` limiter applied to every
 * authenticated `/api/v1/*` route group.
 *
 * Each authenticated user consumes a per-client budget keyed by their id
 * (never the raw IP). The budget comes from the user's `apiRateLimit`
 * column, falling back to the `API_RATE_LIMIT_DEFAULT` env value (1000/minute
 * in `.env.test`). Exceeding the budget yields a JSON 429 carrying the
 * standard `X-RateLimit-*` and `Retry-After` headers.
 */
test.group('Per-API-client rate limiting', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('limit is read from the user record', async ({ client, assert }) => {
		const user = await createVerifiedUser({ email: 'rate-custom@example.com', apiRateLimit: 2 });
		const token = await User.accessTokens.create(user);

		const first = await client.get('/api/v1/auth/me').accept('json').bearerToken(token.value!.release());
		first.assertStatus(200);

		const second = await client.get('/api/v1/auth/me').accept('json').bearerToken(token.value!.release());
		second.assertStatus(200);

		const third = await client.get('/api/v1/auth/me').accept('json').bearerToken(token.value!.release());
		third.assertStatus(429);
		assert.equal(third.body().error.code, 'E_TOO_MANY_REQUESTS');
	});

	test('429 carries the standard rate-limit headers', async ({ client, assert }) => {
		const user = await createVerifiedUser({ email: 'rate-headers@example.com', apiRateLimit: 1 });
		const token = await User.accessTokens.create(user);

		await client.get('/api/v1/auth/me').accept('json').bearerToken(token.value!.release());

		const exceeded = await client.get('/api/v1/auth/me').accept('json').bearerToken(token.value!.release());
		exceeded.assertStatus(429);

		const headers = exceeded.headers();
		assert.equal(Number(headers['x-ratelimit-limit']), 1);
		assert.equal(Number(headers['x-ratelimit-remaining']), 0);
		assert.isAbove(Number(headers['retry-after']), 0);
		assert.exists(headers['x-ratelimit-reset']);
	});

	test('budgets are isolated per client', async ({ client }) => {
		const limited = await createVerifiedUser({ email: 'rate-limited@example.com', apiRateLimit: 1 });
		const limitedToken = await User.accessTokens.create(limited);

		await client.get('/api/v1/auth/me').accept('json').bearerToken(limitedToken.value!.release());

		// The other client has not consumed anything and must be unaffected.
		const other = await createVerifiedUser({ email: 'rate-other@example.com', apiRateLimit: 1 });
		const otherToken = await User.accessTokens.create(other);

		const res = await client.get('/api/v1/auth/me').accept('json').bearerToken(otherToken.value!.release());
		res.assertStatus(200);
	});

	test('system default applies when the user has no custom limit', async ({ client, assert }) => {
		// `.env.test` sets API_RATE_LIMIT_DEFAULT=1000.
		const user = await createVerifiedUser({ email: 'rate-default@example.com' });
		const token = await User.accessTokens.create(user);

		const res = await client.get('/api/v1/auth/me').accept('json').bearerToken(token.value!.release());
		res.assertStatus(200);
		assert.equal(Number(res.headers()['x-ratelimit-limit']), 1000);
	});

	test('the admin update endpoint persists the per-client limit', async ({ client, assert }) => {
		const admin = await createAdminUser({ email: 'rate-admin@example.com', permissionSlugs: ['users.update'] });
		const token = await User.accessTokens.create(admin);

		const res = await client
			.put(`/api/v1/admin/users/${admin.id}`)
			.accept('json')
			.bearerToken(token.value!.release())
			.json({
				email: admin.email,
				username: admin.username,
				role_id: String(admin.roleId),
				api_rate_limit: 7,
			});

		res.assertStatus(200);
		assert.equal(res.body().data.apiRateLimit, 7);
	});
});
