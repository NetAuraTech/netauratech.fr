import { LogService } from '#services/logging/log_service'
import User from '#models/auth/user'
import { inject } from '@adonisjs/core'
import hash from '@adonisjs/core/services/hash'
import { UserRepository } from '#repositories/auth/user_repository'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import InvalidCurrentPasswordException from '#exceptions/auth/invalid_current_password_exception'
import { events } from '#generated/events'
import { FullToken } from '#types/core'
import { TokenRepository } from '#repositories/core/token_repository'
import { DateTime } from 'luxon'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'

/**
 * Handles sensitive account operations: credential updates and account deletion.
 *
 * Every mutating operation requires the user's email to be verified first.
 * Password-related operations additionally verify the current password before
 * applying any change, to prevent unauthorized modifications on unattended sessions.
 */
@inject()
export class AccountService {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected tokenRepository: TokenRepository
  ) {}

  /**
   * Updates the authenticated user's account credentials.
   *
   * Two independent operations can be triggered depending on the payload:
   * - **Password change**: requires `current_password` to be present and valid.
   *   The new password is then persisted.
   * - **Email change**: triggered when `payload.email` differs from the current
   *   email. The new address is stored as `pendingEmail` and an
   *   `InitiateEmailChange` event is dispatched to send a confirmation link.
   *
   * Both operations are blocked if the user's email has not been verified yet.
   * If neither condition is met, the original user is returned unchanged.
   *
   * @param user - The authenticated user whose account should be updated.
   * @param payload - Fields to update, optionally including `current_password`
   *   to authorize a password change.
   * @returns The updated {@link User}, or the original instance if nothing changed.
   * @throws {UnverifiedAccountException} If the user's email is not verified.
   * @throws {InvalidCurrentPasswordException} If `current_password` is provided
   *   but does not match the stored password hash.
   *
   * @example
   * // Change password
   * await accountService.update(user, { current_password: 'old', password: 'new' })
   *
   * // Change email
   * await accountService.update(user, { email: 'new@example.com' })
   */
  async update(
    user: User,
    payload: Partial<User> & {
      current_password?: User['password']
    }
  ): Promise<User> {
    if (!user.isEmailVerified) {
      this.logService.logSecurity('Attempt to update profile with unverified email', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new UnverifiedAccountException(user.email)
    }

    let updated: User | null = null

    if (payload.current_password) {
      const isPasswordValid = await hash.verify(user.password!, payload.current_password)

      if (!isPasswordValid) {
        this.logService.logSecurity('Failed password change attempt - invalid current password', {
          userId: user.id,
          userEmail: user.email,
        })

        throw new InvalidCurrentPasswordException()
      }

      updated = await this.userRepository.update(user, {
        password: payload.password,
      })
    }

    if (payload.email && user.email !== payload.email) {
      updated = await this.userRepository.update(user, {
        pendingEmail: payload.email,
      })

      if (updated) {
        await events.account.InitiateEmailChange.dispatch(updated)
      }
    }

    if (updated) {
      this.logService.logBusiness('settings.account.updated', {
        userId: user.id,
        userEmail: user.email,
      })

      return updated
    }

    return user
  }

  /**
   * Confirms an email address change using the token sent to the pending email.
   *
   * Resolves the token to its associated user, validates that a pending email
   * is still set, checks that the pending email has not been claimed by another
   * account in the meantime, then atomically updates the email, clears the
   * pending field, and expires all outstanding email change tokens.
   *
   * @param token - The raw `selector.validator` token from the confirmation link.
   * @returns The updated {@link User} with the new email address applied.
   * @throws {InvalidTokenException} If the token is invalid, expired, or cannot
   *   be resolved to a user, or if the user no longer has a pending email set.
   * @throws {EmailAlreadyExistsException} If the pending email has been claimed
   *   by another account between the request and the confirmation.
   *
   * @example
   * const user = await accountService.confirmEmailChange('selector.validator')
   */
  async confirmEmailChange(token: FullToken): Promise<User> {
    const user = await this.tokenRepository.getEmailChangeUser(token)

    const isEmailTaken = await this.userRepository.emailExists(user.pendingEmail!)

    if (isEmailTaken) {
      this.logService.logSecurity('Email change failed - pending email already in use', {
        userId: user.id,
        userEmail: user.email,
        pendingEmail: user.pendingEmail,
      })

      throw new EmailAlreadyExistsException(user.pendingEmail!)
    }

    const updated = await this.userRepository.update(user, {
      email: user.pendingEmail!,
      pendingEmail: null,
      emailVerifiedAt: DateTime.now(),
    })

    await this.tokenRepository.expireEmailChangeTokens(user)

    if (updated) {
      this.logService.logAuth('email_change.confirmed', {
        userId: user.id,
        userEmail: updated.email,
      })

      return updated
    }

    return user
  }

  /**
   * Permanently deletes the authenticated user's account.
   *
   * Requires the user's current password to authorize the deletion, preventing
   * accidental or unauthorized account removal on unattended sessions.
   * A business event is logged before deletion for audit trail purposes.
   *
   * @param user - The authenticated user whose account should be deleted.
   * @param payload - Must include `password` to authorize the operation.
   * @returns `true` once the account has been deleted.
   * @throws {InvalidCurrentPasswordException} If the provided password does not
   *   match the stored password hash.
   *
   * @example
   * await accountService.delete(user, { password: 'myCurrentPassword' })
   */
  async delete(user: User, payload: Partial<User>): Promise<boolean> {
    const isPasswordValid = await hash.verify(user.password!, payload.password!)

    if (!isPasswordValid) {
      this.logService.logSecurity('Failed account deletion attempt - invalid password', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new InvalidCurrentPasswordException()
    }

    this.logService.logBusiness(
      'account.deleted',
      {
        userId: user.id,
        userEmail: user.email,
      },
      {
        deletedAt: new Date().toISOString(),
      }
    )

    await user.delete()

    return true
  }
}
