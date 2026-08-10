import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { withTransaction } from '#shared/utils/with_transaction'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import { extractNameFromEmail } from '#helpers/auth/username'
import { events } from '#generated/events'

interface SendInvitationPayload {
  email: string
  roleId?: number | null
}

/**
 * Create a pending user and send an invitation email.
 */
@inject()
export class SendInvitationAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository
  ) {}

  /**
   * Execute invitation sending.
   *
   * @param payload - Email address of the invitee and optional role ID.
   * @returns The created {@link User} in pending state.
   * @throws {EmailAlreadyExistsException} When the email is already registered.
   */
  async execute(payload: SendInvitationPayload): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(payload.email)

    if (existingUser) {
      this.logService.logAuth('invitation.failed.email_exists', {
        userEmail: payload.email,
      })
      throw new EmailAlreadyExistsException(payload.email)
    }

    const user = await withTransaction(async () => {
      return this.userRepository.create({
        email: payload.email,
        username: extractNameFromEmail(payload.email),
        password: null,
        roleId: payload.roleId ?? null,
      } as any)
    })

    await events.admin.InviteUser.dispatch(user)

    this.logService.logAuth('invitation.sent', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }
}
