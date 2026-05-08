import Token from '#models/core/token'
import { type FindOptions, type FullToken, TOKEN_TYPES, type TokenType } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import type User from '#models/auth/user'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import { maskToken } from '#helpers/core/crypto'
import MaxAttemptsExceededException from '#exceptions/core/max_attempts_exceeded_exception'

/**
 * Handles all database operations for the {@link Token} model.
 *
 * Tokens follow the **selector/validator pattern**: the selector is stored
 * in plain text for fast database lookup, while the validator is hashed so
 * that a database leak does not expose usable tokens.
 *
 * This repository is the single source of truth for all token lifecycle
 * operations: creation, verification, attempt tracking, and expiration —
 * across every token type (`EMAIL_VERIFICATION`, `PASSWORD_RESET`,
 * `EMAIL_CHANGE`, `PENDING_INVITE`).
 *
 * **Conventions:**
 * - Low-level methods (`getUserFromToken`, `findBySelector`, `verify`) return
 *   `null` or `boolean` — they are internal utilities and do not throw.
 * - High-level public methods (`getEmailVerificationUser`, `getPasswordResetUser`,
 *   `getEmailChangeUser`, `getUserInvitationToken`) throw {@link InvalidTokenException}
 *   so that callers never need to handle a `null` return.
 */
@inject()
export class TokenRepository {
  constructor(protected logService: LogService) {}

  /**
   * Finds a token by its primary key.
   *
   * @param id - The token's primary key.
   * @returns The matching {@link Token}, or `null` if not found.
   *
   * @example
   * const token = await tokenRepository.findById(1)
   */
  async findById(id: number): Promise<Token | null> {
    return await Token.find(id)
  }

  /**
   * Returns all tokens, with optional sorting and pagination.
   *
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of {@link Token} records.
   *
   * @example
   * const tokens = await tokenRepository.findAll({ orderBy: 'createdAt', limit: 50 })
   */
  async findAll(options?: FindOptions): Promise<Token[]> {
    let query = Token.query()

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc')
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    return await query
  }

  /**
   * Finds the first token matching all provided criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns The first matching {@link Token}, or `null` if none found.
   *
   * @example
   * const token = await tokenRepository.findOne({ userId: 1, type: TOKEN_TYPES.PASSWORD_RESET })
   */
  async findOne(criteria: Record<string, any>): Promise<Token | null> {
    let query = Token.query()

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.where(key, value)
    })

    return await query.first()
  }

  /**
   * Returns all tokens matching the provided criteria, with optional sorting
   * and pagination.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of matching {@link Token} records.
   *
   * @example
   * const tokens = await tokenRepository.findMany({ userId: 1 }, { orderBy: 'expiresAt' })
   */
  async findMany(criteria: Record<string, any>, options?: FindOptions): Promise<Token[]> {
    let query = Token.query()

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.where(key, value)
    })

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc')
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    return await query
  }

  /**
   * Creates and persists a new token.
   *
   * The `token` field should contain the **hashed** validator — plain-text
   * validators must be hashed by the caller before being passed here.
   *
   * @param data - The token data to persist.
   * @param data.userId - The ID of the user this token belongs to.
   * @param data.type - The token type (see {@link TOKEN_TYPES}).
   * @param data.selector - The plain-text selector used for fast lookup.
   * @param data.token - The **hashed** validator.
   * @param data.expiresAt - The expiration datetime.
   * @param data.attempts - Optional initial attempt count (defaults to `0`).
   * @returns The newly created {@link Token}.
   *
   * @example
   * const token = await tokenRepository.create({
   *   userId: user.id,
   *   type: TOKEN_TYPES.PASSWORD_RESET,
   *   selector,
   *   token: hashedValidator,
   *   expiresAt: DateTime.now().plus({ hours: 1 }),
   * })
   */
  async create(data: {
    userId: number
    type: TokenType
    selector: string
    token: string
    expiresAt: DateTime
    attempts?: number
  }): Promise<Token> {
    return await Token.create(data)
  }

  /**
   * Updates a token by its primary key.
   *
   * @param id - The primary key of the token to update.
   * @param data - Partial {@link Token} fields to merge into the record.
   * @returns The updated {@link Token}, or `null` if no record was found.
   *
   * @example
   * const updated = await tokenRepository.update(1, { attempts: 2 })
   */
  async update(id: number, data: Partial<Token>): Promise<Token | null> {
    const token = await this.findById(id)

    if (!token) {
      return null
    }

    token.merge(data as any)
    await token.save()

    return token
  }

  /**
   * Deletes a token by its primary key.
   *
   * @param id - The primary key of the token to delete.
   * @returns `true` if the record was deleted, `false` if it was not found.
   *
   * @example
   * const deleted = await tokenRepository.delete(1)
   */
  async delete(id: number): Promise<boolean> {
    const token = await this.findById(id)

    if (!token) {
      return false
    }

    await token.delete()
    return true
  }

  /**
   * Deletes all tokens matching the provided criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   * Records are fetched first and deleted individually to trigger any
   * model-level hooks.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns The number of deleted records.
   *
   * @example
   * const count = await tokenRepository.deleteMany({ userId: 1, type: TOKEN_TYPES.PASSWORD_RESET })
   */
  async deleteMany(criteria: Record<string, any>): Promise<number> {
    let query = Token.query()

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.where(key, value)
    })

    const tokens = await query
    await Promise.all(tokens.map((token) => token.delete()))

    return tokens.length
  }

  /**
   * Counts tokens matching the given criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   * Omitting `criteria` returns the total count of all tokens.
   *
   * @param criteria - Optional map of column/value pairs to filter by.
   * @returns The number of matching records.
   *
   * @example
   * const total = await tokenRepository.count()
   * const userTokens = await tokenRepository.count({ userId: 1 })
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    let query = Token.query()

    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.where(key, value)
      })
    }

    const result = await query.count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Checks whether at least one token matches the given criteria.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns `true` if at least one matching record exists, `false` otherwise.
   *
   * @example
   * const hasActive = await tokenRepository.exists({ userId: 1, type: TOKEN_TYPES.EMAIL_VERIFICATION })
   */
  async exists(criteria: Record<string, any>): Promise<boolean> {
    const count = await this.count(criteria)
    return count > 0
  }

  /**
   * Splits a raw `selector.validator` token string into its two components.
   *
   * Internal utility — returns `null` on malformed input without throwing,
   * so that callers can decide how to handle the failure.
   *
   * @param token - The raw token string in `selector.validator` format.
   * @returns An object with `selector` and `validator` strings, or `null` if
   *   the format is invalid.
   */
  private splitToken(token: FullToken): { selector: string; validator: string } | null {
    const parts = token.split('.')
    if (parts.length !== 2) {
      return null
    }
    return {
      selector: parts[0],
      validator: parts[1],
    }
  }

  /**
   * Finds a non-expired token by its plain-text selector and type.
   *
   * Internal utility — returns `null` rather than throwing so that
   * higher-level methods can compose it freely.
   *
   * @param selector - The plain-text selector to look up.
   * @param type - The token type to filter by.
   * @returns The matching {@link Token} if found and not expired, `null` otherwise.
   *
   * @example
   * const token = await tokenRepository.findBySelector('abc123', TOKEN_TYPES.PASSWORD_RESET)
   */
  async findBySelector(selector: string, type: string): Promise<Token | null> {
    return await Token.query()
      .where('selector', selector)
      .where('type', type)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()
  }

  /**
   * Verifies a raw `selector.validator` token against its stored hash.
   *
   * Internal utility — returns `false` rather than throwing so that
   * higher-level methods can compose it freely.
   *
   * @param token - The raw `selector.validator` token to verify.
   * @param type - The expected token type.
   * @returns `true` if the token is valid and not expired, `false` otherwise.
   *
   * @example
   * const isValid = await tokenRepository.verify(token, TOKEN_TYPES.EMAIL_VERIFICATION)
   */
  async verify(token: FullToken, type: string): Promise<boolean> {
    const parts = this.splitToken(token)
    if (!parts) {
      return false
    }

    const data = await this.findBySelector(parts.selector, type)
    if (!data) {
      return false
    }

    return await hash.verify(data.token, parts.validator)
  }

  /**
   * Resolves a raw token to its associated {@link User}.
   *
   * Internal utility — returns `null` rather than throwing so that
   * higher-level methods can compose it freely.
   *
   * @param token - The raw `selector.validator` token.
   * @param type - The expected token type.
   * @returns The associated {@link User}, or `null` if the token is invalid.
   *
   * @example
   * const user = await tokenRepository.getUserFromToken(token, TOKEN_TYPES.PASSWORD_RESET)
   */
  async getUserFromToken(token: FullToken, type: string): Promise<User | null> {
    const parts = this.splitToken(token)
    if (!parts) {
      return null
    }

    const data = await this.findBySelector(parts.selector, type)
    if (!data) {
      return null
    }

    const isValid = await hash.verify(data.token, parts.validator)
    if (!isValid) {
      return null
    }

    await data.load('user')
    return data.user || null
  }

  /**
   * Increments the attempt counter on the token identified by the given selector.
   *
   * The attempt counter is used to enforce brute-force protection on token
   * verification endpoints. This method is a no-op if the token cannot be found.
   *
   * @param token - The raw `selector.validator` token whose attempt count should
   *   be incremented.
   *
   * @example
   * await tokenRepository.incrementAttempts(token)
   */
  async incrementAttempts(token: FullToken): Promise<void> {
    const parts = this.splitToken(token)
    if (!parts) {
      return
    }

    const data = await Token.query().where('selector', parts.selector).first()

    if (data) {
      data.attempts = (data.attempts || 0) + 1
      await data.save()
    }
  }

  /**
   * Checks whether the attempt counter on a token has reached or exceeded the
   * maximum allowed number of verification attempts, throwing if so.
   *
   * This method is a no-op if the token cannot be parsed or found — in those
   * cases the caller should rely on {@link verify} or the `getUser*` methods
   * to surface the invalid token.
   *
   * @param token - The raw `selector.validator` token to check.
   * @param maxAttempts - Maximum number of allowed attempts (default: `3`).
   * @throws {MaxAttemptsExceededException} If the attempt counter has reached
   *   or exceeded `maxAttempts`.
   *
   * @example
   * await tokenRepository.checkAttempts(token)
   * // throws automatically if limit reached, no-op otherwise
   */
  async checkAttempts(token: FullToken, maxAttempts: number = 3): Promise<void> {
    const parts = this.splitToken(token)
    if (!parts) {
      return
    }

    const data = await Token.query().where('selector', parts.selector).first()

    if (!data) {
      return
    }

    if ((data.attempts || 0) >= maxAttempts) {
      this.logService.logSecurity('Password reset token exceeded max attempts', {
        token: maskToken(token),
      })

      throw new MaxAttemptsExceededException()
    }
  }

  /**
   * Immediately expires all active tokens of a given type for a user by
   * setting their `expiresAt` to the current timestamp.
   *
   * Only tokens that have not already expired are affected.
   *
   * @param userId - The primary key of the user whose tokens should be expired.
   * @param type - The token type to expire (see {@link TOKEN_TYPES}).
   *
   * @example
   * await tokenRepository.expireTokensByType(user.id, TOKEN_TYPES.PASSWORD_RESET)
   */
  async expireTokensByType(userId: number, type: string): Promise<void> {
    await Token.query()
      .where('type', type)
      .where('user_id', userId)
      .where('expires_at', '>', DateTime.now().toSQL())
      .update({
        expires_at: DateTime.now().toSQL(),
      })
  }

  /**
   * Expires all active email verification tokens for a user.
   *
   * Typically called after the user's email has been successfully verified.
   *
   * @param user - The user whose email verification tokens should be expired.
   *
   * @example
   * await tokenRepository.expireEmailVerificationTokens(user)
   */
  async expireEmailVerificationTokens(user: User): Promise<void> {
    await this.expireTokensByType(user.id, TOKEN_TYPES.EMAIL_VERIFICATION)
  }

  /**
   * Expires all active password reset tokens for a user.
   *
   * Typically called after the user's password has been successfully reset.
   *
   * @param user - The user whose password reset tokens should be expired.
   *
   * @example
   * await tokenRepository.expirePasswordResetTokens(user)
   */
  async expirePasswordResetTokens(user: User): Promise<void> {
    await this.expireTokensByType(user.id, TOKEN_TYPES.PASSWORD_RESET)
  }

  /**
   * Expires all active email change tokens for a user.
   *
   * Typically called after the email change has been confirmed or cancelled.
   *
   * @param user - The user whose email change tokens should be expired.
   *
   * @example
   * await tokenRepository.expireEmailChangeTokens(user)
   */
  async expireEmailChangeTokens(user: User): Promise<void> {
    await this.expireTokensByType(user.id, TOKEN_TYPES.EMAIL_CHANGE)
  }

  /**
   * Expires all active invitation tokens for a user.
   *
   * Typically called after the user has accepted their invitation.
   *
   * @param user - The user whose invitation tokens should be expired.
   *
   * @example
   * await tokenRepository.expireInviteTokens(user)
   */
  async expireInviteTokens(user: User): Promise<void> {
    await this.expireTokensByType(user.id, TOKEN_TYPES.PENDING_INVITE)
  }

  /**
   * Resolves an email verification token to its associated {@link User}.
   *
   * Convenience wrapper around {@link getUserFromToken} scoped to the
   * `EMAIL_VERIFICATION` token type.
   *
   * @param token - The raw `selector.validator` token from the verification link.
   * @returns The associated {@link User}.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   *
   * @example
   * const user = await tokenRepository.getEmailVerificationUser(token)
   */
  async getEmailVerificationUser(token: FullToken): Promise<User> {
    const user = await this.getUserFromToken(token, TOKEN_TYPES.EMAIL_VERIFICATION)

    if (!user) {
      this.logService.logAuth('core.token.invalid', {})
      throw new InvalidTokenException()
    }

    return user
  }

  /**
   * Resolves a password reset token to its associated {@link User}.
   *
   * Convenience wrapper around {@link getUserFromToken} scoped to the
   * `PASSWORD_RESET` token type.
   *
   * @param token - The raw `selector.validator` token from the reset link.
   * @returns The associated {@link User}.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   *
   * @example
   * const user = await tokenRepository.getPasswordResetUser(token)
   */
  async getPasswordResetUser(token: FullToken): Promise<User> {
    const user = await this.getUserFromToken(token, TOKEN_TYPES.PASSWORD_RESET)

    if (!user) {
      this.logService.logAuth('Failed password reset - invalid token', {
        token: maskToken(token),
      })

      throw new InvalidTokenException()
    }

    return user
  }

  /**
   * Resolves an email change token to its associated {@link User}.
   *
   * Convenience wrapper around {@link getUserFromToken} scoped to the
   * `EMAIL_CHANGE` token type.
   *
   * @param token - The raw `selector.validator` token from the confirmation link.
   * @returns The associated {@link User}.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   *
   * @example
   * const user = await tokenRepository.getEmailChangeUser(token)
   */
  async getEmailChangeUser(token: FullToken): Promise<User> {
    const user = await this.getUserFromToken(token, TOKEN_TYPES.EMAIL_CHANGE)

    if (!user || !user.pendingEmail) {
      this.logService.logAuth('core.token.invalid', {})

      throw new InvalidTokenException()
    }

    return user
  }

  /**
   * Retrieves a valid invitation token record by its raw `selector.validator` string.
   *
   * Unlike the `getUser*` helpers, this method returns the {@link Token} itself
   * rather than the associated user, allowing the caller to inspect token metadata
   * (e.g. invited email, expiration) before loading the user.
   *
   * @param token - The raw `selector.validator` invitation token.
   * @returns The matching {@link Token} if valid and not expired.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   *
   * @example
   * const token = await tokenRepository.getUserInvitationToken(token)
   */
  async getUserInvitationToken(token: FullToken): Promise<Token> {
    const parts = this.splitToken(token)

    if (!parts) {
      throw new InvalidTokenException()
    }

    const data = await Token.query()
      .where('selector', parts.selector)
      .where('type', TOKEN_TYPES.PENDING_INVITE)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!data) {
      throw new InvalidTokenException()
    }

    const isValid = await hash.verify(data.token, parts.validator)

    if (!isValid) {
      throw new InvalidTokenException()
    }

    await data.load('user', (query) => {
      query.preload('role', (q) => {
        q.preload('permissions')
      })
    })

    return data
  }

  /**
   * Permanently deletes all invitation tokens for a given user.
   *
   * Unlike the `expire*` helpers which set `expiresAt` to now, this method
   * removes the records entirely. Typically called after the invitation has
   * been accepted or revoked.
   *
   * @param userId - The primary key of the user whose invitation tokens should
   *   be deleted.
   *
   * @example
   * await tokenRepository.deleteInvitationTokens(user.id)
   */
  async deleteInvitationTokens(userId: number): Promise<void> {
    await Token.query().where('type', TOKEN_TYPES.PENDING_INVITE).where('user_id', userId).delete()
  }

  /**
   * Verifies a password reset token against its stored hash.
   *
   * Checks attempt count before verifying the token so that a brute-forced
   * token returns `MaxAttemptsExceededException` rather than `InvalidTokenException`.
   *
   * Convenience wrapper around {@link checkAttempts} and {@link verify},
   * both scoped to the `PASSWORD_RESET` token type.
   *
   * @param token - The raw `selector.validator` token to verify.
   * @throws {MaxAttemptsExceededException} If the attempt counter has reached
   *   or exceeded the maximum allowed attempts.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   *
   * @example
   * await tokenRepository.verifyPasswordResetToken(token)
   */
  async verifyPasswordResetToken(token: FullToken): Promise<void> {
    const isValid = await this.verify(token, TOKEN_TYPES.PASSWORD_RESET)

    if (!isValid) {
      this.logService.logAuth('Invalid or expired password reset token', {
        token: maskToken(token),
      })

      throw new InvalidTokenException()
    }

    await this.checkAttempts(token)
  }
}
