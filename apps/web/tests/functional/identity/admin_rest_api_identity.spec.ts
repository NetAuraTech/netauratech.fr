import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import User from '#identity/models/user';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import { resetSharedState } from '#tests/helpers/shared_state';
import { createSplitToken } from '#tests/helpers/tokens';

async function setupGroup(group: any) {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	// Register and forgot-password send their mails directly through the
	// mail client (no event bus) — swap the binding so the suite never
	// touches a real transport.
	group.each.setup(() => {
		swapMailClient();
		return () => restoreMailClient();
	});
	group.each.teardown(() => limiter.clear());
}

test.group('Public API v1 — Register', (group) => {
	setupGroup(group);

	test('registers a user and returns it with 201', async ({ client, assert }) => {
		const res = await client.post('/api/v1/auth/register').accept('json').json({
			email: 'new-api-user@example.com',
			password: 'Password123!',
			password_confirmation: 'Password123!',
		});

		res.assertStatus(201);
		assert.equal(res.body().data.email, 'new-api-user@example.com');
	});

	test('register returns 422 on duplicate email', async ({ client }) => {
		await createVerifiedUser({ email: 'taken-api@example.com' });

		const res = await client.post('/api/v1/auth/register').accept('json').json({
			email: 'taken-api@example.com',
			password: 'Password123!',
			password_confirmation: 'Password123!',
		});

		res.assertStatus(422);
	});
});

test.group('Public API v1 — Forgot password', (group) => {
	setupGroup(group);

	test('forgot-password returns 200 for a known email', async ({ client }) => {
		await createVerifiedUser({ email: 'forgot-api@example.com' });

		const res = await client
			.post('/api/v1/auth/forgot-password')
			.accept('json')
			.json({ email: 'forgot-api@example.com' });

		res.assertStatus(200);
	});

	test('forgot-password returns 200 for an unknown email (no enumeration)', async ({ client }) => {
		const res = await client.post('/api/v1/auth/forgot-password').accept('json').json({ email: 'missing@example.com' });

		res.assertStatus(200);
	});
});

test.group('Public API v1 — Reset password', (group) => {
	setupGroup(group);

	test('resets a password with a valid token', async ({ client }) => {
		const user = await createVerifiedUser({ email: 'reset-api@example.com' });
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET);

		const res = await client
			.post('/api/v1/auth/reset-password')
			.accept('json')
			.json({ token, password: 'NewPassword123!', password_confirmation: 'NewPassword123!' });

		res.assertStatus(200);
	});

	test('reset-password returns 422 on short password', async ({ client }) => {
		const user = await createVerifiedUser({ email: 'reset-short-api@example.com' });
		const token = await createSplitToken(user, TOKEN_TYPES.PASSWORD_RESET);

		const res = await client
			.post('/api/v1/auth/reset-password')
			.accept('json')
			.json({ token, password: 'short', password_confirmation: 'short' });

		res.assertStatus(422);
	});
});

test.group('Public API v1 — Email verification', (group) => {
	setupGroup(group);

	test('verifies an email with a valid token', async ({ client }) => {
		const user = await User.create({
			email: 'verify-api@example.com',
			username: 'verify-api',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.EMAIL_VERIFICATION);

		const res = await client.post(`/api/v1/auth/verify-email/${token}`).accept('json');

		res.assertStatus(200);
	});

	test('verify-email returns 404 on invalid token', async ({ client }) => {
		const res = await client.post('/api/v1/auth/verify-email/invalid.token').accept('json');
		res.assertStatus(404);
	});
});

test.group('Public API v1 — Accept invitation', (group) => {
	setupGroup(group);

	test('accepts an invitation', async ({ client }) => {
		const invited = await User.create({
			email: 'invite-api@example.com',
			username: 'invite-api',
		});
		const token = await createSplitToken(invited, TOKEN_TYPES.PENDING_INVITE);

		const res = await client.post('/api/v1/auth/accept-invitation').accept('json').json({
			token,
			email: 'invite-api@example.com',
			username: 'invite-api',
			password: 'Password123!',
			password_confirmation: 'Password123!',
		});

		res.assertStatus(200);
	});

	test('accept-invitation returns 404 on invalid token', async ({ client }) => {
		const res = await client.post('/api/v1/auth/accept-invitation').accept('json').json({
			token: 'invalid.token',
			email: 'x@example.com',
			username: 'x',
			password: 'Password123!',
			password_confirmation: 'Password123!',
		});

		res.assertStatus(404);
	});
});

test.group('Authenticated API v1 — Profile', (group) => {
	setupGroup(group);

	test('shows the current user profile', async ({ client, assert }) => {
		const user = await createVerifiedUser({ email: 'profile-api@example.com' });
		const token = await User.accessTokens.create(user);

		const res = await client.get('/api/v1/profile').accept('json').bearerToken(token.value!.release());

		res.assertStatus(200);
		assert.equal(res.body().data.email, 'profile-api@example.com');
	});

	test('updates the current user username', async ({ client, assert }) => {
		const user = await createVerifiedUser({ email: 'profile-update-api@example.com' });
		const token = await User.accessTokens.create(user);

		const res = await client
			.put('/api/v1/profile')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ username: 'newname' });

		res.assertStatus(200);
		assert.equal(res.body().data.username, 'newname');
	});

	test('profile returns 401 without token', async ({ client }) => {
		const res = await client.get('/api/v1/profile').accept('json');
		res.assertStatus(401);
	});
});

test.group('Authenticated API v1 — Account', (group) => {
	setupGroup(group);

	test('updates the account email', async ({ client, assert }) => {
		const user = await createVerifiedUser({ email: 'account-api@example.com' });
		const token = await User.accessTokens.create(user);

		const res = await client
			.put('/api/v1/account')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ _action: 'update_email', email: 'account-new@example.com' });

		res.assertStatus(200);
		assert.equal(res.body().data.email, 'account-api@example.com');
	});

	test('updates the account password', async ({ client }) => {
		const user = await createVerifiedUser({
			email: 'account-pwd@example.com',
			password: 'OldPassword123!',
		});
		const token = await User.accessTokens.create(user);

		const res = await client.put('/api/v1/account').accept('json').bearerToken(token.value!.release()).json({
			_action: 'update_password',
			current_password: 'OldPassword123!',
			password: 'NewPassword123!',
			password_confirmation: 'NewPassword123!',
		});

		res.assertStatus(200);
	});

	test('deletes the current account', async ({ client }) => {
		const user = await createVerifiedUser({
			email: 'account-delete@example.com',
			password: 'DeletePassword123!',
		});
		const token = await User.accessTokens.create(user);

		const res = await client
			.delete('/api/v1/account')
			.accept('json')
			.bearerToken(token.value!.release())
			.json({ password: 'DeletePassword123!' });

		res.assertStatus(204);
	});

	test('account returns 401 without token', async ({ client }) => {
		const res = await client.put('/api/v1/account').accept('json').json({
			_action: 'update_email',
			email: 'x@example.com',
		});
		res.assertStatus(401);
	});
});
