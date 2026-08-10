import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { AllyUserContract } from '@adonisjs/ally/types'
import { OAuthProvider } from '#types/auth'
import { DateTime } from 'luxon'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { RoleRepository } from '#repositories/auth/role_repository'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import PreferencesRepository from '#repositories/preferences/preferences_repository'
import { generateUniqueUsername } from '#helpers/auth/username'
import { withTransaction } from '#shared/utils/with_transaction'

interface FindOrCreateSocialUserPayload {
  allyUser: AllyUserContract<any>
  provider: OAuthProvider
}

/**
 * Find an existing user by OAuth provider or create a new social account.
 *
 * Handles three flows: existing provider link, email-based account linking,
 * and fresh registration. All operations run atomically within a transaction.
 */
@inject()
export class FindOrCreateSocialUserAction {
  constructor(
    protected logService: LogService,
    private userRepository: UserRepository,
    private preferencesRepository: PreferencesRepository,
    private roleRepository: RoleRepository
  ) {}

  /**
   * Execute social user lookup or creation.
   *
   * @param payload - The OAuth provider and ally user data from the authentication response.
   * @returns The existing or newly created {@link User}.
   * @throws {UnverifiedAccountException} When the email matches an unverified account.
   *
   * @example
   * const user = await findOrCreateSocialUserAction.execute({ allyUser, provider: 'github' })
   */
  async execute(payload: FindOrCreateSocialUserPayload): Promise<User> {
    return withTransaction(async () => {
      let user = await this.userRepository.findByProviderId(payload.provider, payload.allyUser.id)

      if (user) {
        this.logService.logAuth('social.login', { userId: user.id, userEmail: user.email })
        return user
      }

      if (payload.allyUser.email) {
        user = await this.userRepository.findByEmail(payload.allyUser.email)

        if (user) {
          if (!user.emailVerifiedAt) {
            this.logService.logSecurity('social.unverified_account_link_attempt', {
              userEmail: payload.allyUser.email,
              provider: payload.provider,
            })
            throw new UnverifiedAccountException(payload.allyUser.email)
          }

          await this.userRepository.linkProvider(user, payload.provider, payload.allyUser.id)
          await this.userRepository.markEmailAsVerified(user)

          this.logService.logAuth('social.linked', { userId: user.id, userEmail: user.email })
          return user
        }
      }

      const userRole = await this.roleRepository.getUserRole()
      const base = payload.allyUser.nickName || payload.allyUser.name || `${payload.provider}_user`
      const username = await generateUniqueUsername(base, (u) =>
        this.userRepository.exists({ username: u })
      )

      user = await this.userRepository.create({
        email: payload.allyUser.email || `${payload.provider}_${payload.allyUser.id}@noemail.local`,
        username,
        [`${payload.provider}Id`]: payload.allyUser.id,
        emailVerifiedAt: DateTime.now(),
        roleId: userRole?.id || null,
      } as any)

      await this.preferencesRepository.upsert(user, { theme: 'light' })

      this.logService.logAuth('social.registered', { userId: user.id, userEmail: user.email })
      return user
    })
  }
}
