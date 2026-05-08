import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { TokenRepository } from '#repositories/core/token_repository'
import { events } from '#generated/events'
import { FullToken } from '#types/core'

/**
 * Handles email address verification for newly registered users.
 *
 * Tokens follow the **selector/validator pattern**: the selector is stored
 * in plain text for fast database lookup, while the validator is hashed so
 * that a database leak does not expose usable tokens.
 */
@inject()
export class EmailVerificationService {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected tokenRepository: TokenRepository
  ) {}

  /**
   * Initiates the email verification flow for a given user.
   *
   * Dispatches a `UserRegistered` event which is responsible for generating
   * a fresh selector/validator token and sending the verification link by email.
   *
   * @param user - The user to send the verification email to.
   *
   * @example
   * await emailVerificationService.send(user)
   */
  async send(user: User): Promise<void> {
    await events.auth.UserRegistered.dispatch(user)
  }

  /**
   * Verifies a user's email address using the token from the verification link.
   *
   * Resolves the token to its associated user, marks their email as verified,
   * and expires all outstanding verification tokens for that user.
   * Returns `null` instead of throwing when the token is invalid or expired,
   * so the caller can decide how to surface the error to the client.
   *
   * @param token - The raw `selector.validator` token extracted from the link.
   * @returns The verified {@link User} on success, or `null` if the token is
   *   invalid, not found, or has already expired.
   *
   * @example
   * const user = await emailVerificationService.verify(token)
   * if (!user) {
   *   return response.badRequest('Invalid or expired verification link.')
   * }
   */
  async verify(token: FullToken): Promise<User | null> {
    const user = await this.tokenRepository.getEmailVerificationUser(token)

    await this.userRepository.markEmailAsVerified(user)
    await this.tokenRepository.expireEmailVerificationTokens(user)

    this.logService.logAuth('email_verification.confirmed', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }
}
