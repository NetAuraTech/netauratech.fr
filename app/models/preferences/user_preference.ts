import { UserPreferenceSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/auth/user'
import type { Locale, Theme } from '#types/preferences'

export default class UserPreference extends UserPreferenceSchema {
  /**
   * The user's preferred color scheme.
   * `'system'` delegates to the OS-level `prefers-color-scheme` media query.
   */
  @column()
  declare theme: Theme

  /** The user's preferred interface language. */
  @column()
  declare locale: Locale

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
