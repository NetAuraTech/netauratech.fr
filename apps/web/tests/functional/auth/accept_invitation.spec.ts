import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import User from '#identity/models/user';
import { resetSharedState } from '#tests/helpers/shared_state';
import { createSplitToken } from '#tests/helpers/tokens';
import { fieldError } from '#tests/helpers/validation';

/**
 * Functional seam for the accept-invitation flow
 * (`GET /accept-invitation/:token` render, `POST /accept-invitation` execute).
 *
 * Replaces the Playwright browser E2E: we assert the HTTP contract a client
 * observes — the 200 render for a live token, the coded 400 for an invalid or
 * expired token, the 302 to the settings index plus the email-verified user row
 * on a valid submission, and the 422 field errors on a weak or mismatched
 * password.
 */
test.group('Accept invitation endpoint', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('accept (render): a live token renders the invitation form', async ({ client }) => {
		const user = await User.create({
			email: 'invite-render@example.com',
			username: 'invite-render',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PENDING_INVITE);

		const res = await client.get(`/accept-invitation/${token}`);

		res.assertStatus(200);
	});

	test('accept (render): an invalid token returns a coded 400', async ({ client, assert }) => {
		const res = await client.get('/accept-invitation/invalid-token').redirects(0).accept('json');

		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
	});

	test('accept (render): an expired token returns a coded 400', async ({ client, assert }) => {
		const user = await User.create({
			email: 'invite-expired@example.com',
			username: 'invite-expired',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PENDING_INVITE, { hours: -1 });

		const res = await client.get(`/accept-invitation/${token}`).redirects(0).accept('json');

		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
	});

	test('accept (execute): a valid token activates the user and redirects to settings', async ({ client, assert }) => {
		const user = await User.create({
			email: 'invite-success@example.com',
			username: 'invite-success',
			password: null,
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PENDING_INVITE);

		const res = await client
			.post('/accept-invitation')
			.redirects(0)
			.withCsrfToken()
			.form({
				token,
				email: user.email,
				username: user.username,
				password: 'NewPassword123!',
				password_confirmation: 'NewPassword123!',
			})
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings');

		await user.refresh();
		assert.isNotNull(user.emailVerifiedAt);
	});

	test('accept (execute): a weak password returns a 422 with a password field error', async ({ client, assert }) => {
		const user = await User.create({
			email: 'invite-weak@example.com',
			username: 'invite-weak',
			password: null,
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PENDING_INVITE);

		const res = await client
			.post('/accept-invitation')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({
				token,
				email: user.email,
				username: user.username,
				password: 'weak',
				password_confirmation: 'weak',
			})
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'password'));
	});

	test('accept (execute): a confirmation mismatch returns a 422 with a password field error', async ({
		client,
		assert,
	}) => {
		const user = await User.create({
			email: 'invite-mismatch@example.com',
			username: 'invite-mismatch',
			password: null,
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PENDING_INVITE);

		const res = await client
			.post('/accept-invitation')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({
				token,
				email: user.email,
				username: user.username,
				password: 'NewPassword123!',
				password_confirmation: 'Different123!',
			})
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'password_confirmation'));
	});
});
