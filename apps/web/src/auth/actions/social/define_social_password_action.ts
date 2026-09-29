import { inject } from '@adonisjs/core';
import { UserRepository } from '#identity/repositories/user_repository';
import type User from '#identity/models/user';

interface DefineSocialPasswordPayload {
	user: User;
	password: string;
}

/**
 * Define a native password for a social-only user.
 */
@inject()
export class DefineSocialPasswordAction {
	constructor(protected userRepository: UserRepository) {}

	/**
	 * Update the user's password so that a social account gains native login capability.
	 *
	 * @param payload - The user and the new password to set.
	 * @returns The updated {@link User} with the password hash set.
	 */
	async execute(payload: DefineSocialPasswordPayload): Promise<User> {
		return await this.userRepository.updatePassword(payload.user, payload.password);
	}
}
