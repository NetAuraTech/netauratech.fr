import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import InvalidCredentialsException from '#exceptions/auth/invalid_credentials_exception'

interface LoginPayload {
  email: string
  password: string
}

/**
 * Authenticate a user with email and password..
 */
@inject()
export class LoginAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository
  ) {}

  /**
   * @param payload - Email address and plaintext password to verify.
   * @returns The authenticated {@link User} instance.
   */
  async execute(payload: LoginPayload): Promise<User> {
    try {
      const user = await this.userRepository.verifyCredentials(payload.email, payload.password)

      this.logService.logAuth('login.success', {
        userId: user.id,
        userEmail: user.email,
      })

      return user
    } catch {
      this.logService.logAuth('login.failed', {
        userEmail: payload.email,
      })

      throw new InvalidCredentialsException()
    }
  }
}
