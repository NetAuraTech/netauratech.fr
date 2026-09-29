import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { SendPasswordResetMailJob } from '#auth/jobs/send_password_reset_mail_job';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';
import type { FullToken } from '#auth/enums/token_type';
import type { JobContext } from '@adonisjs/queue/types';

const context: JobContext = {
	jobId: 'test-job-id',
	name: 'SendPasswordResetMailJob',
	attempt: 1,
	queue: 'auth',
	priority: 5,
	acquiredAt: new Date(),
	stalledCount: 0,
};

/**
 * Unit seam for {@link SendPasswordResetMailJob}: the worker-side half of the
 * password-reset flow. `execute()` sends the mail for a pre-issued token
 * through the auth-domain {@link TokenMailService}; `failed()` records a
 * security Log Entry once the retries are exhausted.
 */
test.group('SendPasswordResetMailJob', () => {
	test('execute() sends the password-reset mail for the pre-issued token', async ({ assert }) => {
		const mail = swapMailClient();
		const user = await createVerifiedUser({ email: 'job_mail@example.com', password: 'TestPassword123!' });

		const job = await app.container.make(SendPasswordResetMailJob);
		const token = 'selector-here.validator-here' as FullToken;
		job.$hydrate({ userId: user.id, userEmail: user.email, token }, context);

		await job.execute();
		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, user.email);
		assert.equal(mail.sent[0].template, 'emails/auth_email');
	});

	test('failed() records a security Log Entry for the recipient', async ({ assert }) => {
		const job = await app.container.make(SendPasswordResetMailJob);

		const calls: { message: string; context: Record<string, unknown> }[] = [];
		(job as unknown as { logService: unknown }).logService = {
			logSecurity: (message: string, logContext: Record<string, unknown>) => {
				calls.push({ message, context: logContext });
			},
		};

		const token = 'selector-here.validator-here' as FullToken;
		job.$hydrate({ userId: 42, userEmail: 'failed@example.com', token }, context);

		await job.failed(new Error('smtp connection refused'));

		assert.equal(calls.length, 1);
		assert.equal(calls[0].message, 'password.reset.mail_failed');
		assert.equal(calls[0].context.userId, 42);
		assert.equal(calls[0].context.userEmail, 'failed@example.com');
	});
});
