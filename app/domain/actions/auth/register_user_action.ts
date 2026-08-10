import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { RegisterPayload } from '#types/auth'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { RoleRepository } from '#repositories/auth/role_repository'
import { withTransaction } from '#shared/utils/with_transaction'
import { extractNameFromEmail, generateUniqueUsername } from '#helpers/auth/username'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import PreferencesRepository from '#repositories/preferences/preferences_repository'
import { Locale } from '#types/preferences'

/**
 * Register a new user account with email, password, and locale.
 *
 * Creates the user record and initializes default preferences atomically within
 * a database transaction. Generates a unique username derived from the email
 * address and assigns the default role if one exists.
 */
@inject()
export class RegisterUserAction {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected preferencesRepository: PreferencesRepository,
    protected roleRepository: RoleRepository
  ) {}

  /**
   * Execute user registration.
   *
   * @param payload - Registration data including email, password, and locale.
   * @returns The newly created {@link User} instance with preferences initialized.
   * @throws {EmailAlreadyExistsException} When the email is already registered.
   */
  async execute(payload: RegisterPayload): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(payload.email)

    if (existingUser) {
      this.logService.logAuth('register.failed.email_exists', {
        userEmail: payload.email,
      })

      throw new EmailAlreadyExistsException(payload.email)
    }

    return withTransaction(async () => {
      const userRole = await this.roleRepository.getUserRole()

      const base = extractNameFromEmail(payload.email)
      const username = await generateUniqueUsername(base, (u) =>
        this.userRepository.exists({ username: u })
      )

      const user = await this.userRepository.create({
        email: payload.email,
        password: payload.password,
        roleId: userRole?.id || null,
        username,
      } as any)

      await this.preferencesRepository.upsert(user, {
        locale: payload.locale as Locale,
        theme: 'light',
      })

      return user
    })
  }
}
