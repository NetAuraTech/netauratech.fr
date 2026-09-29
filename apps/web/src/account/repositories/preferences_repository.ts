import { inject } from '@adonisjs/core';
import UserPreference from '#account/models/user_preference';
import { type UserPreferences } from '#account/types/preferences';
import { BaseRepository } from '#core/repositories/base_repository';
import type User from '#identity/models/user';

/**
 * Repository handling all database operations for {@link UserPreference} records.
 *
 * Operates exclusively on the `user_preferences` table and never touches the
 * `users` table directly. All public methods accept a {@link User} instance
 * as the ownership anchor.
 */
@inject()
export class PreferencesRepository extends BaseRepository {
	/**
	 * Creates or updates the preferences row for the given user in a single
	 * atomic operation.
	 *
	 * Only the fields present in `data` are written — existing fields not
	 * included in `data` are preserved.
	 *
	 * @param user - The authenticated user whose preferences to persist.
	 * @param data - Partial preferences to create or merge into the existing row.
	 * @returns The persisted {@link UserPreference} record.
	 *
	 * @example
	 * const prefs = await preferencesRepository.upsert(user, { theme: 'dark' })
	 */
	async upsert(user: User, data: Partial<UserPreferences>): Promise<UserPreference> {
		return await UserPreference.updateOrCreate({ userId: user.id }, data, this.client());
	}
}
