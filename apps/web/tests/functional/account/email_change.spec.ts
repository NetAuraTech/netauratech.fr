import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { test } from '@japa/runner';
import { resetSharedState } from '#tests/helpers/shared_state';

/**
 * Functional seam for the email-change confirmation endpoint
 * (`POST /settings/account/email_change`) — the guest route that consumes an
 * emailed token and is therefore an account-takeover vector.
 *
 * The throttle is the property under test: 3 confirmations per 15 minutes
 * per IP (the same budget as the reset-password endpoint). Invalid tokens
 * are 400, but the limiter counts every presentation, so the 4th is a 429.
 */
test.group('Email change endpoint', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => limiter.clear());

	test('email change: the endpoint is throttled after exceeding the attempt limit', async ({ client, assert }) => {
		const statuses: number[] = [];
		for (let i = 0; i < 4; i++) {
			const res = await client
				.post('/settings/account/email_change')
				.redirects(0)
				.withCsrfToken()
				.accept('json')
				.form({ token: `change-throttle-${i}` })
				.send();
			statuses.push(res.status());
			if (i < 3) assert.equal(res.body().error.code, 'E_INVALID_TOKEN');
		}

		assert.deepEqual(statuses, [400, 400, 400, 429]);
	});
});
