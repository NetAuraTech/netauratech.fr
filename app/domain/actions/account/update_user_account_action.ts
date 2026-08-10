import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import hash from '@adonisjs/core/services/hash'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { withTransaction } from '#shared/utils/with_transaction'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import InvalidCurrentPasswordException from '#exceptions/auth/invalid_current_password_exception'
import { events } from '#generated/events'

interface UpdateUserAccountPayload {
  user: User
  currentPassword?: string
  password?: string
  email?: string
}

/**
 * Update the authenticated user's account credentials.
 */
@inject()
export class UpdateUserAccountAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository
  ) {}

  async execute(payload: UpdateUserAccountPayload): Promise<User> {
    if (!payload.user.isEmailVerified) {
      this.logService.logSecurity('Attempt to update account with unverified email', {
        userId: payload.user.id,
        userEmail: payload.user.email,
      })
      throw new UnverifiedAccountException(payload.user.email)
    }

    let updated = payload.user

    if (payload.currentPassword && payload.password) {
      const isPasswordValid = await hash.verify(payload.user.password!, payload.currentPassword)
      if (!isPasswordValid) {
        this.logService.logSecurity('Failed password change attempt - invalid current password', {
          userId: payload.user.id,
          userEmail: payload.user.email,
        })
        throw new InvalidCurrentPasswordException()
      }
      updated = await withTransaction(async () =>
        this.userRepository.update(payload.user, { password: payload.password })
      )
    }

    if (payload.email && payload.user.email !== payload.email) {
      updated = await withTransaction(async () => {
        const user = await this.userRepository.update(payload.user, { pendingEmail: payload.email })
        if (user) await events.account.InitiateEmailChange.dispatch(user)
        return user
      })
    }

    if (updated !== payload.user) {
      this.logService.logBusiness('settings.account.updated', {
        userId: payload.user.id,
        userEmail: payload.user.email,
      })
    }

    return updated
  }
}
