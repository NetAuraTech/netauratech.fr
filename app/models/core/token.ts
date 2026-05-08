import { TokenSchema } from '#database/schema'
import { belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/auth/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { FullToken, TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { splitToken } from '#helpers/core/crypto'

export default class Token extends TokenSchema {
  @belongsTo(() => User)
  declare public user: BelongsTo<typeof User>

  /**
   * Maximum attempts allowed for password reset tokens
   */
  static readonly MAX_RESET_ATTEMPTS = 3

  /**
   * Expire all password reset tokens for a user
   *
   * @param user - The user whose tokens should be expired
   */
  public static async expirePasswordResetTokens(user: User): Promise<void> {
    await this.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .update({ expiresAt: DateTime.now() })
  }

  /**
   * Get user associated with a valid password reset token
   *
   * Verifies:
   * - Token exists (using selector for lookup)
   * - Token matches (hashed validator comparison)
   * - Token is not expired
   * - Token has not exceeded max attempts
   *
   * @param token - Complete token in format "selector.validator"
   * @returns User if token is valid, undefined otherwise
   */
  public static async getPasswordResetUser(token: FullToken): Promise<User | undefined> {
    const parts = splitToken(token)
    if (!parts) {
      return undefined
    }

    const { selector, validator } = parts

    const data = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .preload('user')
      .first()

    if (!data) {
      return undefined
    }

    const matches = await hash.verify(data.token, validator)
    if (!matches) {
      return undefined
    }

    if (data.attempts >= this.MAX_RESET_ATTEMPTS) {
      return undefined
    }

    return data.user
  }

  /**
   * Verify token exists, is not expired, and has not exceeded max attempts
   *
   * @param token - Complete token in format "selector.validator"
   * @returns True if token is valid, false otherwise
   */
  public static async verify(token: FullToken): Promise<boolean> {
    const parts = splitToken(token)
    if (!parts) {
      return false
    }

    const { selector, validator } = parts

    const data = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!data) {
      return false
    }

    const matches = await hash.verify(data.token, validator)
    if (!matches) {
      return false
    }

    return data.attempts < this.MAX_RESET_ATTEMPTS
  }

  /**
   * Increment attempts counter for a token
   *
   * Used to track failed password reset attempts and prevent brute force attacks
   *
   * @param token - Complete token in format "selector.validator"
   */
  public static async incrementAttempts(token: FullToken): Promise<void> {
    const parts = splitToken(token)
    if (!parts) {
      return
    }

    const { selector } = parts

    const data = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!data) {
      return
    }

    data.attempts += 1
    await data.save()
  }

  /**
   * Check if token has exceeded max attempts
   *
   * @param token - Complete token in format "selector.validator"
   * @returns True if attempts exceeded, false otherwise
   */
  public static async hasExceededAttempts(token: FullToken): Promise<boolean> {
    const parts = splitToken(token)
    if (!parts) {
      return false
    }

    const { selector, validator } = parts

    const data = await this.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PASSWORD_RESET)
      .where('expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!data) {
      return false
    }

    const matches = await hash.verify(data.token, validator)
    if (!matches) {
      return false
    }

    return data.attempts >= this.MAX_RESET_ATTEMPTS
  }

  /**
   * Expire all email verification tokens for a user
   *
   * @param user - The user whose tokens should be expired
   */
  static async expireEmailVerificationTokens(user: User): Promise<void> {
    await Token.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .update({ expires_at: DateTime.now() })
  }

  /**
   * Get user associated with a valid email verification token
   *
   * @param token - Complete token in format "selector.validator"
   * @returns User if token is valid, undefined otherwise
   */
  static async getEmailVerificationUser(token: FullToken): Promise<User | undefined> {
    const parts = splitToken(token)
    if (!parts) {
      return undefined
    }

    const { selector, validator } = parts

    const data = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.EMAIL_VERIFICATION)
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!data) {
      return undefined
    }

    const isValid = await hash.verify(data.token, validator)
    if (!isValid) {
      return undefined
    }

    return data.user
  }

  /**
   * Expire all email change tokens for a user
   *
   * @param user - The user whose tokens should be expired
   */
  static async expireEmailChangeTokens(user: User): Promise<void> {
    await Token.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .update({ expires_at: DateTime.now() })
  }

  /**
   * Get user associated with a valid email change token
   *
   * @param token - Complete token in format "selector.validator"
   * @returns User if token is valid, undefined otherwise
   */
  static async getEmailChangeUser(token: FullToken): Promise<User | undefined> {
    const parts = splitToken(token)
    if (!parts) {
      return undefined
    }

    const { selector, validator } = parts

    const data = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.EMAIL_CHANGE)
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()

    if (!data) {
      return undefined
    }

    const isValid = await hash.verify(data.token, validator)
    if (!isValid) {
      return undefined
    }

    return data.user
  }

  /**
   * Get invitation token (uses selector for unique identification)
   *
   * @param token - Complete token in format "selector.validator"
   * @returns Token if valid, null otherwise
   */
  static async getUserInvitationToken(token: FullToken): Promise<Token | null> {
    const parts = splitToken(token)
    if (!parts) {
      return null
    }

    const { selector, validator } = parts

    const data = await Token.query()
      .where('selector', selector)
      .where('type', TOKEN_TYPES.PENDING_INVITE)
      .where('expires_at', '>', DateTime.now().toSQL())
      .whereNotNull('user_id')
      .first()

    if (!data) {
      return null
    }

    const isValid = await hash.verify(data.token, validator)
    if (!isValid) {
      return null
    }

    return data
  }

  /**
   * Expire all invite tokens for a user
   *
   * @param user - The user whose invite tokens should be expired
   */
  public static async expireInviteTokens(user: User): Promise<void> {
    await this.query()
      .where('user_id', user.id)
      .where('type', TOKEN_TYPES.PENDING_INVITE)
      .update({ expiresAt: DateTime.now() })
  }
}
