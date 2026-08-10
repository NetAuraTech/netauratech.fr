import { inject } from '@adonisjs/core'
import type User from '#models/auth/user'
import PreferencesRepository from '#repositories/preferences/preferences_repository'
import { DEFAULT_PREFERENCES, type UserPreferences } from '#types/preferences'

interface GetPreferencesPayload {
  user: User | undefined
}

/**
 * Retrieve the authenticated user's preferences, falling back to defaults.
 */
@inject()
export class GetPreferencesAction {
  constructor(private preferencesRepository: PreferencesRepository) {}

  /**
   * Execute preference retrieval.
   *
   * @param payload - The authenticated user (may be undefined for guest requests).
   * @returns The user's {@link UserPreferences}, or {@link DEFAULT_PREFERENCES} if not set.
   *
   * @example
   * const prefs = await getPreferencesAction.execute({ user: request.auth.user })
   */
  async execute(payload: GetPreferencesPayload): Promise<UserPreferences> {
    if (!payload.user) return DEFAULT_PREFERENCES

    const preference = await this.preferencesRepository.findByUser(payload.user)
    if (!preference) return DEFAULT_PREFERENCES

    return { theme: preference.theme, locale: preference.locale }
  }
}
