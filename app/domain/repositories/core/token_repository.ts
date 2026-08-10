import { transactionContext } from '#shared/context/transaction_context'
import Token from '#models/core/token'
import { type FindOptions, type FullToken, TOKEN_TYPES, type TokenType } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import User from '#models/auth/user'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import { maskToken } from '#helpers/core/crypto'
import MaxAttemptsExceededException from '#exceptions/core/max_attempts_exceeded_exception'
import { BaseRepository } from '#repositories/base_repository'

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
export class TokenRepository extends BaseRepository {
  /**
   * Maximum verification attempts allowed for any token type.
   */
  readonly MAX_ATTEMPTS = 3

  constructor(protected logService: LogService) {
    super()
  }

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
    return await Token.query(this.client()).where('id', id).first()
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
    let query = Token.query(this.client())

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
    let query = Token.query(this.client())

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
    let query = Token.query(this.client())

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
   * @returns The newly created {@link Token}.
   *
   * @example
   * const token = await tokenRepository.create({ userId, type, selector, token: hashedValidator })
   */
  async create(data: Partial<Token>): Promise<Token> {
    return Token.create(data as any, this.client())
  }

  /**
   * Splits a raw `selector.validator` string into its two components.
   *
   * @param token - The raw token string in `selector.validator` format.
   * @returns An object with `selector` and `validator`, or `null` if the format is invalid.
   */
  #splitToken(token: FullToken): { selector: string; validator: string } | null {
    const parts = token.split('.')
    if (parts.length !== 2) return null
    return { selector: parts[0], validator: parts[1] }
  }

  /**
   * Finds a token record by its plain-text selector and expected type.
   *
   * Does not verify the validator hash — use {@link verify} for that.
   * Returns `null` if no matching record exists or if the token has expired.
   *
   * @param selector - The plain-text selector portion of the token.
   * @param type - The expected token type to filter by.
   * @returns The matching {@link Token}, or `null`.
   */
  async findBySelector(selector: string, type: TokenType): Promise<Token | null> {
    return await Token.query(this.client())
      .where('selector', selector)
      .where('type', type)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()
  }

  /**
   * Verifies the validator portion of a token against its stored hash.
   *
   * Checks attempt count before verifying the token so that a brute-forced
   * token returns `MaxAttemptsExceededException` rather than `InvalidTokenException`.
   *
   * @param token - The raw `selector.validator` token to verify.
   * @param type - The expected token type.
   * @returns `true` if the validator matches, `false` otherwise.
   * @throws {MaxAttemptsExceededException} If the attempt counter has reached
   *   or exceeded the maximum allowed attempts.
   */
  async verify(token: FullToken, type: TokenType): Promise<boolean> {
    const parts = this.#splitToken(token)

    if (!parts) return false

    await this.checkAttempts(token)

    const record = await this.findBySelector(parts.selector, type)
    if (!record) return false

    return hash.verify(record.token, parts.validator)
  }

  /**
   * Increments the attempt counter for a token.
   *
   * Called every time a token is presented for verification, allowing the
   * system to detect brute-force attempts and lock out abusive clients.
   *
   * @param token - The raw `selector.validator` token.
   * @throws {MaxAttemptsExceededException} If the attempt counter has reached
   *   or exceeded the maximum allowed attempts.
   */
  async checkAttempts(token: FullToken): Promise<void> {
    const parts = this.#splitToken(token)

    if (!parts) return

    const record = await Token.query(this.client()).where('selector', parts.selector).first()

    if (!record) return

    if (record.attempts >= this.MAX_ATTEMPTS) {
      throw new MaxAttemptsExceededException()
    }

    record.attempts += 1
    await transactionContext.merge(record)
    await record.save()
  }

  /**
   * Expires a token by setting its `expiresAt` to the current time.
   *
   * Use this instead of deleting when you want to keep an audit trail
   * that the token existed but is no longer valid.
   *
   * @param id - The primary key of the token to expire.
   *
   * @example
   * await tokenRepository.expire(token.id)
   */
  async expire(id: number): Promise<void> {
    const token = await this.findById(id)
    if (!token) return

    token.expiresAt = DateTime.now()
    await transactionContext.merge(token)
    await token.save()
  }

  /**
   * Expires all tokens of a given type for a user.
   *
   * Generic implementation used by {@link BaseTokenListener} and the
   * convenience helpers below. Sets `expiresAt` to now so that an audit
   * trail is preserved — records are not deleted.
   *
   * @param user - The user whose tokens should be expired.
   * @param type - The token type to filter by.
   */
  async expireTokensByType(user: User, type: TokenType): Promise<void> {
    const tokens = await Token.query(this.client()).where('user_id', user.id).where('type', type)

    for (const token of tokens) {
      token.expiresAt = DateTime.now()
      await transactionContext.merge(token)
      await token.save()
    }
  }

  /**
   * @param user - The user whose email verification tokens should be expired.
   *
   * Called after the user's email has been successfully verified, to
   * invalidate any remaining unverified tokens.
   */
  async expireEmailVerificationTokens(user: User): Promise<void> {
    await this.expireTokensByType(user, TOKEN_TYPES.EMAIL_VERIFICATION)
  }

  /**
   * Expires all password reset tokens for a given user.
   * @param user - The user whose password reset tokens should be expired.
   * Called after the user's password has been successfully changed, to
   * invalidate any remaining unverified tokens.
   */
  async expirePasswordResetTokens(user: User): Promise<void> {
    await this.expireTokensByType(user, TOKEN_TYPES.PASSWORD_RESET)
  }

  /**
   * Resolves a token to its associated {@link User}.
   *
   * Delegates verification to {@link verify} so that attempt tracking is
   * always applied before hash comparison. Loads the associated user with
   * role and permissions preloaded. Returns `null` if any step fails — it
   * does not throw.
   *
   * @param token - The raw `selector.validator` token.
   * @param type - The expected token type to filter by.
   * @returns The associated {@link User}, or `null`.
   */
  async getUserFromToken(token: FullToken, type: TokenType): Promise<User | null> {
    const parts = this.#splitToken(token)

    if (!parts) return null

    // Delegate to verify() so attempt tracking is always applied.
    // catch swallows MaxAttemptsExceededException — we return null, not throw.
    try {
      const isValid = await this.verify(token, type)
      if (!isValid) return null
    } catch {
      return null
    }

    const data = await Token.query(this.client())
      .where('selector', parts.selector)
      .where('type', type)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!data || !data.userId) return null

    const user = await User.query(this.client()).where('id', data.userId).first()
    if (!user) return null

    await user.load('role', (query) => {
      query.preload('permissions')
    })

    return user
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
   * Delegates verification to {@link verify} so that attempt tracking is always
   * applied before hash comparison. Unlike the `getUser*` helpers, this method
   * returns the {@link Token} itself rather than the associated user, allowing
   * the caller to inspect token metadata (e.g. invited email, expiration).
   *
   * @param token - The raw `selector.validator` invitation token.
   * @returns The matching {@link Token} if valid and not expired.
   * @throws {InvalidTokenException} If the token is invalid, expired, or not found.
   *
   * @example
   * const token = await tokenRepository.getUserInvitationToken(token)
   */
  async getUserInvitationToken(token: FullToken): Promise<Token> {
    const parts = this.#splitToken(token)

    if (!parts) {
      throw new InvalidTokenException()
    }

    // Delegate to verify() so attempt tracking is always applied.
    try {
      const isValid = await this.verify(token, TOKEN_TYPES.PENDING_INVITE)
      if (!isValid) {
        throw new InvalidTokenException()
      }
    } catch (e) {
      if (e instanceof MaxAttemptsExceededException) throw e
      throw new InvalidTokenException()
    }

    const data = await Token.query(this.client())
      .where('selector', parts.selector)
      .where('type', TOKEN_TYPES.PENDING_INVITE)
      .where('expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!data) {
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
    await Token.query(this.client())
      .where('type', TOKEN_TYPES.PENDING_INVITE)
      .where('user_id', userId)
      .delete()
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

  /**
   * Deletes a token by its primary key.
   *
   * @param id - The primary key of the token to delete.
   * @returns `true` if deleted, `false` if not found.
   */
  async delete(id: number): Promise<boolean> {
    const token = await this.findById(id)

    if (!token) return false

    await token.delete()
    return true
  }

  /**
   * Updates a token by its primary key.
   *
   * @param id - The primary key of the token to update.
   * @param data - Partial {@link Token} fields to merge into the record.
   * @returns The updated {@link Token}, or `null` if not found.
   */
  async update(id: number, data: Partial<Token>): Promise<Token | null> {
    const token = await this.findById(id)

    if (!token) return null

    token.merge(data as any)
    await transactionContext.merge(token)
    await token.save()
    return token
  }

  /**
   * Counts tokens matching the given criteria.
   *
   * @param criteria - Optional map of column/value pairs to filter by.
   * @returns The number of matching records.
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    let query = Token.query(this.client())

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
   */
  async exists(criteria: Record<string, any>): Promise<boolean> {
    const count = await this.count(criteria)
    return count > 0
  }

  /**
   * Deletes all tokens matching the provided criteria.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns The number of deleted records.
   */
  async deleteMany(criteria: Record<string, any>): Promise<number> {
    let query = Token.query(this.client())

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.where(key, value)
    })

    const tokens = await query
    await Promise.all(tokens.map((token) => token.delete()))

    return tokens.length
  }

  /**
   * Increments the attempt counter for a token.
   *
   * @param token - The raw `selector.validator` token.
   */
  async incrementAttempts(token: FullToken): Promise<void> {
    const parts = this.#splitToken(token)
    if (!parts) return

    const data = await Token.query(this.client()).where('selector', parts.selector).first()
    if (!data) return

    data.attempts = (data.attempts || 0) + 1
    await transactionContext.merge(data)
    await data.save()
  }

  /**
   * Expires all email change tokens for a user.
   *
   * @param user - The user whose email change tokens should be expired.
   */
  async expireEmailChangeTokens(user: User): Promise<void> {
    await this.expireTokensByType(user, TOKEN_TYPES.EMAIL_CHANGE)
  }

  /**
   * Expires all invitation tokens for a user.
   *
   * @param user - The user whose invitation tokens should be expired.
   */
  async expireInviteTokens(user: User): Promise<void> {
    await this.expireTokensByType(user, TOKEN_TYPES.PENDING_INVITE)
  }
}
