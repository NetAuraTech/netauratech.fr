import { UserPreference as UserPreferenceDomain } from '#account/domain/preferences';
import UserPreference from '#account/models/user_preference';
import { BaseQuery } from '#core/queries/base_query';

/**
 * Read-side query fetching a user's preferences row.
 */
export class GetUserPreferenceQuery extends BaseQuery {
	/**
	 * Execute the preferences lookup query.
	 *
	 * @param userId - The owner of the preferences row.
	 * @returns The {@link UserPreferenceDomain}, or `null` when none exists yet.
	 */
	async execute(userId: number): Promise<UserPreferenceDomain | null> {
		const preference = await UserPreference.query(this.client()).where('userId', userId).first();

		return preference ? preference.toDomain() : null;
	}
}
