import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import { UserRepository } from '#repositories/auth/user_repository'
import User from '#models/auth/user'
import { events } from '#generated/events'
import { FullToken } from '#types/core'
import { TokenRepository } from '#repositories/core/token_repository'
import { DateTime } from 'luxon'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

/**
 * Handles the full lifecycle of user invitations.
 *
 * An invitation creates a passwordless user account, dispatches an invite
 * email, and later accepts the token submitted by the invitee to activate
 * the account with a chosen password.
 */
@inject()
export class InvitationService {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected tokenRepository: TokenRepository
  ) {}

  /**
   * Creates a new invited user and dispatches the invitation email.
   *
   * The user is persisted without a password so they cannot log in until
   * they accept the invitation. If an account already exists with the given
   * email address the operation is aborted and the duplicate is logged.
   *
   * @param payload - Partial user data. Must include `email`. `password` is
   *   always forced to `null` regardless of the supplied value.
   * @returns The newly created {@link User} record.
   * @throws {EmailAlreadyExistsException} When a user with the same email
   *   already exists in the database.
   */
  async send(payload: Partial<User>) {
    const existingUser = await this.userRepository.findByEmail(payload.email!)

    if (existingUser) {
      this.logService.logAuth('invitation.failed.email_exists', {
        userEmail: payload.email,
      })

      throw new EmailAlreadyExistsException(payload.email!)
    }

    const user = await this.userRepository.create({
      ...payload,
      password: null,
    })

    await events.admin.InviteUser.dispatch(user)

    this.logService.logAuth('invitation.sent', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }

  /**
   * Resolves an invitation token and returns the associated user.
   *
   * @param token - The full token value from the invitation link.
   * @returns The {@link User} linked to the token.
   */
  async get(token: FullToken): Promise<User> {
    const data = await this.tokenRepository.getUserInvitationToken(token)

    return data.user
  }

  /**
   * Accepts an invitation by setting the user's password and marking their
   * email as verified.
   *
   * After the update all pending invite tokens for this user are expired so
   * the same link cannot be reused.
   *
   * @param token - The full token value from the invitation link.
   * @param payload - Data to apply to the user (typically `password` and
   *   `password_confirmation`).
   * @returns The updated {@link User} record.
   * @throws {RowNotFoundException} When the user record cannot be found after
   *   the update — indicates a data-integrity issue.
   */
  async accept(token: FullToken, payload: Partial<User>) {
    const user = await this.get(token)

    const updated = await this.userRepository.update(user, {
      ...payload,
      emailVerifiedAt: DateTime.now(),
    })

    if (!updated) {
      throw new RowNotFoundException(User)
    }

    await this.tokenRepository.expireInviteTokens(updated)

    this.logService.logAuth('invitation.accepted', {
      userId: updated.id,
      userEmail: updated.email,
    })

    return updated
  }
}
