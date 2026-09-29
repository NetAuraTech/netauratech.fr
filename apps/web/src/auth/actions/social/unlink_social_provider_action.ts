import { inject } from '@adonisjs/core';
import { type OAuthProvider } from '#auth/types/auth';
import { withTransaction } from '#core/services/with_transaction';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

interface UnlinkSocialProviderPayload {
	user: User;
	provider: OAuthProvider;
}

/**
 * Remove an OAuth provider link from a user account.
 */
@inject()
export class UnlinkSocialProviderAction {
	constructor(
		protected logService: LogService,
		private userRepository: UserRepository,
	) {}

	/**
	 * Execute social provider unlinking.
	 *
	 * @param payload - The authenticated user and the provider to unlink.
	 * @returns The updated {@link User}.
	 */
	async execute(payload: UnlinkSocialProviderPayload): Promise<User> {
		await withTransaction(async () => {
			await this.userRepository.unlinkProvider(payload.user, payload.provider);
		});

		this.logService.logAuth('social.provider_unlinked', {
			userId: payload.user.id,
			userEmail: payload.user.email,
			provider: payload.provider,
		});

		return payload.user;
	}
}
