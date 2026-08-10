import { transactionContext } from '#shared/context/transaction_context'
import User from '#models/auth/user'
import { type AccessToken } from '@adonisjs/auth/access_tokens'
import { type OAuthProvider } from '#types/auth'
import { type FindOptions } from '#types/core'
import { BaseRepository } from '#repositories/base_repository'

/**
 * Handles all database operations for the {@link User} model.
 *
 * Every method is a thin, focused wrapper around Lucid ORM queries so that
 * callers never interact with the ORM directly, making the data layer easy
 * to test and swap.
 */
export class UserRepository extends BaseRepository {
  /**
   * Finds a user by their primary key.
   *
   * @param id - The user's primary key.
   * @returns The matching {@link User}, or `null` if not found.
   *
   * @example
   * const user = await userRepository.findById(1)
   */
  async findById(id: number): Promise<User | null> {
    return await User.query(this.client()).where('id', id).first()
  }

  /**
   * Returns all users, with optional sorting and pagination.
   *
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of {@link User} records.
   *
   * @example
   * const users = await userRepository.findAll({ orderBy: 'email', limit: 20 })
   */
  async findAll(options?: FindOptions): Promise<User[]> {
    let query = User.query(this.client())

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
   * Finds the first user matching all provided criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns The first matching {@link User}, or `null` if none found.
   *
   * @example
   * const user = await userRepository.findOne({ emailVerifiedAt: null })
   */
  async findOne(criteria: Record<string, any>): Promise<User | null> {
    let query = User.query(this.client())

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.where(key, value)
    })

    return await query.first()
  }

  /**
   * Returns all users matching the provided criteria, with optional sorting
   * and pagination.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of matching {@link User} records.
   *
   * @example
   * const users = await userRepository.findMany({ roleId: 1 }, { orderBy: 'email' })
   */
  async findMany(criteria: Record<string, any>, options?: FindOptions): Promise<User[]> {
    let query = User.query(this.client())

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
   * Finds a user by their email address.
   *
   * @param email - The email address to look up.
   * @returns The matching {@link User}, or `null` if not found.
   *
   * @example
   * const user = await userRepository.findByEmail('user@example.com')
   */
  async findByEmail(email: string): Promise<User | null> {
    return await User.query(this.client()).where('email', email).first()
  }

  /**
   * Finds a user by their OAuth provider ID.
   *
   * The provider name is mapped to the corresponding model column
   * (e.g. `'github'` to `githubId`).
   *
   * @param provider - The OAuth provider to search against.
   * @param providerId - The provider-issued user ID.
   * @returns The matching {@link User}, or `null` if not found.
   *
   * @example
   * const user = await userRepository.findByProviderId('github', '12345')
   */
  async findByProviderId(provider: OAuthProvider, providerId: string): Promise<User | null> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'
    return await User.query(this.client()).where(providerIdColumn, providerId).first()
  }

  /**
   * Finds a user matched by OAuth provider ID while excluding a specific user.
   *
   * Used during provider linking to detect whether the OAuth identity is
   * already associated with a **different** account, which would indicate
   * a potential account conflict.
   *
   * @param provider - The OAuth provider to search against.
   * @param providerId - The provider-issued user ID.
   * @param excludeUserId - The user ID to exclude from the search.
   * @returns The matching {@link User}, or `null` if not found.
   *
   * @example
   * const conflict = await userRepository.findByProviderIdExcluding(
   *   'github', '12345', currentUser.id
   * )
   */
  async findByProviderIdExcluding(
    provider: OAuthProvider,
    providerId: string,
    excludeUserId: number
  ): Promise<User | null> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'
    return await User.query(this.client())
      .where(providerIdColumn, providerId)
      .whereNot('id', excludeUserId)
      .first()
  }

  /**
   * Verifies a user email and password combination.
   *
   * Delegates to Lucid built-in credential verification, which handles
   * secure password comparison and throws on mismatch.
   *
   * @param email - The user email address.
   * @param password - The plain-text password.
   * @returns The authenticated {@link User}.
   * @throws {Exception} If the credentials are invalid.
   *
   * @example
   * const user = await userRepository.verifyCredentials('user@example.com', 'secret')
   */
  async verifyCredentials(email: string, password: string): Promise<User> {
    return await User.verifyCredentials(email, password)
  }

  /**
   * Creates an opaque access token for the `api` auth guard.
   *
   * The default expiry comes from the provider configuration on the
   * {@link User} model (`AUTH_API_TOKEN_EXPIRY`).
   *
   * @param user - The {@link User} the token authenticates.
   * @returns The freshly created {@link AccessToken}; the plain-text secret
   * is only available once via `token.value.release()`.
   *
   * @example
   * const token = await userRepository.createAccessToken(user)
   */
  async createAccessToken(user: User): Promise<AccessToken> {
    return await User.accessTokens.create(user)
  }

  /**
   * Revokes an access token owned by the given user.
   *
   * @param user - The {@link User} that owns the token.
   * @param identifier - The token identifier to delete (its database id).
   * @returns The number of deleted token rows.
   *
   * @example
   * await userRepository.deleteAccessToken(user, user.currentAccessToken.identifier)
   */
  async deleteAccessToken(user: User, identifier: string | number | BigInt): Promise<number> {
    return await User.accessTokens.delete(user, identifier)
  }

  /**
   * Creates and persists a new user.
   *
   * @param data - Partial {@link User} fields to populate the new record.
   * @returns The newly created {@link User}.
   *
   * @example
   * const user = await userRepository.create({ email: 'user@example.com', password: 'secret' })
   */
  async create(data: Partial<User>): Promise<User> {
    return User.create(data as any, this.client())
  }

  /**
   * Updates a user instance with partial data.
   *
   * @param user - The {@link User} instance to update.
   * @param data - Partial {@link User} fields to merge into the record.
   * @returns The updated {@link User}.
   *
   * @example
   * const updated = await userRepository.update(user, { username: 'johndoe' })
   */
  async update(user: User, data: Partial<User>): Promise<User> {
    user.merge(data as any)
    await transactionContext.merge(user)
    await user.save()
    return user
  }

  /**
   * Persists an already-mutated user instance.
   *
   * Use this when you have modified multiple fields on a user object
   * directly and want to flush all changes in a single save call.
   *
   * @param user - The {@link User} instance to persist.
   * @returns The saved {@link User}.
   *
   * @example
   * user.username = 'newName'
   * await userRepository.save(user)
   */
  async save(user: User): Promise<User> {
    await transactionContext.merge(user)
    await user.save()
    return user
  }

  /**
   * Deletes a user by their primary key.
   *
   * @param id - The primary key of the user to delete.
   * @returns `true` if the record was deleted, `false` if it was not found.
   *
   * @example
   * const deleted = await userRepository.delete(1)
   */
  async delete(id: number): Promise<boolean> {
    const user = await this.findById(id)

    if (!user) return false

    await user.delete()
    return true
  }

  /**
   * Counts users matching the given criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   * Omitting `criteria` returns the total count of all users.
   *
   * @param criteria - Optional map of column/value pairs to filter by.
   * @returns The number of matching records.
   *
   * @example
   * const total = await userRepository.count()
   * const recent = await userRepository.count({ createdAt: { operator: '>=', value: lastWeek } })
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    let query = User.query(this.client())

    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        if (
          value !== null &&
          typeof value === 'object' &&
          'operator' in value &&
          'value' in value
        ) {
          query = query.where(key, value.operator, value.value)
        } else {
          query = query.where(key, value)
        }
      })
    }

    const result = await query.count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Counts users grouped by role with a single aggregate query.
   *
   * Users without a role fall into a `null` bucket. Buckets are sorted by
   * descending count (ties broken by role name), with the `null` bucket
   * always last.
   *
   * @returns One entry per role: the role name (`null` for users holding no
   * role) and the number of users holding it.
   *
   * @example
   * const breakdown = await userRepository.countByRole()
   * // [{ name: 'editor', count: 5 }, { name: 'admin', count: 2 }, { name: null, count: 1 }]
   */
  async countByRole(): Promise<{ name: string | null; count: number }[]> {
    const rows = await User.query(this.client())
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select('roles.name as role_name')
      .count('users.id as total')
      .groupBy('roles.name')

    return rows
      .map((row) => ({
        name: row.$extras.role_name as string | null,
        count: Number(row.$extras.total),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        if (a.name === null) return 1
        if (b.name === null) return -1
        return a.name.localeCompare(b.name)
      })
  }

  /**
   * Checks whether at least one user matches the given criteria.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns `true` if at least one matching record exists, `false` otherwise.
   *
   * @example
   * const taken = await userRepository.exists({ email: 'user@example.com' })
   */
  async exists(criteria: Record<string, any>): Promise<boolean> {
    const count = await this.count(criteria)
    return count > 0
  }

  /**
   * Checks whether an account with the given email address already exists.
   *
   * Useful for uniqueness validation before registration or email change.
   *
   * @param email - The email address to check.
   * @returns `true` if an account with that email exists, `false` otherwise.
   *
   * @example
   * if (await userRepository.emailExists('user@example.com')) {
   *   throw new Exception('Email already taken')
   * }
   */
  async emailExists(email: string): Promise<boolean> {
    return await this.exists({ email })
  }

  /**
   * Finds a user by their primary key, throwing if not found.
   *
   * @param id - The user's primary key.
   * @returns The matching {@link User}.
   * @throws {Exception} With code `E_ROW_NOT_FOUND` if no record exists for `id`.
   *
   * @example
   * const user = await userRepository.findByIdOrFail(1)
   */
  async findByIdOrFail(id: number): Promise<User> {
    return await User.query(this.client()).where('id', id).firstOrFail()
  }

  /**
   * Marks a user's email as verified by setting `emailVerifiedAt` to now.
   *
   * @param user - The user whose email should be marked as verified.
   * @returns The updated {@link User}.
   *
   * @example
   * await userRepository.markEmailAsVerified(user)
   */
  async markEmailAsVerified(user: User): Promise<User> {
    const { DateTime } = await import('luxon')
    await transactionContext.merge(user)
    user.emailVerifiedAt = DateTime.now()
    await user.save()
    return user
  }

  /**
   * Updates a user's password.
   *
   * The plain-text password is assigned directly to the model - hashing
   * is expected to be handled by a Lucid `beforeSave` hook on the model.
   *
   * @param user - The user whose password should be updated.
   * @param password - The new plain-text password.
   * @returns The updated {@link User}.
   *
   * @example
   * await userRepository.updatePassword(user, 'newSecret123')
   */
  async updatePassword(user: User, password: string): Promise<User> {
    await transactionContext.merge(user)
    user.password = password
    await user.save()
    return user
  }

  /**
   * Associates an OAuth provider identity with a user.
   *
   * The provider name is mapped to the corresponding model column
   * (e.g. `'github'` to `githubId`) and the provider ID is stored there.
   *
   * @param user - The user to link the provider to.
   * @param provider - The OAuth provider to link.
   * @param providerId - The provider-issued user ID to store.
   * @returns The updated {@link User}.
   *
   * @example
   * await userRepository.linkProvider(user, 'github', '12345')
   */
  async linkProvider(user: User, provider: OAuthProvider, providerId: string): Promise<User> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'
    await transactionContext.merge(user)
    user[providerIdColumn] = providerId
    await user.save()
    return user
  }

  /**
   * Removes the association between a user and an OAuth provider.
   *
   * Sets the corresponding provider ID column to `null`. After unlinking,
   * the user can no longer sign in via that provider unless they go through
   * the OAuth flow again.
   *
   * @param user - The user to unlink the provider from.
   * @param provider - The OAuth provider to unlink.
   * @returns The updated {@link User}.
   *
   * @example
   * await userRepository.unlinkProvider(user, 'facebook')
   */
  async unlinkProvider(user: User, provider: OAuthProvider): Promise<User> {
    const providerIdColumn = `${provider}Id` as 'githubId' | 'googleId' | 'facebookId'
    await transactionContext.merge(user)
    user[providerIdColumn] = null
    await user.save()
    return user
  }

  /**
   * Reassigns every user holding a role to another role.
   *
   * Typically used before deleting a custom role so that no user is left
   * without a role. Runs inside the ambient transaction when one exists.
   *
   * @param fromRoleId - The role users are moved away from.
   * @param toRoleId - The fallback role users are moved to.
   * @returns The number of reassigned users.
   *
   * @example
   * const moved = await userRepository.reassignRole(customRole.id, fallbackRole.id)
   */
  async reassignRole(fromRoleId: number, toRoleId: number): Promise<number> {
    const affected = await User.query(this.client())
      .where('role_id', fromRoleId)
      .update({ role_id: toRoleId })

    return Number(affected)
  }
}
