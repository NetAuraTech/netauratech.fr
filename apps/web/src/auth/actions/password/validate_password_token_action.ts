import { inject } from '@adonisjs/core';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import { TokenService } from '#auth/services/token_service';

interface ValidatePasswordTokenPayload {
	token: FullToken;
}

/**
 * Validate a password reset token for frontend display.
 *
 * The token is fully verified through the {@link TokenService}, so this
 * presentation consumes exactly one attempt increment; an invalid or locked
 * token throws before the page is rendered.
 */
@inject()
export class ValidatePasswordTokenAction {
	constructor(protected tokenService: TokenService) {}

	/**
	 * @param payload - The full token string to validate.
	 * @returns Nothing; resolves when the token is valid, throws otherwise.
	 * @throws {InvalidTokenException} When the token is invalid or expired.
	 * @throws {MaxAttemptsExceededException} When the token is locked.
	 */
	async execute(payload: ValidatePasswordTokenPayload): Promise<void> {
		await this.tokenService.verify(payload.token, TOKEN_TYPES.PASSWORD_RESET);
	}
}
