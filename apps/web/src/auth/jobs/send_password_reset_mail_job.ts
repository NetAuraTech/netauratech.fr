import { inject } from '@adonisjs/core';
import { Job } from '@adonisjs/queue';
import { TokenMailService } from '#auth/services/token_mail_service';
import User from '#identity/models/user';
import { LogService } from '#log/services/log_service';
import type { FullToken } from '#auth/enums/token_type';
import type { JobOptions } from '@adonisjs/queue/types';

/**
 * Payload of the {@link SendPasswordResetMailJob}.
 *
 * Carries everything the worker needs without re-deriving it: the recipient
 * (reloaded by id, the user may have been deleted in the meantime) and the
 * token issued synchronously by the action before dispatch. The email is
 * duplicated in the payload so the failure log keeps its context when the
 * user row is gone.
 */
interface SendPasswordResetMailPayload {
	userId: number;
	userEmail: string;
	token: FullToken;
}

/**
 * Sends the password-reset mail outside the HTTP request.
 *
 * The action issues the token synchronously (so the reset link is valid even
 * if the worker lags) and dispatches this job; the worker resolves the user
 * and sends the mail through the auth-domain {@link TokenMailService}.
 *
 * Failures follow the global retry policy (see `config/queue.ts`); once the
 * retries are exhausted, {@link failed} records a security Log Entry.
 */
@inject()
export class SendPasswordResetMailJob extends Job<SendPasswordResetMailPayload> {
	static options: JobOptions = {
		queue: 'auth',
	};

	constructor(
		protected tokenMailService: TokenMailService,
		protected logService: LogService,
	) {
		super();
	}

	/**
	 * Resolves the recipient and sends the password-reset mail for the
	 * pre-issued token.
	 */
	async execute(): Promise<void> {
		const user = await User.findOrFail(this.payload.userId);
		await this.tokenMailService.sendPasswordResetMail(user, this.payload.token);
	}

	/**
	 * Records a security Log Entry once the job has permanently failed after
	 * all configured retries.
	 *
	 * @param error - The error thrown by the last attempt.
	 */
	async failed(error: Error): Promise<void> {
		this.logService.logSecurity('password.reset.mail_failed', {
			userId: this.payload.userId,
			userEmail: this.payload.userEmail,
			error: error.message,
		});
	}
}

export default SendPasswordResetMailJob;
