import { AllyUserContract } from '@adonisjs/ally/types';
import { inject } from '@adonisjs/core';
import { ApiTokenService, type ApiTokenResult } from '#auth/services/api_token_service';
import { SocialUserService } from '#auth/services/social_user_service';
import { type OAuthProvider } from '#auth/types/auth';
import type User from '#identity/models/user';

interface SocialApiLoginPayload {
	provider: OAuthProvider;
	allyUser: AllyUserContract<any>;
}

export interface SocialApiLoginResult extends ApiTokenResult {
	user: User;
}

/**
 * Resolve a provider user and issue an API token for it, without creating a
 * session (spec #6 "social API mode").
 *
 * Composes the auth-domain services that own each step — social user
 * resolution ({@link SocialUserService}) and token issuance
 * ({@link ApiTokenService}) — for the token-authenticated world.
 */
@inject()
export class SocialApiLoginAction {
	constructor(
		protected socialUserService: SocialUserService,
		protected apiTokenService: ApiTokenService,
	) {}

	/**
	 * @param payload - The provider and the authenticated provider user.
	 * @returns The resolved {@link User} and its issued API token.
	 */
	async execute(payload: SocialApiLoginPayload): Promise<SocialApiLoginResult> {
		const user = await this.socialUserService.findOrCreate(payload.allyUser, payload.provider);
		const { token, expiresAt } = await this.apiTokenService.issue(user);
		return { user, token, expiresAt };
	}
}
