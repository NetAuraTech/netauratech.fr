import ProviderNotConfiguredException from '#exceptions/auth/provider_not_configured_exception'
import { type OAuthProvider } from '#types/auth'
import env from '#start/env'

/**
 * Determines whether an OAuth provider is properly configured by validating
 * its client ID and client secret.
 *
 * A provider is considered configured only if both values are present,
 * non-empty strings, and neither is set to the placeholder value `'dummy'`.
 *
 * @param clientId - The OAuth client ID retrieved from environment variables.
 * @param clientSecret - The OAuth client secret retrieved from environment variables.
 * @returns `true` if the provider is fully configured, `false` otherwise.
 *
 * @example
 * isProviderConfigured('abc123', 'secret456') // true
 * isProviderConfigured('dummy', 'secret456')  // false
 * isProviderConfigured(undefined, undefined)  // false
 */
export function isProviderConfigured(clientId?: string, clientSecret?: string): boolean {
  return !!(
    clientId &&
    clientSecret &&
    clientId.trim() !== '' &&
    clientSecret.trim() !== '' &&
    clientId !== 'dummy' &&
    clientSecret !== 'dummy'
  )
}

/**
 * The list of OAuth providers that are currently active, derived at startup
 * by filtering the supported providers (`github`, `google`, `facebook`) against
 * their respective environment variables.
 *
 * A provider is included only if both `<PROVIDER>_CLIENT_ID` and
 * `<PROVIDER>_CLIENT_SECRET` pass the {@link isProviderConfigured} check.
 *
 * @example
 * // Given GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are set:
 * enabledProviders // ['github']
 */
export const enabledProviders = (['github', 'google', 'facebook'] as const).filter((provider) => {
  const clientId = env.get(`${provider.toUpperCase()}_CLIENT_ID`)
  const clientSecret = env.get(`${provider.toUpperCase()}_CLIENT_SECRET`)
  return isProviderConfigured(clientId, clientSecret)
}) as Array<OAuthProvider>

/**
 * Checks whether a given OAuth provider is currently enabled.
 *
 * @param provider - The provider name to check (e.g. `'github'`, `'google'`).
 * @returns `true` if the provider is present in {@link enabledProviders}, `false` otherwise.
 *
 * @example
 * isProviderEnabled('github')   // true  (if configured)
 * isProviderEnabled('twitter')  // false (not supported)
 */
export function isProviderEnabled(provider: string): boolean {
  return enabledProviders.includes(provider as any)
}

/**
 * Asserts that the given OAuth provider is enabled, throwing an exception if not.
 *
 * This is intended as a guard at the entry point of auth routes or controllers
 * to reject requests targeting unconfigured providers early.
 *
 * @param provider - The provider name to validate (e.g. `'github'`, `'google'`).
 * @throws {ProviderNotConfiguredException} If the provider is not in {@link enabledProviders}.
 *
 * @example
 * validateProvider('github') // passes silently if configured
 * validateProvider('twitter') // throws ProviderNotConfiguredException
 */
export function validateProvider(provider: string): void {
  if (!isProviderEnabled(provider)) {
    throw new ProviderNotConfiguredException(provider)
  }
}
