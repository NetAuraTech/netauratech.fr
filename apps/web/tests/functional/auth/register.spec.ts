import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import User from '#identity/models/user';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import { resetSharedState } from '#tests/helpers/shared_state';
import { fieldError } from '#tests/helpers/validation';

/**
 * Functional seam for public registration (`POST /register`).
 *
 * Replaces the Playwright browser E2E: we assert the HTTP contract a client
 * observes — the 302 to the profile page on success, the created-but-unverified
 * user row, the 422 coded field errors (duplicate email, weak password, mismatched
 * confirmation, missing required fields) plus the 429 after the registration
 * throttle — rather than driving a real browser. VineJS 422 bodies are a flat
 * array of `{ field, message, rule }` entries. The verification mail (sent
 * synchronously through the mail client) is recorded in-memory so the suite
 * never touches a real transport.
 */
test.group('Registration endpoint', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.setup(() => {
		swapMailClient();
		return () => restoreMailClient();
	});
	group.each.teardown(() => limiter.clear());

	test('register: valid data redirects to the profile and creates an unverified user', async ({ client, assert }) => {
		const email = 'register-success@example.com';

		const res = await client
			.post('/register')
			.redirects(0)
			.withCsrfToken()
			.form({ email, password: 'NewPassword123!', password_confirmation: 'NewPassword123!' })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/settings/profile');

		const user = await User.findBy('email', email);
		assert.exists(user);
		assert.isNotNull(user!.password);
		assert.isNull(user!.emailVerifiedAt);
	});

	test('register: a duplicate email returns a 422 with an email field error', async ({ client, assert }) => {
		await createVerifiedUser({
			email: 'duplicate@example.com',
			password: 'TestPassword123!',
		});

		const res = await client
			.post('/register')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({
				email: 'duplicate@example.com',
				password: 'NewPassword123!',
				password_confirmation: 'NewPassword123!',
			})
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'email'));
	});

	test('register: a weak password returns a 422 with a password field error', async ({ client, assert }) => {
		const res = await client
			.post('/register')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({ email: 'weak@example.com', password: 'weak', password_confirmation: 'weak' })
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'password'));
	});

	test('register: a confirmation mismatch returns a 422 with a password_confirmation field error', async ({
		client,
		assert,
	}) => {
		const res = await client
			.post('/register')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({
				email: 'mismatch@example.com',
				password: 'NewPassword123!',
				password_confirmation: 'Different123!',
			})
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'password_confirmation'));
	});

	test('register: missing required fields return a 422 with email and password field errors', async ({
		client,
		assert,
	}) => {
		const res = await client.post('/register').redirects(0).withCsrfToken().accept('json').send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'email'));
		assert.exists(fieldError(res, 'password'));
	});

	test('register: the endpoint is throttled after exceeding the attempt limit', async ({ client, assert }) => {
		// The route is limited to 3 attempts per hour: the first three are
		// processed (302, a fresh valid payload each) and the fourth is 429.
		const statuses: number[] = [];
		for (let i = 0; i < 4; i++) {
			const res = await client
				.post('/register')
				.redirects(0)
				.withCsrfToken()
				.accept('json')
				.form({
					email: `reg-throttle-${i}-${Date.now()}@example.com`,
					password: 'NewPassword123!',
					password_confirmation: 'NewPassword123!',
				})
				.send();
			statuses.push(res.status());
		}

		assert.deepEqual(statuses, [302, 302, 302, 429]);
	});
});
