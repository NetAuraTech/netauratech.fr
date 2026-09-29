import { inject } from '@adonisjs/core';
import User from '#identity/models/user';
import { UserRepository } from '#identity/repositories/user_repository';

interface FindUserByEmailPayload {
	email: string;
}

/**
 * Find a user by email for flows that must not distinguish existing
 * accounts (password reset, invitation reminders).
 */
@inject()
export class FindUserByEmailAction {
	constructor(protected userRepository: UserRepository) {}

	/**
	 * @param payload - The email to look up.
	 * @returns The matching {@link User}, or `null` when no user exists.
	 */
	async execute(payload: FindUserByEmailPayload): Promise<User | null> {
		return this.userRepository.findByEmail(payload.email);
	}
}
