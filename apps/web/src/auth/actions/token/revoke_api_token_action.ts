import { inject } from '@adonisjs/core';
import { ApiTokenService } from '#auth/services/api_token_service';
import type User from '#identity/models/user';

interface RevokeApiTokenPayload {
	user: User;
	/** Database identifier of the token to revoke (its `id` column). */
	tokenIdentifier: string | number | BigInt;
}

/**
 * Revokes an opaque access token, typically the one presented on the
 * current request (`user.currentAccessToken.identifier`).
 *
 * Delegates to the auth-domain {@link ApiTokenService}, which owns the token
 * lifecycle.
 */
@inject()
export class RevokeApiTokenAction {
	constructor(protected apiTokenService: ApiTokenService) {}

	/**
	 * @param payload - The token owner and the identifier of the token to delete.
	 * @returns Nothing — revoking an already-gone token is not an error.
	 */
	async execute(payload: RevokeApiTokenPayload): Promise<void> {
		return this.apiTokenService.revoke(payload.user, payload.tokenIdentifier);
	}
}
