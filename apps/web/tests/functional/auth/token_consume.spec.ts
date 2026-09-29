import hash from '@adonisjs/core/services/hash';
import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import User from '#identity/models/user';
import { resetSharedState } from '#tests/helpers/shared_state';
import { createSplitToken } from '#tests/helpers/tokens';

/**
 * Functional seam for the token consume choreography over HTTP: two
 * concurrent double presentations of the same token must result in exactly
 * one application. The consuming transaction locks the token row as its first
 * query, so the second presentation observes the expired token and is
 * rejected (see /docs/agents/toctou-protection.md).
 *
 * Covers the two flows that never took the row lock before the consume
 * choreography existed: email-change confirmation and invitation acceptance.
 */
test.group('Token consume: concurrent double presentation', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('email change: two concurrent confirmations apply exactly once', async ({ client, assert }) => {
		const user = await User.create({
			email: 'ec_race_old@example.com',
			username: 'ec_race',
			password: 'password123',
			pendingEmail: 'ec_race_new@example.com',
		});
		const token = await createSplitToken(user, TOKEN_TYPES.EMAIL_CHANGE);

		const submit = () =>
			client.post('/settings/account/email_change').redirects(0).withCsrfToken().accept('json').form({ token }).send();

		const results = await Promise.allSettled([submit(), submit()]);
		const statuses = results.map((r) => (r.status === 'fulfilled' ? r.value.status() : -1)).sort((a, b) => a - b);
		assert.deepEqual(statuses, [302, 400]);

		const rejected = results.find(
			(r) => r.status === 'fulfilled' && r.value.status() === 400,
		) as PromiseFulfilledResult<any>;
		assert.equal(rejected.value.body().error.code, 'E_INVALID_TOKEN');

		// The email change was applied exactly once.
		await user.refresh();
		assert.equal(user.email, 'ec_race_new@example.com');
		assert.isNull(user.pendingEmail);
		assert.isNotNull(user.emailVerifiedAt);
	});

	test('invitation: two concurrent acceptances apply exactly once', async ({ client, assert }) => {
		const user = await User.create({
			email: 'invite_race@example.com',
			username: 'invite_race',
			password: null,
		});
		const token = await createSplitToken(user, TOKEN_TYPES.PENDING_INVITE);

		const submit = () =>
			client
				.post('/accept-invitation')
				.redirects(0)
				.withCsrfToken()
				.accept('json')
				.form({
					token,
					email: user.email,
					username: user.username,
					password: 'NewPassword123!',
					password_confirmation: 'NewPassword123!',
				})
				.send();

		const results = await Promise.allSettled([submit(), submit()]);
		const statuses = results.map((r) => (r.status === 'fulfilled' ? r.value.status() : -1)).sort((a, b) => a - b);

		// The acceptance endpoint verifies the token twice per presentation
		// (pre-existing attempt accounting), so the losing presentation is
		// rejected either because the token was consumed (400) or because the
		// attempt cap was reached (429) — either way it did not act.
		assert.equal(statuses[0], 302);
		assert.isTrue(statuses[1] === 400 || statuses[1] === 429, `unexpected losing status ${statuses[1]}`);

		// The invitation was accepted exactly once.
		await user.refresh();
		assert.isNotNull(user.emailVerifiedAt);
		assert.isTrue(await hash.verify(user.password!, 'NewPassword123!'));
	});
});
