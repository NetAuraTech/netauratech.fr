import { type BaseEvent } from '@adonisjs/core/events'
import type User from '#models/auth/user'
import type { TokenType } from '#types/core'
import type { MailService } from '#services/mails/mail_service'
import type { GetPreferencesAction } from '#actions/preferences/get_preferences_action'
import type { TokenRepository } from '#repositories/core/token_repository'
import i18nManager from '@adonisjs/i18n/services/main'
import { generateSplitToken } from '#helpers/core/crypto'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import type { BaseMail } from '@adonisjs/mail'

/**
 * Event payload shape expected by token listeners.
 *
 * All four token events (`UserRegistered`, `ForgotPassword`,
 * `InitiateEmailChange`, `InviteUser`) carry a single `user: User` property.
 */
interface TokenEvent extends BaseEvent {
  user: User
}

/**
 * Abstract base class for token-email listeners.
 *
 * Encapsulates the shared 7-step orchestration flow:
 *   1. Resolve user preferences for locale
 *   2. Expire existing tokens of the same type
 *   3. Generate a split token (`selector`, `validator`) with type-specific TTL
 *   4. Hash the validator portion
 *   5. Persist the token record in the repository
 *   6. Build the mail payload with i18n-translated strings
 *   7. Dispatch the mail via {@link MailService}
 *
 * Subclasses only specify:
 * - {@link tokenType} — token type constant
 * - {@link expiresInHours} — token lifetime in hours
 * - {@link mailClass} — constructor of the mail class to use
 * - {@link buildMailPayload()} — type-specific link/extra payload
 * - {@link getTranslationKeys()} — i18n translation key mappings
 */
export abstract class BaseTokenListener {
  /** Token type constant from {@link TOKEN_TYPES}. */
  protected abstract tokenType: TokenType

  /** Token lifetime in hours. */
  protected abstract expiresInHours: number

  /** Constructor of the mail class to instantiate. */
  protected abstract mailClass: new (payload: any) => BaseMail

  constructor(
    protected mailService: MailService,
    protected getPreferencesAction: GetPreferencesAction,
    protected tokenRepository: TokenRepository
  ) {}

  /** Expose protected parameters for testing. */
  public get getTokenType(): TokenType {
    return this.tokenType
  }

  public get getExpiresInHours(): number {
    return this.expiresInHours
  }

  /**
   * Build the type-specific mail payload extras.
   *
   * Subclasses return an object whose properties are spread into the
   * mail class constructor together with `user` and `translations`.
   * Typically this is a single link property (e.g. `verification_link`).
   *
   * @param event - The original event carrying the user.
   * @param locale - Resolved locale from preferences.
   * @param token - The raw `selector.validator` token string.
   */
  protected abstract buildMailPayload(
    event: TokenEvent,
    locale: string,
    token: string
  ): Record<string, any>

  /**
   * i18n translation keys to resolve for the mail payload.
   *
   * Each entry maps a payload key to its resolved translation string.
   */
  protected abstract getTranslationKeys(
    event: TokenEvent,
    i18n: ReturnType<typeof i18nManager.locale>
  ): Record<string, string>

  /* ------------------------------------------------------------------ */
  /*  Shared orchestration flow                                          */
  /* ------------------------------------------------------------------ */

  async handle(event: TokenEvent): Promise<void> {
    // 1. Resolve preferences for locale
    const preferences = await this.getPreferencesAction.execute({ user: event.user })
    const locale = preferences.locale || 'en'
    const i18n = i18nManager.locale(locale)

    // 2. Expire existing tokens of the same type
    await this.tokenRepository.expireTokensByType(event.user, this.tokenType)

    // 3. Generate split token
    const { selector, validator, token } = generateSplitToken()

    // 4. Hash validator
    const hashedValidator = await hash.make(validator)

    // 5. Create token record in repository
    await this.tokenRepository.create({
      userId: event.user.id,
      type: this.tokenType,
      selector,
      token: hashedValidator,
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: this.expiresInHours }),
    })

    // 6. Build mail payload with i18n translations
    const translations = this.getTranslationKeys(event, i18n)
    const payloadExtras = this.buildMailPayload(event, locale, token)

    const payload = new this.mailClass({
      user: { email: event.user.email, locale },
      translations,
      ...payloadExtras,
    })

    // 7. Send mail
    await this.mailService.send(payload)
  }
}
