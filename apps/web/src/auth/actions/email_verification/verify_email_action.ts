import { inject } from '@adonisjs/core';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

interface VerifyEmailPayload {
	token: FullToken;
}

/**
 * Verify a user email address using a token from the verification link.
 *
 * Delegates the full consuming choreography to the {@link TokenService} —
 * resolve the user, then inside one locked transaction mark the email as
 * verified and expire all outstanding verification tokens — so a concurrent
 * double-use is serialized: the second presentation sees the expired token
 * and is rejected (see /docs/agents/toctou-protection.md).
 */
@inject()
export class VerifyEmailAction {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected tokenService: TokenService,
	) {}

	/**
	 * Execute email verification.
	 *
	 * @param payload - The full token string from the verification email.
	 * @returns The verified {@link User}.
	 * @throws {InvalidTokenException} When the token is invalid or already used.
	 * @throws {MaxAttemptsExceededException} When the token is locked.
	 */
	async execute(payload: VerifyEmailPayload): Promise<User> {
		const user = await this.tokenService.consume(payload.token, TOKEN_TYPES.EMAIL_VERIFICATION, async (u) => {
			return await this.userRepository.markEmailAsVerified(u);
		});

		this.logService.logAuth('email_verification.confirmed', {
			userId: user.id,
			userEmail: user.email,
		});

		return user;
	}
}
