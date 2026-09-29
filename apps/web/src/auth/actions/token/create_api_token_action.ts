import { inject } from '@adonisjs/core';
import { ApiTokenService, type ApiTokenResult } from '#auth/services/api_token_service';
import type User from '#identity/models/user';

interface CreateApiTokenPayload {
	user: User;
}

/**
 * Issues an opaque access token authenticating a user on the `api` guard.
 *
 * Delegates to the auth-domain {@link ApiTokenService}, which owns the token
 * lifecycle. The token lifetime defaults to the provider configuration on the
 * {@link User} model, driven by the `AUTH_API_TOKEN_EXPIRY` env variable.
 */
@inject()
export class CreateApiTokenAction {
	constructor(protected apiTokenService: ApiTokenService) {}

	/**
	 * @param payload - The user the token authenticates.
	 * @returns The token secret (available only once) and its expiry.
	 */
	async execute(payload: CreateApiTokenPayload): Promise<ApiTokenResult> {
		return this.apiTokenService.issue(payload.user);
	}
}
