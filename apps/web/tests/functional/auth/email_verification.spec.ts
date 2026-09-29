import testUtils from '@adonisjs/core/services/test_utils';
import { test } from '@japa/runner';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import User from '#identity/models/user';
import { resetSharedState } from '#tests/helpers/shared_state';
import { createSplitToken } from '#tests/helpers/tokens';

/**
 * Functional seam for email verification (`GET /verify/:token`).
 *
 * Replaces the Playwright browser E2E: we assert the HTTP contract a client
 * observes — the 302 to the profile page for a live token (and the verified
 * user row), and the coded 400 for an invalid or expired token — instead of
 * driving a real browser.
 */
test.group('Email verification endpoint', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);

	test('verify: a live token verifies the email and redirects to the profile', async ({ client, assert }) => {
		const user = await User.create({
			email: 'verify-success@example.com',
			username: 'verify-success',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.EMAIL_VERIFICATION);

		const res = await client.get(`/verify/${token}`).redirects(0);

		res.assertStatus(302);
		res.assertHeader('location', '/settings/profile');

		await user.refresh();
		assert.isNotNull(user.emailVerifiedAt);
	});

	test('verify: an invalid token returns a coded 400', async ({ client, assert }) => {
		const res = await client.get('/verify/invalid-token').redirects(0).accept('json');

		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
	});

	test('verify: an expired token returns a coded 400', async ({ client, assert }) => {
		const user = await User.create({
			email: 'verify-expired@example.com',
			username: 'verify-expired',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.EMAIL_VERIFICATION, { hours: -1 });

		const res = await client.get(`/verify/${token}`).redirects(0).accept('json');

		res.assertStatus(400);
		assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
	});
});
