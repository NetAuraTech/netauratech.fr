import { inject } from '@adonisjs/core';
import { TokenMailService } from '#auth/services/token_mail_service';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

interface SendEmailVerificationPayload {
	user: User;
}

/**
 * Trigger sending of an email verification link for a user.
 *
 * Delegates directly to the auth-domain {@link TokenMailService} — no event
 * bus is involved, so the flow is traceable in one call.
 */
@inject()
export class SendEmailVerificationAction {
	constructor(
		protected logService: LogService,
		protected tokenMailService: TokenMailService,
	) {}

	/**
	 * @param payload - The User to send the verification email to.
	 * @returns Nothing; issues the token and sends the mail synchronously.
	 */
	async execute(payload: SendEmailVerificationPayload): Promise<void> {
		await this.tokenMailService.sendVerificationEmail(payload.user);

		this.logService.logAuth('email_verification.sent', {
			userId: payload.user.id,
			userEmail: payload.user.email,
		});
	}
}
