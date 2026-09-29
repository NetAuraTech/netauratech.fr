import { inject } from '@adonisjs/core';
import { PreferencesRepository } from '#account/repositories/preferences_repository';
import { Locale } from '#account/types/preferences';
import { type RegisterPayload } from '#auth/types/auth';
import EmailAlreadyExistsException from '#core/exceptions/email_already_exists_exception';
import { withTransaction } from '#core/services/with_transaction';
import { extractNameFromEmail, generateUniqueUsername } from '#identity/domain/user';
import { RoleRepository } from '#identity/repositories/role_repository';
import { UserRepository } from '#identity/repositories/user_repository';
import { LogService } from '#log/services/log_service';
import type User from '#identity/models/user';

/**
 * Register a new user account with email, password, and locale.
 *
 * Creates the user record and initializes default preferences atomically within
 * a database transaction. Generates a unique username derived from the email
 * address and assigns the default role if one exists.
 */
@inject()
export class RegisterUserAction {
	constructor(
		protected logService: LogService,
		protected userRepository: UserRepository,
		protected preferencesRepository: PreferencesRepository,
		protected roleRepository: RoleRepository,
	) {}

	/**
	 * Execute user registration.
	 *
	 * @param payload - Registration data including email, password, and locale.
	 * @returns The newly created {@link User} instance with preferences initialized.
	 * @throws {EmailAlreadyExistsException} When the email is already registered.
	 */
	async execute(payload: RegisterPayload): Promise<User> {
		const existingUser = await this.userRepository.findByEmail(payload.email);

		if (existingUser) {
			this.logService.logAuth('register.failed.email_exists', {
				userEmail: payload.email,
			});

			throw new EmailAlreadyExistsException(payload.email);
		}

		return withTransaction(async () => {
			const userRole = await this.roleRepository.getUserRole();

			const base = extractNameFromEmail(payload.email);
			const username = await generateUniqueUsername(base, (u) => this.userRepository.exists({ username: u }));

			const user = await this.userRepository.create({
				email: payload.email,
				password: payload.password,
				roleId: userRole?.id || null,
				username,
			} as any);

			await this.preferencesRepository.upsert(user, {
				locale: payload.locale as Locale,
				theme: 'light',
			});

			return user;
		});
	}
}
