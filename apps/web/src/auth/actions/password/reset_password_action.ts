import { inject } from '@adonisjs/core';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';
import { type ResetPasswordPayload } from '#auth/types/auth';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

/**
 * Reset a user password using a verified reset token.
 *
 * Delegates the full consuming choreography to the {@link TokenService} —
 * resolve the user, then inside one locked transaction update the password
 * and expire all outstanding reset tokens — so a concurrent double-use is
 * serialized: the second presentation sees the expired token and is rejected
 * (see /docs/agents/toctou-protection.md).
 */
@inject()
export class ResetPasswordAction {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected tokenService: TokenService,
	) {}

	/**
	 * Execute password reset.
	 *
	 * @param payload - The full reset token and the new password.
	 * @returns The updated {@link User} with the new password.
	 * @throws {InvalidTokenException} When the token is invalid or already used.
	 * @throws {MaxAttemptsExceededException} When the token is locked.
	 */
	async execute(payload: ResetPasswordPayload): Promise<User> {
		const user = await this.tokenService.consume(payload.token, TOKEN_TYPES.PASSWORD_RESET, async (u) => {
			return await this.userRepository.updatePassword(u, payload.password);
		});

		this.logService.logAuth('password.reset.success', {
			userId: user.id,
			userEmail: user.email,
			token: Token.mask(payload.token),
		});

		return user;
	}
}
