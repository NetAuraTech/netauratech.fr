import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { OAuthProvider } from '#types/auth'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { withTransaction } from '#shared/utils/with_transaction'

interface UnlinkSocialProviderPayload {
  user: User
  provider: OAuthProvider
}

/**
 * Remove an OAuth provider link from a user account.
 */
@inject()
export class UnlinkSocialProviderAction {
  constructor(
    protected logService: LogService,
    private userRepository: UserRepository
  ) {}

  /**
   * Execute social provider unlinking.
   *
   * @param payload - Authenticated user and provider to unlink.
   * @returns The updated {@link User}.
   */
  async execute(payload: UnlinkSocialProviderPayload): Promise<User> {
    await withTransaction(async () => {
      await this.userRepository.unlinkProvider(payload.user, payload.provider)
    })

    this.logService.logAuth('social.provider_unlinked', {
      userId: payload.user.id,
      provider: payload.provider,
    })

    return payload.user
  }
}
