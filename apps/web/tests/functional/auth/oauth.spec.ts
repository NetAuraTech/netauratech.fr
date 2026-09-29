import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';

/**
 * Functional seam for the social (OAuth) endpoints
 * (`/oauth/define-password`, `/oauth/:provider`, `/oauth/:provider/callback`,
 * `/oauth/:provider/unlink`).
 *
 * Replaces the Playwright browser E2E (which could only assert loose redirect
 * URLs against unconfigured providers): we assert the coded HTTP contract a
 * client observes. No OAuth provider is configured in the test environment, so
 * every provider-bound endpoint is rejected up front with a coded
 * 501 `E_PROVIDER_NOT_CONFIGURED` carrying the provider in its details. The
 * provider-agnostic define-password render loads for anyone; its execute is
 * auth-gated and rejects a guest with a 401.
 */
test.group('Social (OAuth) endpoints', (group) => {
	group.each.setup(() => testUtils.db().truncate());

	test('define-password (render): the page loads', async ({ client }) => {
		const res = await client.get('/oauth/define-password');

		res.assertStatus(200);
	});

	test('define-password (execute): a guest is rejected with a 401', async ({ client }) => {
		const res = await client
			.post('/oauth/define-password')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({ password: 'NewPassword123!', password_confirmation: 'NewPassword123!' })
			.send();

		res.assertStatus(401);
	});

	test('redirect: an unconfigured provider returns a coded 501', async ({ client, assert }) => {
		const res = await client.get('/oauth/github').redirects(0).accept('json');

		res.assertStatus(501);
		assert.equal(res.body().error.code, 'E_PROVIDER_NOT_CONFIGURED');
		assert.equal(res.body().error.details.provider, 'github');
	});

	test('callback: an unconfigured provider returns a coded 501', async ({ client, assert }) => {
		const res = await client.get('/oauth/github/callback').redirects(0).accept('json');

		res.assertStatus(501);
		assert.equal(res.body().error.code, 'E_PROVIDER_NOT_CONFIGURED');
	});

	test('unlink: an unconfigured provider returns a coded 501', async ({ client, assert }) => {
		const res = await client.post('/oauth/github/unlink').redirects(0).withCsrfToken().accept('json').send();

		res.assertStatus(501);
		assert.equal(res.body().error.code, 'E_PROVIDER_NOT_CONFIGURED');
		assert.equal(res.body().error.details.provider, 'github');
	});

	test('redirect: an unsupported provider returns a coded 501', async ({ client, assert }) => {
		const res = await client.get('/oauth/twitter').redirects(0).accept('json');

		res.assertStatus(501);
		assert.equal(res.body().error.code, 'E_PROVIDER_NOT_CONFIGURED');
	});
});
