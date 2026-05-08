import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'

/**
 * Handles profile update operations for authenticated users.
 *
 * Enforces the invariant that only users with a verified email address
 * are allowed to modify their profile data.
 */
@inject()
export class ProfileService {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository
  ) {}

  /**
   * Updates the profile data of a verified user.
   *
   * Rejects the operation if the user's email has not been verified yet,
   * logging a security event and throwing an exception to prevent unverified
   * accounts from altering their profile.
   *
   * On success, the old and new values are recorded as a business event for
   * audit purposes. If the repository returns `null` (record not found), the
   * original user instance is returned unchanged.
   *
   * @param user - The authenticated user whose profile should be updated.
   * @param payload - Partial {@link User} fields to apply to the profile.
   * @returns The updated {@link User}, or the original instance if no record
   *   was found by the repository.
   * @throws {UnverifiedAccountException} If the user's email has not been
   *   verified yet.
   *
   * @example
   * const updated = await profileService.update(user, { username: 'Jane Doe' })
   */
  async update(user: User, payload: Partial<User>): Promise<User> {
    if (!user.isEmailVerified) {
      this.logService.logSecurity('Attempt to update profile with unverified email', {
        userId: user.id,
        userEmail: user.email,
      })

      throw new UnverifiedAccountException(user.email)
    }

    const oldData = {
      username: user.username,
    }

    const updated = await this.userRepository.update(user, payload)

    if (updated) {
      this.logService.logBusiness(
        'settings.profile.updated',
        {
          userId: user.id,
          userEmail: user.email,
        },
        {
          oldData,
          newData: {
            username: updated.username,
          },
        }
      )

      return updated
    }

    return user
  }
}
