import { inject } from '@adonisjs/core'
import { TokenRepository } from '#repositories/core/token_repository'
import { FullToken } from '#types/core'

interface ValidatePasswordTokenPayload {
  token: FullToken
}

/**
 * Validate a password reset token without consuming it for frontend display.
 */
@inject()
export class ValidatePasswordTokenAction {
  constructor(protected tokenRepository: TokenRepository) {}

  /**
   * @param payload - The full token string to validate
   * @returns true when the token is valid
   */
  async execute(payload: ValidatePasswordTokenPayload): Promise<void> {
    await this.tokenRepository.verifyPasswordResetToken(payload.token)
  }
}
