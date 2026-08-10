import { inject } from '@adonisjs/core'
import UserPreference from '#models/preferences/user_preference'
import type User from '#models/auth/user'
import type { UserPreferences } from '#types/preferences'
import { DEFAULT_PREFERENCES } from '#types/preferences'
import { BaseRepository } from '#repositories/base_repository'

/**
 * Repository handling all database operations for {@link UserPreference} records.
 *
 * Operates exclusively on the `user_preferences` table and never touches the
 * `users` table directly. All public methods accept a {@link User} instance
 * as the ownership anchor.
 */
@inject()
export default class PreferencesRepository extends BaseRepository {
  /**
   * Returns the preferences record for the given user, or `null` if no row
   * exists yet.
   *
   * @param user - The authenticated user whose preferences to fetch.
   * @returns The {@link UserPreference} record, or `null`.
   *
   * @example
   * const prefs = await preferencesRepository.findByUser(user)
   * if (!prefs) { ... }
   */
  async findByUser(user: User): Promise<UserPreference | null> {
    return UserPreference.query(this.client()).where('userId', user.id).first()
  }

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
    return await UserPreference.updateOrCreate({ userId: user.id }, data, this.client())
  }

  /**
   * Returns the preferences record for the given user, creating one with
   * {@link DEFAULT_PREFERENCES} if no row exists yet.
   *
   * Use this method when you need a guaranteed non-null result, for example
   * when building Inertia shared props.
   *
   * @param user - The authenticated user whose preferences to retrieve.
   * @returns The existing or newly created {@link UserPreference} record.
   *
   * @example
   * const prefs = await preferencesRepository.getOrCreate(user)
   * return prefs.theme // always defined
   */
  async getOrCreate(user: User): Promise<UserPreference> {
    return await UserPreference.firstOrCreate(
      { userId: user.id },
      DEFAULT_PREFERENCES,
      this.client()
    )
  }
}
