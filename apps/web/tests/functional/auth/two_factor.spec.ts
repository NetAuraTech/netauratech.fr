import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { Totp } from '#auth/domain/totp';
import { createTwoFactorCipher } from '#auth/domain/two_factor_cipher';
import User from '#identity/models/user';
import env from '#start/env';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { resetSharedState } from '#tests/helpers/shared_state';

const cipher = createTwoFactorCipher(env.get('APP_KEY').release());

/**
 * Creates a verified user that already has TOTP 2FA enabled for `secret`.
 * The secret is encrypted at rest with the same application key the
 * {@link TwoFactorService} uses, so a valid code for it is accepted at login.
 */
async function createTwoFactorUser(email: string, secret: string, recoveryCodes: string[] = []) {
	return User.create({
		username: email.split('@')[0],
		email,
		password: 'TestPassword123!',
		emailVerifiedAt: DateTime.now(),
		twoFactorEnabled: true,
		twoFactorSecret: cipher.encrypt(secret),
		twoFactorRecoveryCodes: recoveryCodes.length ? cipher.encrypt(JSON.stringify(recoveryCodes)) : null,
	});
}

/**
 * Functional seam for two-factor (TOTP) authentication.
 *
 * Covers the login-time challenge — a 2FA-enabled user is parked at
 * `/two-factor` after the password (never authenticated), only a valid code
 * opens a session, and a wrong code is rejected with a coded 401 — plus the
 * enrollment self-service endpoints on the account settings page. The verify
 * steps seed the pending challenge via `withSession`, mirroring what the login
 * POST stores, since the api-client does not carry app-written session state
 * across a follow-up CSRF'd request.
 */
test.group('Two-factor (TOTP) authentication', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('login: a 2FA user is redirected to the challenge and is not yet authenticated', async ({ client }) => {
		const user = await createTwoFactorUser('2fa-redirect@example.com', Totp.generateSecret());

		const res = await client
			.post('/login')
			.redirects(0)
			.withCsrfToken()
			.form({ email: user.email, password: 'TestPassword123!' })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/two-factor');

		// The password alone must not open a session.
		const guarded = await client.get('/settings/profile').redirects(0);
		guarded.assertStatus(302);
	});

	test('verify: a pending 2FA user with a valid code is authenticated', async ({ client }) => {
		const secret = Totp.generateSecret();
		const user = await createTwoFactorUser('2fa-valid@example.com', secret);

		// Seed the pending challenge exactly as the login POST parks it, then
		// submit the code. A valid code opens a session; a wrong one cannot.
		const res = await client
			.post('/two-factor')
			.redirects(0)
			.withSession({ twoFactorUserId: user.id })
			.withCsrfToken()
			.form({ code: Totp.code(secret) })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings/profile');

		const guarded = await client.get('/settings/profile');
		guarded.assertStatus(200);
	});

	test('verify: a pending 2FA user with a wrong code is rejected with a coded 401', async ({ client, assert }) => {
		const secret = Totp.generateSecret();
		const user = await createTwoFactorUser('2fa-wrong@example.com', secret);

		// Flip the current code's leading digit so it is guaranteed to be wrong.
		const current = Totp.code(secret);
		const wrong = String((Number(current[0]) + 1) % 10) + current.slice(1);

		const res = await client
			.post('/two-factor')
			.redirects(0)
			.withSession({ twoFactorUserId: user.id })
			.withCsrfToken()
			.accept('json')
			.form({ code: wrong })
			.send();

		res.assertStatus(401);
		assert.equal(res.body().error.code, 'E_INVALID_TWO_FACTOR_CODE');

		const guarded = await client.get('/settings/profile').redirects(0);
		guarded.assertStatus(302);
	});

	test('enrollment: begin_2fa starts a pending enrollment for an authenticated user', async ({ client }) => {
		const user = await createVerifiedUser({
			email: 'enroll-begin@example.com',
			password: 'TestPassword123!',
		});

		const res = await client
			.post('/settings/account')
			.redirects(0)
			.withCsrfToken()
			.loginAs(user)
			.form({ _action: 'begin_2fa' })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings/account');
	});

	test('enrollment: confirm_2fa without a pending secret is rejected', async ({ client }) => {
		const user = await createVerifiedUser({
			email: 'enroll-no-pending@example.com',
			password: 'TestPassword123!',
		});

		const res = await client
			.post('/settings/account')
			.redirects(0)
			.withCsrfToken()
			.loginAs(user)
			.accept('json')
			.form({ _action: 'confirm_2fa', code: '123456' })
			.send();

		res.assertStatus(400);
	});

	test('login: a pending 2FA user with a recovery code is authenticated', async ({ client, assert }) => {
		const secret = Totp.generateSecret();
		const codes = ['ABCDEFG-HJKLM2'];
		const user = await createTwoFactorUser('2fa-recovery@example.com', secret, codes);

		const res = await client
			.post('/two-factor')
			.redirects(0)
			.withSession({ twoFactorUserId: user.id })
			.withCsrfToken()
			.form({ code: codes[0] })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings/profile');

		const guarded = await client.get('/settings/profile');
		guarded.assertStatus(200);

		// The recovery code was consumed.
		const fresh = await User.find(user.id);
		assert.notInclude(
			fresh!.twoFactorRecoveryCodes ? JSON.parse(cipher.decrypt(fresh!.twoFactorRecoveryCodes!)) : [],
			codes[0],
		);
	});

	test('login: a recovery code is single-use and rejected on replay', async ({ client, assert }) => {
		const secret = Totp.generateSecret();
		const codes = ['ABCDEFG-HJKLM2'];
		const user = await createTwoFactorUser('2fa-replay@example.com', secret, codes);

		// First use succeeds.
		const first = await client
			.post('/two-factor')
			.redirects(0)
			.withSession({ twoFactorUserId: user.id })
			.withCsrfToken()
			.form({ code: codes[0] })
			.send();
		first.assertStatus(302);

		// Replay the same code: it has been consumed, so it is rejected.
		const replay = await client
			.post('/two-factor')
			.redirects(0)
			.withSession({ twoFactorUserId: user.id })
			.withCsrfToken()
			.accept('json')
			.form({ code: codes[0] })
			.send();
		replay.assertStatus(401);
		assert.equal(replay.body().error.code, 'E_INVALID_TWO_FACTOR_CODE');
	});

	test('disable_2fa: a valid password and TOTP code disable 2FA', async ({ client, assert }) => {
		const secret = Totp.generateSecret();
		const user = await createTwoFactorUser('2fa-disable@example.com', secret, ['ABCDEFG-HJKLM2']);

		const res = await client
			.post('/settings/account')
			.redirects(0)
			.withCsrfToken()
			.loginAs(user)
			.form({ _action: 'disable_2fa', current_password: 'TestPassword123!', code: Totp.code(secret) })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings/account');

		const fresh = await User.find(user.id);
		assert.isFalse(!!fresh!.twoFactorEnabled);
		assert.isNull(fresh!.twoFactorSecret);
		assert.isNull(fresh!.twoFactorRecoveryCodes);
	});

	test('disable_2fa: a wrong password is rejected and 2FA stays enabled', async ({ client, assert }) => {
		const secret = Totp.generateSecret();
		const user = await createTwoFactorUser('2fa-disable-badpass@example.com', secret);

		const res = await client
			.post('/settings/account')
			.redirects(0)
			.withCsrfToken()
			.loginAs(user)
			.accept('json')
			.form({ _action: 'disable_2fa', current_password: 'WrongPassword123!', code: Totp.code(secret) })
			.send();

		// An incorrect current password is a bad request (same status as the
		// password-change flow), not an authentication failure.
		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_CURRENT_PASSWORD');

		const fresh = await User.find(user.id);
		assert.isTrue(!!fresh!.twoFactorEnabled);
	});

	test('disable_2fa: a wrong second factor is rejected and 2FA stays enabled', async ({ client, assert }) => {
		const secret = Totp.generateSecret();
		const user = await createTwoFactorUser('2fa-disable-badcode@example.com', secret);

		const wrong = String((Number(Totp.code(secret)) + 1) % 1_000_000).padStart(6, '0');
		const res = await client
			.post('/settings/account')
			.redirects(0)
			.withCsrfToken()
			.loginAs(user)
			.accept('json')
			.form({ _action: 'disable_2fa', current_password: 'TestPassword123!', code: wrong })
			.send();

		res.assertStatus(401);

		const fresh = await User.find(user.id);
		assert.isTrue(!!fresh!.twoFactorEnabled);
	});
});
