import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { resetSharedState } from '#tests/helpers/shared_state';
import { createSplitToken } from '#tests/helpers/tokens';
import { fieldError } from '#tests/helpers/validation';

/**
 * Functional seam for the reset-password flow
 * (`GET /reset-password/:token` render, `POST /reset-password` execute).
 *
 * Replaces the Playwright browser E2E: we assert the HTTP contract a client
 * observes — the 200 render for a live token, the coded 400 for an invalid or
 * expired token, the 302 to the profile page on a valid submission, and the 422
 * field errors on a weak or mismatched password.
 */
test.group('Reset password endpoint', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('reset (render): a live token renders the reset form', async ({ client }) => {
		const user = await createVerifiedUser({
			email: 'reset-render@example.com',
			password: 'OldPassword123!',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET);

		const res = await client.get(`/reset-password/${token}`);

		res.assertStatus(200);
	});

	test('reset (render): an invalid token returns a coded 400', async ({ client, assert }) => {
		const res = await client.get('/reset-password/invalid-token').redirects(0).accept('json');

		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
	});

	test('reset (render): an expired token returns a coded 400', async ({ client, assert }) => {
		const user = await createVerifiedUser({
			email: 'reset-expired@example.com',
			password: 'OldPassword123!',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET, { hours: -1 });

		const res = await client.get(`/reset-password/${token}`).redirects(0).accept('json');

		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
	});

	test('reset (execute): a valid token changes the password and redirects to the profile', async ({ client }) => {
		const user = await createVerifiedUser({
			email: 'reset-execute@example.com',
			password: 'OldPassword123!',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET);

		const res = await client
			.post('/reset-password')
			.redirects(0)
			.withCsrfToken()
			.form({ token, password: 'NewPassword123!', password_confirmation: 'NewPassword123!' })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings/profile');
	});

	test('reset (execute): a weak password returns a 422 with a password field error', async ({ client, assert }) => {
		const user = await createVerifiedUser({
			email: 'reset-weak@example.com',
			password: 'OldPassword123!',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET);

		const res = await client
			.post('/reset-password')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({ token, password: 'weak', password_confirmation: 'weak' })
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'password'));
	});

	test('reset (execute): a confirmation mismatch returns a 422 with a password field error', async ({
		client,
		assert,
	}) => {
		const user = await createVerifiedUser({
			email: 'reset-mismatch@example.com',
			password: 'OldPassword123!',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET);

		const res = await client
			.post('/reset-password')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({ token, password: 'NewPassword123!', password_confirmation: 'Different123!' })
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'password_confirmation'));
	});
});
