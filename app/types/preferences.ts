/**
 * Supported color scheme values for the theme preference.
 *
 * - `'light'` — always use the light theme.
 * - `'dark'` — always use the dark theme.
 */
export type Theme = 'light' | 'dark'

/**
 * Supported interface language values for the locale preference.
 */
export type Locale = 'fr' | 'en'

/**
 * Shape of a user's resolved preferences as consumed by the frontend
 * and returned by {@link PreferencesService.get}.
 */
export interface UserPreferences {
  [key: string]: Theme | Locale
  theme: Theme
  locale: Locale
}

/**
 * Fallback preferences applied when a user has no row in `user_preferences`
 * or when no authenticated user is present (guest visitors).
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  locale: 'en',
}
