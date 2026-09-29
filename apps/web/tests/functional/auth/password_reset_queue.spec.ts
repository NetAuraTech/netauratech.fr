import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { QueueManager } from '@adonisjs/queue';
import { test } from '@japa/runner';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import { SendPasswordResetMailJob } from '#auth/jobs/send_password_reset_mail_job';
import Token from '#auth/models/token';
import env from '#start/env';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import { resetSharedState } from '#tests/helpers/shared_state';

/**
 * Functional seam for the queued password-reset mail (issue #286).
 *
 * The forgot-password endpoint issues the token synchronously and enqueues
 * {@link SendPasswordResetMailJob}; the mail is sent by the queue worker, not
 * inside the request. Two drivers are exercised:
 *
 * - the fake driver (`QueueManager.fake()`) proves the request only enqueues:
 *   the job is pushed with the pre-issued token and no mail leaves the
 *   process;
 * - the sync driver (`.env.test` runs `QUEUE_DRIVER=sync`) covers the full
 *   dispatch → consume → send path in-memory: the job executes inline and the
 *   recording mail client receives the mail built from the issued token.
 */
test.group('Password reset queue', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);
	group.each.setup(() => limiter.clear());
	group.each.teardown(() => {
		QueueManager.restore();
		return limiter.clear();
	});

	test('requesting a reset enqueues the mail job without sending mail (fake driver)', async ({ client, assert }) => {
		const fake = QueueManager.fake();
		const mail = swapMailClient();
		const user = await createVerifiedUser({ email: 'queue_reset@example.com', password: 'TestPassword123!' });

		const res = await client.post('/forgot-password').redirects(0).withCsrfToken().form({ email: user.email }).send();

		res.assertStatus(302);
		restoreMailClient();

		fake.assertPushed(SendPasswordResetMailJob.name, {
			queue: 'auth',
			payload: (payload: { userId?: number; userEmail?: string; token?: string }) =>
				payload.userId === user.id &&
				payload.userEmail === user.email &&
				typeof payload.token === 'string' &&
				payload.token.split('.').length === 2,
		});

		// The token was created synchronously, in the request.
		const token = await Token.query().where('type', TOKEN_TYPES.PASSWORD_RESET).where('user_id', user.id).first();
		assert.exists(token);

		// ...and the mail has NOT been sent yet: it waits for the worker.
		assert.equal(mail.sent.length, 0);
	});

	test('the worker consumes the job and sends the mail built from the issued token (sync driver)', async ({
		client,
		assert,
	}) => {
		const mail = swapMailClient();
		const user = await createVerifiedUser({ email: 'queue_sync@example.com', password: 'TestPassword123!' });

		const res = await client.post('/forgot-password').redirects(0).withCsrfToken().form({ email: user.email }).send();

		res.assertStatus(302);
		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, user.email);
		assert.equal(mail.sent[0].template, 'emails/auth_email');

		const token = await Token.query().where('type', TOKEN_TYPES.PASSWORD_RESET).where('user_id', user.id).first();
		assert.exists(token);

		// The reset link carries the plain-text selector of the issued token.
		const resetLink = String(mail.sent[0].data?.reset_link ?? '');
		assert.equal(resetLink.startsWith(`${env.get('APP_URL')}/reset-password/`), true);
		assert.equal(resetLink.split('/').pop()!.startsWith(`${token!.selector}.`), true);
	});
});
