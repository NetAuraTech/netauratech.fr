import { inject } from '@adonisjs/core'
import type User from '#models/auth/user'
import { DEFAULT_PREFERENCES, type UserPreferences } from '#types/preferences'
import PreferencesRepository from '#repositories/preferences/preferences_repository'

/**
 * Service handling the read and write lifecycle of user UI preferences.
 *
 * Acts as the single entry point for all preference operations — callers
 * should never interact with {@link PreferencesRepository} directly.
 *
 * Guest-safe: {@link get} and {@link update} both accept `User | undefined`
 * so they can be called from shared middleware without an auth guard.
 */
@inject()
export default class PreferencesService {
  constructor(private preferencesRepository: PreferencesRepository) {}

  /**
   * Returns the resolved preferences for the given user.
   *
   * If the user has no preferences row yet, returns {@link DEFAULT_PREFERENCES}
   * without writing anything to the database. If `user` is `undefined` (guest),
   * also returns {@link DEFAULT_PREFERENCES}.
   *
   * @param user - The authenticated user, or `undefined` for guests.
   * @returns The user's resolved {@link UserPreferences}.
   *
   * @example
   * const prefs = await preferencesService.get(auth.user)
   * return prefs.theme // 'light' | 'dark' | 'system'
   */
  async get(user: User | undefined): Promise<UserPreferences> {
    if (!user) return DEFAULT_PREFERENCES

    const preference = await this.preferencesRepository.findByUser(user)

    if (!preference) return DEFAULT_PREFERENCES

    return {
      theme: preference.theme,
      locale: preference.locale,
    }
  }

  /**
   * Persists partial preference updates for the given user and returns the
   * full resolved preferences after the update.
   *
   * Creates the `user_preferences` row on first call (upsert). Fields not
   * present in `data` are left unchanged.
   *
   * @param user - The authenticated user whose preferences to update.
   * @param data - Partial preferences to persist (e.g. `{ theme: 'dark' }`).
   * @returns The full {@link UserPreferences} after the update.
   *
   * @example
   * const updated = await preferencesService.update(user, { theme: 'dark' })
   */
  async update(user: User, data: Partial<UserPreferences>): Promise<UserPreferences> {
    const preference = await this.preferencesRepository.upsert(user, data)

    return {
      theme: preference.theme ?? DEFAULT_PREFERENCES.theme,
      locale: preference.locale ?? DEFAULT_PREFERENCES.locale,
    }
  }
}
