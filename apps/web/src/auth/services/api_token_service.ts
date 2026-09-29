import { inject } from '@adonisjs/core';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

export interface ApiTokenResult {
	/** Plain-text token secret — only available once, at creation time. */
	token: string;
	expiresAt: Date | null;
}

/**
 * Issues and revokes opaque access tokens authenticating users on the `api` guard.
 *
 * Owns the token lifecycle shared by the credential login, the social API
 * login, and the logout flows. The token lifetime defaults to the provider
 * configuration on the {@link User} model, driven by the `AUTH_API_TOKEN_EXPIRY`
 * env variable.
 */
@inject()
export class ApiTokenService {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
	) {}

	/**
	 * Issues an opaque access token authenticating a user on the `api` guard.
	 *
	 * @param user - The user the token authenticates.
	 * @returns The token secret (available only once) and its expiry.
	 *
	 * @example
	 * const { token, expiresAt } = await apiTokenService.issue(user)
	 */
	async issue(user: User): Promise<ApiTokenResult> {
		const token = await this.userRepository.createAccessToken(user);

		this.logService.logAuth('api_token.issued', {
			userId: user.id,
			userEmail: user.email,
		});

		return {
			token: token.value!.release(),
			expiresAt: token.expiresAt,
		};
	}

	/**
	 * Revokes an opaque access token, typically the one presented on the
	 * current request (`user.currentAccessToken.identifier`).
	 *
	 * @param user - The token owner.
	 * @param tokenIdentifier - Database identifier of the token to revoke (its `id` column).
	 * @returns Nothing — revoking an already-gone token is not an error.
	 */
	async revoke(user: User, tokenIdentifier: string | number | BigInt): Promise<void> {
		await this.userRepository.deleteAccessToken(user, tokenIdentifier);

		this.logService.logAuth('api_token.revoked', {
			userId: user.id,
			userEmail: user.email,
		});
	}
}
