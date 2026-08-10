import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { TokenRepository } from '#repositories/core/token_repository'
import { FullToken } from '#types/core'

interface GetInvitationPayload {
  token: FullToken
}

/**
 * Retrieve the user associated with an invitation token for display.
 */
@inject()
export class GetInvitationAction {
  constructor(protected tokenRepository: TokenRepository) {}

  /**
   * @param payload - The full invitation token string
   * @returns The invited User or null if invalid or expired
   */
  async execute(payload: GetInvitationPayload): Promise<User> {
    const data = await this.tokenRepository.getUserInvitationToken(payload.token)
    return data.user
  }
}
