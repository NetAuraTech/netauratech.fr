import { inject } from '@adonisjs/core';
import { UserPreference } from '#account/domain/preferences';
import { GetUserPreferenceQuery } from '#account/queries/get_user_preference_query';
import { type UserPreferences } from '#account/types/preferences';
import type User from '#identity/models/user';

interface GetPreferencesPayload {
	user: User | undefined;
}

/**
 * Retrieve the authenticated user's preferences, falling back to defaults.
 */
@inject()
export class GetPreferencesAction {
	constructor(private getUserPreferenceQuery: GetUserPreferenceQuery) {}

	/**
	 * Execute preference retrieval.
	 *
	 * @param payload - The authenticated user (may be undefined for guest requests).
	 * @returns The user's {@link UserPreferences}, or the defaults if not set.
	 *
	 * @example
	 * const prefs = await getPreferencesAction.execute({ user: request.auth.user })
	 */
	async execute(payload: GetPreferencesPayload): Promise<UserPreferences> {
		if (!payload.user) return UserPreference.defaults().toPreferences();

		const preference = await this.getUserPreferenceQuery.execute(payload.user.id);
		return (preference ?? UserPreference.defaults()).toPreferences();
	}
}
