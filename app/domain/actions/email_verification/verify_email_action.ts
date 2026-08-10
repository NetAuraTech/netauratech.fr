import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { TokenRepository } from '#repositories/core/token_repository'
import { withTransaction } from '#shared/utils/with_transaction'
import { FullToken } from '#types/core'

interface VerifyEmailPayload {
  token: FullToken
}

/**
 * Verify a user email address using a token from the verification link.
 *
 * Marks the email as verified and expires all outstanding verification tokens
 * atomically within a transaction.
 */
@inject()
export class VerifyEmailAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected tokenRepository: TokenRepository
  ) {}

  /**
   * Execute email verification.
   *
   * @param payload - The full token string from the verification email.
   * @returns The verified {@link User}, or `null` if the token is invalid.
   */
  async execute(payload: VerifyEmailPayload): Promise<User | null> {
    const user = await this.tokenRepository.getEmailVerificationUser(payload.token)

    await withTransaction(async () => {
      await this.userRepository.markEmailAsVerified(user)
      await this.tokenRepository.expireEmailVerificationTokens(user)
    })

    this.logService.logAuth('email_verification.confirmed', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }
}
