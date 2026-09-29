import { AllyUserContract } from '@adonisjs/ally/types';
import { inject } from '@adonisjs/core';
import { DateTime } from 'luxon';
import { PreferencesRepository } from '#account/repositories/preferences_repository';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import { type OAuthProvider } from '#auth/types/auth';
import { withTransaction } from '#core/services/with_transaction';
import { generateUniqueUsername } from '#identity/domain/user';
import { RoleRepository } from '#identity/repositories/role_repository';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

/**
 * Resolves an OAuth provider identity to a user account.
 *
 * Owns the find-or-create flow shared by the session login and the social
 * API-login entry points: existing provider link, email-based account
 * linking, and fresh registration. All operations run atomically within a
 * transaction.
 */
@inject()
export class SocialUserService {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected preferencesRepository: PreferencesRepository,
		protected roleRepository: RoleRepository,
	) {}

	/**
	 * Find an existing user by OAuth provider or create a new social account.
	 *
	 * @param allyUser - The ally user data from the authentication response.
	 * @param provider - The OAuth provider the identity came from.
	 * @returns The existing or newly created {@link User}.
	 * @throws {UnverifiedAccountException} When the email matches an unverified account.
	 *
	 * @example
	 * const user = await socialUserService.findOrCreate(allyUser, 'github')
	 */
	async findOrCreate(allyUser: AllyUserContract<any>, provider: OAuthProvider): Promise<User> {
		return withTransaction(async () => {
			let user = await this.userRepository.findByProviderId(provider, allyUser.id);

			if (user) {
				this.logService.logAuth('social.login', { userId: user.id, userEmail: user.email });
				return user;
			}

			if (allyUser.email) {
				user = await this.userRepository.findByEmail(allyUser.email);

				if (user) {
					if (!user.emailVerifiedAt) {
						this.logService.logSecurity('social.unverified_account_link_attempt', {
							userEmail: allyUser.email,
							provider,
						});
						throw new UnverifiedAccountException(allyUser.email);
					}

					await this.userRepository.linkProvider(user, provider, allyUser.id);
					await this.userRepository.markEmailAsVerified(user);

					this.logService.logAuth('social.linked', { userId: user.id, userEmail: user.email });
					return user;
				}
			}

			const userRole = await this.roleRepository.getUserRole();
			const base = allyUser.nickName || allyUser.name || `${provider}_user`;
			const username = await generateUniqueUsername(base, (u) => this.userRepository.exists({ username: u }));

			user = await this.userRepository.create({
				email: allyUser.email || `${provider}_${allyUser.id}@noemail.local`,
				username,
				[`${provider}Id`]: allyUser.id,
				emailVerifiedAt: DateTime.now(),
				roleId: userRole?.id || null,
			} as any);

			await this.preferencesRepository.upsert(user, { theme: 'light' });

			this.logService.logAuth('social.registered', { userId: user.id, userEmail: user.email });
			return user;
		});
	}
}
