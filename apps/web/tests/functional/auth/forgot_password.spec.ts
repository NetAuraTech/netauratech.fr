import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import { resetSharedState } from '#tests/helpers/shared_state';
import { fieldError } from '#tests/helpers/validation';

/**
 * Functional seam for the forgot-password endpoint (`POST /forgot-password`).
 *
 * Replaces the Playwright browser E2E: we assert the HTTP contract a client
 * observes — the 302 to the login page for BOTH a known and an unknown email
 * (no user enumeration), the 422 field error on an invalid email format, and
 * the 429 after the throttle — instead of driving a real browser. The reset
 * mail (sent synchronously through the mail client) is recorded in-memory so
 * the suite never touches a transport.
 */
test.group('Forgot password endpoint', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.setup(() => {
		swapMailClient();
		return () => restoreMailClient();
	});
	group.each.teardown(() => limiter.clear());

	test('forgot: a known email redirects to the login page', async ({ client }) => {
		await createVerifiedUser({ email: 'forgot@example.com', password: 'TestPassword123!' });

		const res = await client
			.post('/forgot-password')
			.redirects(0)
			.withCsrfToken()
			.form({ email: 'forgot@example.com' })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/login');
	});

	test('forgot: an unknown email redirects to the login page (no enumeration)', async ({ client }) => {
		const res = await client
			.post('/forgot-password')
			.redirects(0)
			.withCsrfToken()
			.form({ email: 'nonexistent@example.com' })
			.send();

		res.assertStatus(302);
		res.assertHeader('location', '/login');
	});

	test('forgot: an invalid email format returns a 422 with an email field error', async ({ client, assert }) => {
		const res = await client
			.post('/forgot-password')
			.redirects(0)
			.withCsrfToken()
			.accept('json')
			.form({ email: 'invalid-email' })
			.send();

		res.assertStatus(422);
		assert.exists(fieldError(res, 'email'));
	});

	test('forgot: the endpoint is throttled after exceeding the attempt limit', async ({ client, assert }) => {
		// The route is limited to 3 attempts per hour: the first three are
		// processed (302) and the fourth is 429.
		const statuses: number[] = [];
		for (let i = 0; i < 4; i++) {
			const res = await client
				.post('/forgot-password')
				.redirects(0)
				.withCsrfToken()
				.accept('json')
				.form({ email: `forgot-throttle-${i}-${Date.now()}@example.com` })
				.send();
			statuses.push(res.status());
		}

		assert.deepEqual(statuses, [302, 302, 302, 429]);
	});
});
