import { inject } from '@adonisjs/core';
import ProviderAlreadyLinkedException from '#auth/exceptions/provider_already_linked_exception';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import { type OAuthProvider } from '#auth/types/auth';
import { withTransaction } from '#core/services/with_transaction';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

interface LinkSocialProviderPayload {
	user: User;
	allyUser: any;
	provider: OAuthProvider;
}

/**
 * Link an OAuth provider account to an existing user after password confirmation.
 */
@inject()
export class LinkSocialProviderAction {
	constructor(
		protected logService: LogService,
		private userRepository: UserRepository,
	) {}

	/**
	 * Execute social provider linking.
	 *
	 * @param payload - Authenticated user, ally OAuth user, and provider to link.
	 * @returns The updated {@link User} with the linked provider ID.
	 * @throws {UnverifiedAccountException} If the user email is not verified.
	 * @throws {ProviderAlreadyLinkedException} If the provider account is already linked to another user.
	 */
	async execute(payload: LinkSocialProviderPayload): Promise<User> {
		if (!payload.user.emailVerifiedAt) {
			this.logService.logSecurity('Attempt to link provider with unverified email', {
				userId: payload.user.id,
				userEmail: payload.user.email,
			});
			throw new UnverifiedAccountException(payload.user.email);
		}

		const conflict = await this.userRepository.findByProviderIdExcluding(
			payload.provider,
			payload.allyUser.id,
			payload.user.id,
		);

		if (conflict) {
			this.logService.logSecurity('Attempt to link provider already linked to another account', {
				userId: payload.user.id,
				conflictUserId: conflict.id,
				provider: payload.provider,
			});
			throw new ProviderAlreadyLinkedException(payload.provider);
		}

		await withTransaction(async () => {
			await this.userRepository.linkProvider(payload.user, payload.provider, payload.allyUser.id);
		});

		this.logService.logAuth('social.provider_linked', {
			userId: payload.user.id,
			userEmail: payload.user.email,
			provider: payload.provider,
		});

		return payload.user;
	}
}
