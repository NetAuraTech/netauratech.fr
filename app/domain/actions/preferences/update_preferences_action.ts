import { inject } from '@adonisjs/core'
import type User from '#models/auth/user'
import PreferencesRepository from '#repositories/preferences/preferences_repository'
import { withTransaction } from '#shared/utils/with_transaction'
import { DEFAULT_PREFERENCES, type UserPreferences } from '#types/preferences'

interface UpdatePreferencesPayload {
  user: User
  data: Partial<UserPreferences>
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
      return this.preferencesRepository.upsert(payload.user, payload.data)
    })

    return {
      theme: preference.theme ?? DEFAULT_PREFERENCES.theme,
      locale: preference.locale ?? DEFAULT_PREFERENCES.locale,
    }
  }
}
