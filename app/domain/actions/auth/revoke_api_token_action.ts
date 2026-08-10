import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'

interface RevokeApiTokenPayload {
  user: User
  /** Database identifier of the token to revoke (its `id` column). */
  tokenIdentifier: string | number | BigInt
}

/**
 * Revokes an opaque access token, typically the one presented on the
 * current request (`user.currentAccessToken.identifier`).
 */
@inject()
export class RevokeApiTokenAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository
  ) {}

  /**
   * @param payload - The token owner and the identifier of the token to delete.
   * @returns Nothing — revoking an already-gone token is not an error.
   */
  async execute(payload: RevokeApiTokenPayload): Promise<void> {
    await this.userRepository.deleteAccessToken(payload.user, payload.tokenIdentifier)

    this.logService.logAuth('api_token.revoked', {
      userId: payload.user.id,
      userEmail: payload.user.email,
    })
  }
}
