import { inject } from '@adonisjs/core';
import { DateTime } from 'luxon';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';
import User from '#identity/models/user';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';

interface AcceptInvitationPayload {
	token: FullToken;
	password: string;
}

/**
 * Accept an invitation by setting a password and verifying email via a token.
 *
 * Delegates the full consuming choreography to the {@link TokenService} —
 * resolve the invited user, then inside one locked transaction set the
 * password, verify the email, and expire the outstanding invitation tokens —
 * so a concurrent double-use is serialized: the second presentation sees the
 * expired token and is rejected (see /docs/agents/toctou-protection.md).
 */
@inject()
export class AcceptInvitationAction {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected tokenService: TokenService,
	) {}

	/**
	 * @param payload - The invitation token and desired password
	 * @returns The updated User with password set and email verified
	 * @throws {InvalidTokenException} When the token is invalid or already used.
	 * @throws {MaxAttemptsExceededException} When the token is locked.
	 */
	async execute(payload: AcceptInvitationPayload): Promise<User> {
		const updated = await this.tokenService.consume(payload.token, TOKEN_TYPES.PENDING_INVITE, async (user) => {
			return await this.userRepository.update(user, {
				password: payload.password,
				emailVerifiedAt: DateTime.now(),
			});
		});

		this.logService.logAuth('invitation.accepted', {
			userId: updated.id,
			userEmail: updated.email,
		});

		return updated;
	}
}
