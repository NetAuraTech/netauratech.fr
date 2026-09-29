import { inject } from '@adonisjs/core';
import { DateTime } from 'luxon';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES, FullToken } from '#auth/enums/token_type';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import { TokenService } from '#auth/services/token_service';
import EmailAlreadyExistsException from '#core/exceptions/email_already_exists_exception';
import User from '#identity/models/user';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';

interface ConfirmEmailChangePayload {
	token: FullToken;
}

/**
 * Confirm a pending email address change using a verified token.
 *
 * Delegates the full consuming choreography to the {@link TokenService} —
 * resolve the user, then inside one locked transaction assert the user still
 * carries the pending email, that the pending email is not already claimed
 * by another account, update the email, and expire all outstanding
 * email-change tokens — so a concurrent double-use is serialized: the second
 * presentation sees the expired token and is rejected
 * (see /docs/agents/toctou-protection.md).
 */
@inject()
export class ConfirmEmailChangeAction {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected tokenService: TokenService,
	) {}

	/**
	 * Execute email change confirmation.
	 *
	 * @param payload - The full token from the confirmation link.
	 * @returns The updated {@link User} with the new email applied.
	 * @throws {InvalidTokenException} If the token is invalid, expired, or the
	 *   user no longer has a pending email.
	 * @throws {MaxAttemptsExceededException} If the token is locked.
	 * @throws {EmailAlreadyExistsException} If the pending email is already claimed.
	 */
	async execute(payload: ConfirmEmailChangePayload): Promise<User> {
		const updated = await this.tokenService.consume(payload.token, TOKEN_TYPES.EMAIL_CHANGE, async (user) => {
			if (!user.pendingEmail) {
				this.logService.logAuth('core.token.invalid', {
					userId: user.id,
					userEmail: user.email,
					token: Token.mask(payload.token),
				});
				throw new InvalidTokenException();
			}

			const isEmailTaken = await this.userRepository.emailExists(user.pendingEmail);

			if (isEmailTaken) {
				this.logService.logSecurity('email_change.failed.already_in_use', {
					userId: user.id,
					userEmail: user.email,
					pendingEmail: user.pendingEmail,
				});
				throw new EmailAlreadyExistsException(user.pendingEmail);
			}

			return await this.userRepository.update(user, {
				email: user.pendingEmail,
				pendingEmail: null,
				emailVerifiedAt: DateTime.now(),
			});
		});

		this.logService.logAuth('email_change.confirmed', {
			userId: updated.id,
			userEmail: updated.email,
		});

		return updated;
	}
}
