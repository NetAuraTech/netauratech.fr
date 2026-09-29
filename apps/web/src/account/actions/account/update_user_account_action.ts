import { inject } from '@adonisjs/core';
import hash from '@adonisjs/core/services/hash';
import { EmailChangeMailService } from '#account/services/email_change_mail_service';
import InvalidCurrentPasswordException from '#auth/exceptions/invalid_current_password_exception';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import { withTransaction } from '#core/services/with_transaction';
import User from '#identity/models/user';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';

interface UpdateUserAccountPayload {
	user: User;
	currentPassword?: string;
	password?: string;
	email?: string;
}

/**
 * Update the authenticated user's account credentials.
 */
@inject()
export class UpdateUserAccountAction {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected emailChangeMailService: EmailChangeMailService,
	) {}

	/**
	 * Execute the account update.
	 *
	 * Verifies the account is email-verified, then applies the requested
	 * password change and/or pending email change, logging security events
	 * on rejection and a business event on success.
	 *
	 * @param payload - The target user plus the credential fields to change.
	 * @returns The updated {@link User}.
	 * @throws {UnverifiedAccountException} If the account's email is not verified.
	 * @throws {InvalidCurrentPasswordException} If the current password does not match.
	 */
	async execute(payload: UpdateUserAccountPayload): Promise<User> {
		if (!payload.user.isEmailVerified) {
			this.logService.logSecurity('account.update.denied_unverified_email', {
				userId: payload.user.id,
				userEmail: payload.user.email,
			});
			throw new UnverifiedAccountException(payload.user.email);
		}

		let updated = payload.user;

		if (payload.currentPassword && payload.password) {
			const isPasswordValid = await hash.verify(payload.user.password!, payload.currentPassword);
			if (!isPasswordValid) {
				this.logService.logSecurity('account.update.failed_invalid_password', {
					userId: payload.user.id,
					userEmail: payload.user.email,
				});
				throw new InvalidCurrentPasswordException();
			}
			updated = await withTransaction(async () =>
				this.userRepository.update(payload.user, { password: payload.password }),
			);
		}

		if (payload.email && payload.user.email !== payload.email) {
			updated = await withTransaction(async () => {
				const user = await this.userRepository.update(payload.user, { pendingEmail: payload.email });
				if (user) await this.emailChangeMailService.sendEmailChangeMails(user);
				return user;
			});
		}

		if (updated !== payload.user) {
			this.logService.logBusiness('settings.account.updated', {
				userId: payload.user.id,
				userEmail: payload.user.email,
			});
		}

		return updated;
	}
}
