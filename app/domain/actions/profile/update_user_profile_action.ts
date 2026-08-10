import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { withTransaction } from '#shared/utils/with_transaction'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'

interface UpdateUserProfilePayload {
  user: User
  username?: string
}

/**
 * Update the authenticated user's profile information.
 */
@inject()
export class UpdateUserProfileAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository
  ) {}

  /**
   * Execute profile update.
   *
   * @param payload - Authenticated user and fields to update.
   * @returns The updated {@link User}.
   * @throws {UnverifiedAccountException} If the user email is not verified.
   */
  async execute(payload: UpdateUserProfilePayload): Promise<User> {
    if (!payload.user.isEmailVerified) {
      this.logService.logSecurity('Attempt to update profile with unverified email', {
        userId: payload.user.id,
        userEmail: payload.user.email,
      })
      throw new UnverifiedAccountException(payload.user.email)
    }

    const oldData = { username: payload.user.username }

    const updated = await withTransaction(async () => {
      return this.userRepository.update(payload.user, { username: payload.username })
    })

    if (updated) {
      this.logService.logBusiness(
        'settings.profile.updated',
        { userId: payload.user.id, userEmail: payload.user.email },
        { oldData, newData: { username: updated.username } }
      )
      return updated
    }

    return payload.user
  }
}
