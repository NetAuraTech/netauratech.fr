import { inject } from '@adonisjs/core';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';
import type User from '#identity/models/user';

interface GetInvitationPayload {
	token: FullToken;
}

/**
 * Retrieve the user associated with an invitation token for display.
 */
@inject()
export class GetInvitationAction {
	constructor(protected tokenService: TokenService) {}

	/**
	 * @param payload - The full invitation token string
	 * @returns The invited {@link User}.
	 * @throws {InvalidTokenException} When the token is invalid or expired.
	 * @throws {MaxAttemptsExceededException} When the token is locked.
	 */
	async execute(payload: GetInvitationPayload): Promise<User> {
		return this.tokenService.resolveUser(payload.token, TOKEN_TYPES.PENDING_INVITE);
	}
}
