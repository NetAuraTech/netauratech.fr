import { AllyUserContract } from '@adonisjs/ally/types';
import { inject } from '@adonisjs/core';
import { SocialUserService } from '#auth/services/social_user_service';
import { type OAuthProvider } from '#auth/types/auth';
import type User from '#identity/models/user';

interface FindOrCreateSocialUserPayload {
	allyUser: AllyUserContract<any>;
	provider: OAuthProvider;
}

/**
 * Find an existing user by OAuth provider or create a new social account.
 *
 * Delegates to the auth-domain {@link SocialUserService}, which owns the
 * find-or-create flow (existing provider link, email-based account linking,
 * fresh registration).
 */
@inject()
export class FindOrCreateSocialUserAction {
	constructor(protected socialUserService: SocialUserService) {}

	/**
	 * Execute social user lookup or creation.
	 *
	 * @param payload - The OAuth provider and ally user data from the authentication response.
	 * @returns The existing or newly created {@link User}.
	 * @throws {UnverifiedAccountException} When the email matches an unverified account.
	 *
	 * @example
	 * const user = await findOrCreateSocialUserAction.execute({ allyUser, provider: 'github' })
	 */
	async execute(payload: FindOrCreateSocialUserPayload): Promise<User> {
		return this.socialUserService.findOrCreate(payload.allyUser, payload.provider);
	}
}
