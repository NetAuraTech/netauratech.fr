import { inject } from '@adonisjs/core';
import { UserPreference } from '#account/domain/preferences';
import { PreferencesRepository } from '#account/repositories/preferences_repository';
import { type UserPreferences } from '#account/types/preferences';
import { withTransaction } from '#core/services/with_transaction';
import type User from '#identity/models/user';

interface UpdatePreferencesPayload {
	user: User;
	data: Partial<UserPreferences>;
}

/**
 * Update user preferences by upserting them atomically.
 */
@inject()
export class UpdatePreferencesAction {
	constructor(private preferencesRepository: PreferencesRepository) {}

	/**
	 * Execute preferences update.
	 *
	 * @param payload - Authenticated user and preference data to merge.
	 * @returns The merged {@link UserPreferences} with defaults applied.
	 */
	async execute(payload: UpdatePreferencesPayload): Promise<UserPreferences> {
		const preference = await withTransaction(async () => {
			return this.preferencesRepository.upsert(payload.user, payload.data);
		});

		return UserPreference.fromModel(preference).toPreferences();
	}
}
