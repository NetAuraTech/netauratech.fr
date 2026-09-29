import { inject } from '@adonisjs/core';
import { SendPasswordResetMailJob } from '#auth/jobs/send_password_reset_mail_job';
import { TokenMailService } from '#auth/services/token_mail_service';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

interface SendPasswordResetPayload {
	user: User;
}

/**
 * Trigger sending of a password reset email for a user.
 *
 * The token is issued synchronously (a valid reset link exists even if the
 * worker lags), then the mail itself is enqueued as a
 * {@link SendPasswordResetMailJob} and sent by the queue worker after the
 * response has been returned.
 */
@inject()
export class SendPasswordResetAction {
	constructor(
		protected logService: LogService,
		protected tokenMailService: TokenMailService,
	) {}

	/**
	 * @param payload - The User to send the reset email to.
	 * @returns Nothing; issues the token and enqueues the mail job.
	 */
	async execute(payload: SendPasswordResetPayload): Promise<void> {
		const token = await this.tokenMailService.issuePasswordResetToken(payload.user);

		await SendPasswordResetMailJob.dispatch({
			userId: payload.user.id,
			userEmail: payload.user.email,
			token,
		});

		this.logService.logAuth('password.reset.requested', {
			userId: payload.user.id,
			userEmail: payload.user.email,
		});
	}
}
