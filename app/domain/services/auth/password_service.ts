import User from '#models/auth/user'
import type { ResetPasswordPayload } from '#types/auth'
import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { TokenRepository } from '#repositories/core/token_repository'
import { maskToken } from '#helpers/core/crypto'
import { events } from '#generated/events'
import { FullToken } from '#types/core'

/**
 * Handles all password lifecycle operations: reset link dispatch,
 * token validation, and password update.
 *
 * Tokens follow the **selector/validator pattern** for secure and efficient
 * lookup: the selector is stored in plain text for fast database queries,
 * while the validator is hashed so that a database leak does not expose
 * usable tokens.
 */
@inject()
export class PasswordService {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected tokenRepository: TokenRepository
  ) {}

  /**
   * Initiates the password reset flow for a given user.
   *
   * Dispatches a `ForgotPassword` event which is responsible for expiring
   * any existing reset tokens, generating a fresh selector/validator token,
   * and sending the reset link by email (valid for 1 hour).
   *
   * @param user - The user requesting a password reset.
   *
   * @example
   * await passwordService.send(user)
   */
  async send(user: User): Promise<void> {
    await events.auth.ForgotPassword.dispatch(user)
  }

  /**
   * Validates a password reset token without consuming it.
   *
   * Delegates entirely to the token repository which handles both token
   * verification and attempt limit enforcement.
   *
   * @param token - The raw `selector.validator` token from the reset link.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   * @throws {MaxAttemptsExceededException} If the token has been probed too many times.
   *
   * @example
   * await passwordService.validate(token)
   */
  async validate(token: FullToken): Promise<void> {
    await this.tokenRepository.verifyPasswordResetToken(token)
  }

  /**
   * Resets the user's password identified by the token in the payload.
   *
   * The attempt counter is incremented **before** any lookup to mitigate
   * brute-force attacks. If the counter already exceeds the limit, or if
   * the token cannot be resolved to a user, the operation is aborted and
   * an appropriate exception is thrown. On success, the password is updated
   * and all outstanding reset tokens for that user are expired.
   *
   * @param payload - The reset payload containing the raw token and the new password.
   * @returns The updated {@link User} after the password change.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   * @throws {MaxAttemptsExceededException} If the attempt counter has reached
   *   or exceeded the maximum allowed attempts.
   *
   * @example
   * const user = await passwordService.reset({ token, password: 'newPassword123' })
   */
  async reset(payload: ResetPasswordPayload): Promise<User> {
    await this.tokenRepository.incrementAttempts(payload.token)

    await this.tokenRepository.checkAttempts(payload.token)

    const user = await this.tokenRepository.getPasswordResetUser(payload.token)

    await this.userRepository.updatePassword(user, payload.password)
    await this.tokenRepository.expirePasswordResetTokens(user)

    this.logService.logAuth('Password reset successful', {
      userId: user.id,
      token: maskToken(payload.token),
    })

    return user
  }
}
