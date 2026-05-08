import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { RegisterPayload } from '#types/auth'
import { LogService } from '#services/logging/log_service'
import { UserRepository } from '#repositories/auth/user_repository'
import { RoleRepository } from '#repositories/auth/role_repository'
import { extractNameFromEmail, generateUniqueUsername } from '#helpers/auth/username'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import PreferencesRepository from '#repositories/preferences/preferences_repository'
import { Locale } from '#types/preferences'
import InvalidCredentialsException from '#exceptions/auth/invalid_credentials_exception'

/**
 * Handles core credential-based authentication operations: login,
 * registration, and logout.
 *
 * Social authentication is delegated to {@link SocialService}.
 * Password reset and email verification are handled by
 * {@link PasswordService} and {@link EmailVerificationService} respectively.
 */
@inject()
export class AuthService {
  constructor(
    protected logService: LogService,
    protected userRepository: UserRepository,
    protected preferencesRepository: PreferencesRepository,
    protected roleRepository: RoleRepository
  ) {}

  /**
   * Authenticates a user by verifying their email and password.
   *
   * Any error raised by the underlying credential check is intentionally
   * caught and re-thrown as a InvalidCredentialsException to
   * avoid leaking whether the email or the password was wrong.
   *
   * @param email - The user's email address.
   * @param password - The user's plain-text password.
   * @returns The authenticated {@link User}.
   * @throws {InvalidCredentialsException} if the email/password pair is incorrect.
   *
   * @example
   * const user = await authService.login('user@example.com', 'secret')
   */
  async login(email: string, password: string): Promise<User> {
    try {
      const user = await this.userRepository.verifyCredentials(email, password)

      this.logService.logAuth('login.success', {
        userId: user.id,
        userEmail: user.email,
      })

      return user
    } catch (error) {
      this.logService.logAuth('login.failed', {
        userEmail: email,
      })

      throw new InvalidCredentialsException()
    }
  }

  /**
   * Registers a new user with the provided payload.
   *
   * Checks for an existing account with the same email before creating the
   * user, assigning the default user role and deriving a full name from the
   * email address when none is provided.
   *
   * @param payload - The registration data (email, password, locale).
   * @returns The newly created {@link User}.
   * @throws {EmailAlreadyExistsException} if an account with the same email already exists.
   *
   * @example
   * const user = await authService.register({ email, password, locale: 'en' })
   */
  async register(payload: RegisterPayload): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(payload.email)

    if (existingUser) {
      this.logService.logAuth('register.failed.email_exists', {
        userEmail: payload.email,
      })

      throw new EmailAlreadyExistsException(payload.email)
    }

    const userRole = await this.roleRepository.getUserRole()

    const base = extractNameFromEmail(payload.email)
    const username = await generateUniqueUsername(base, (u) =>
      this.userRepository.exists({ username: u })
    )

    const user = await this.userRepository.create({
      email: payload.email,
      password: payload.password,
      roleId: userRole?.id || null,
      username: username,
    } as any)

    await this.preferencesRepository.upsert(user, {
      locale: payload.locale as Locale,
      theme: 'light',
    })

    this.logService.logAuth('register.success', {
      userId: user.id,
      userEmail: user.email,
    })

    return user
  }

  /**
   * Logs out a user by recording the logout event.
   *
   * Session or token invalidation is handled at the controller level —
   * this method is solely responsible for the audit trail.
   *
   * @param userId - The ID of the user to log out.
   *
   * @example
   * await authService.logout(user.id)
   */
  async logout(userId: number): Promise<void> {
    this.logService.logAuth('logout', { userId })
  }
}
