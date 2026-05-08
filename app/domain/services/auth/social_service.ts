import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { RoleRepository } from '#repositories/auth/role_repository'
import { inject } from '@adonisjs/core'
import { AllyUserContract } from '@adonisjs/ally/types'
import User from '#models/auth/user'
import ProviderAlreadyLinkedException from '#exceptions/auth/provider_already_linked_exception'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import { OAuthProvider } from '#types/auth'
import { DateTime } from 'luxon'
import { generateUniqueUsername } from '#helpers/auth/username'
import PreferencesRepository from '#repositories/preferences/preferences_repository'

/**
 * Handles OAuth-based authentication flows, including account creation,
 * provider linking, and provider unlinking.
 *
 * This service is the single entry point for all social authentication
 * operations and delegates persistence to {@link UserRepository} and
 * {@link RoleRepository}, while recording every significant event through
 * {@link LogService}.
 */
@inject()
export class SocialService {
  constructor(
    protected logService: LogService,
    private userRepository: UserRepository,
    private preferencesRepository: PreferencesRepository,
    private roleRepository: RoleRepository
  ) {}

  /**
   * Resolves the application user that corresponds to an OAuth identity,
   * creating one if none exists yet.
   *
   * The resolution follows this priority order:
   * 1. **Provider match** — looks up an existing user by `provider` + `ally_user.id`.
   * 2. **Email match** — if the OAuth profile carries an email, finds the matching
   *    user and links the provider to their account, provided their email is already
   *    verified. If the account exists but is unverified, an exception is thrown to
   *    prevent potential account takeover.
   * 3. **Registration** — creates a brand-new user with the default role, using a
   *    synthetic email (`<provider>_<id>@noemail.local`) when no email is provided.
   *
   * @param ally_user - The OAuth profile returned by AdonisJS Ally.
   * @param provider - The OAuth provider that authenticated the user.
   * @returns The resolved or newly created {@link User}.
   * @throws {UnverifiedAccountException} If an account with the same email exists
   *   but has not been verified yet, to prevent OAuth-based account takeover.
   *
   * @example
   * const user = await socialService.findOrCreateUser(allyUser, 'github')
   */
  async findOrCreateUser(ally_user: AllyUserContract<any>, provider: OAuthProvider): Promise<User> {
    let user = await this.userRepository.findByProviderId(provider, ally_user.id)

    if (user) {
      this.logService.logAuth('social.login', {
        userId: user.id,
        userEmail: user.email,
      })
      return user
    }

    if (ally_user.email) {
      user = await this.userRepository.findByEmail(ally_user.email)

      if (user) {
        // 🔒 Security: an unverified account already exists for this email.
        // Linking the provider would let an attacker who pre-registered with
        // someone else's email hijack the OAuth flow and gain access to a
        // verified identity they do not own.
        if (!user.emailVerifiedAt) {
          this.logService.logSecurity('social.unverified_account_link_attempt', {
            userEmail: ally_user.email,
            provider,
          })
          throw new UnverifiedAccountException(ally_user.email)
        }

        await this.userRepository.linkProvider(user, provider, ally_user.id)
        await this.userRepository.markEmailAsVerified(user)

        this.logService.logAuth('social.linked', {
          userId: user.id,
          userEmail: user.email,
        })

        return user
      }
    }

    const userRole = await this.roleRepository.getUserRole()

    const base = ally_user.nickName || ally_user.name || `${provider}_user`

    const username = await generateUniqueUsername(base, (u) =>
      this.userRepository.exists({ username: u })
    )

    user = await this.userRepository.create({
      email: ally_user.email || `${provider}_${ally_user.id}@noemail.local`,
      username: username,
      [`${provider}Id`]: ally_user.id,
      emailVerifiedAt: DateTime.now(),
      roleId: userRole?.id || null,
    })

    await this.preferencesRepository.upsert(user, {
      theme: 'light',
    })

    this.logService.logAuth('social.registered', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }

  /**
   * Links an OAuth provider identity to an already authenticated user.
   *
   * Before linking, verifies that the OAuth account is not already associated
   * with a **different** user. If it is, a security event is logged and an
   * exception is thrown to prevent account takeover.
   *
   * @param user - The currently authenticated user who wants to link the provider.
   * @param ally_user - The OAuth profile returned by AdonisJS Ally.
   * @param provider - The OAuth provider to link.
   * @throws {ProviderAlreadyLinkedException} If `ally_user.id` is already linked
   *   to a different user account for the given `provider`.
   *
   * @example
   * await socialService.linkProvider(currentUser, allyUser, 'google')
   */
  async linkProvider(
    user: User,
    ally_user: AllyUserContract<any>,
    provider: OAuthProvider
  ): Promise<void> {
    const existingUser = await this.userRepository.findByProviderIdExcluding(
      provider,
      ally_user.id,
      user.id
    )

    if (existingUser) {
      this.logService.logSecurity('Attempt to link already linked provider', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new ProviderAlreadyLinkedException(provider)
    }

    await this.userRepository.linkProvider(user, provider, ally_user.id)

    this.logService.logAuth('social.provider_linked', {
      userId: user.id,
      userEmail: user.email,
    })
  }

  /**
   * Removes the association between a user and an OAuth provider.
   *
   * After unlinking, the user can no longer sign in via that provider unless
   * they go through the OAuth flow again. If the user has no password set,
   * consider prompting them to set one via {@link needsPasswordSetup}.
   *
   * @param user - The user whose provider link should be removed.
   * @param provider - The OAuth provider to unlink.
   *
   * @example
   * await socialService.unlinkProvider(currentUser, 'facebook')
   */
  async unlinkProvider(user: User, provider: OAuthProvider): Promise<void> {
    await this.userRepository.unlinkProvider(user, provider)

    this.logService.logAuth('social.provider_unlinked', {
      userId: user.id,
      userEmail: user.email,
    })
  }

  /**
   * Determines whether a user must set a password before they can use
   * password-based authentication.
   *
   * This is `true` when the account was created exclusively through OAuth
   * (i.e. at least one social provider is linked) and no local password has
   * been stored yet. Typical use-case: prompting the user after they unlink
   * their last provider, or on their first login via a social account.
   *
   * @param user - The user to inspect.
   * @returns `true` if the user has at least one linked provider but no password.
   *
   * @example
   * if (socialService.needsPasswordSetup(user)) {
   *   return response.redirect('/auth/set-password')
   * }
   */
  needsPasswordSetup(user: User): boolean {
    const hasSocialAccount = !!(user.githubId || user.googleId || user.facebookId)
    const hasNoPassword = !user.password

    return hasSocialAccount && hasNoPassword
  }
}
