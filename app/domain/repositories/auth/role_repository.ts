import Role from '#models/auth/role'
import { type FindOptions } from '#types/core'

/**
 * Handles all database operations for the {@link Role} model.
 *
 * Every method is a thin, focused wrapper around Lucid ORM queries so that
 * callers never interact with the ORM directly, making the data layer easy
 * to test and swap.
 */
export class RoleRepository {
  /**
   * Finds a role by its primary key.
   *
   * @param id - The role's primary key.
   * @returns The matching {@link Role}, or `null` if not found.
   *
   * @example
   * const role = await roleRepository.findById(1)
   */
  async findById(id: number): Promise<Role | null> {
    return await Role.find(id)
  }

  /**
   * Returns all roles, with optional sorting and pagination.
   *
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of {@link Role} records.
   *
   * @example
   * const roles = await roleRepository.findAll({ orderBy: 'name', limit: 10 })
   */
  async findAll(options?: FindOptions): Promise<Role[]> {
    let query = Role.query()

    if (options?.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc')
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.offset(options.offset)
    }

    return query
  }

  /**
   * Finds the first role matching all provided criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns The first matching {@link Role}, or `null` if none found.
   *
   * @example
   * const role = await roleRepository.findOne({ isSystem: true })
   */
  async findOne(criteria: Record<string, any>): Promise<Role | null> {
    let query = Role.query()

    Object.entries(criteria).forEach(([key, value]) => {
      query = query.where(key, value)
    })

    return await query.first()
  }

  /**
   * Returns all roles matching the provided criteria, with optional sorting
   * and pagination.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of matching {@link Role} records.
   *
   * @example
   * const roles = await roleRepository.findMany({ isSystem: false }, { orderBy: 'name' })
   */
  async findMany(criteria: Record<string, any>, options?: FindOptions): Promise<Role[]> {
    let query = Role.query()

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

    return query
  }

  /**
   * Finds a role by its unique slug.
   *
   * @param slug - The role slug to look up.
   * @returns The matching {@link Role}, or `null` if not found.
   *
   * @example
   * const role = await roleRepository.findBySlug('admin')
   */
  async findBySlug(slug: string): Promise<Role | null> {
    return await Role.findBy('slug', slug)
  }

  /**
   * Finds a role by its unique name.
   *
   * @param name - The role name to look up.
   * @returns The matching {@link Role}, or `null` if not found.
   *
   * @example
   * const role = await roleRepository.findByName('Administrator')
   */
  async findByName(name: string): Promise<Role | null> {
    return await Role.findBy('name', name)
  }

  /**
   * Creates and persists a new role.
   *
   * @param data - Partial {@link Role} fields to populate the new record.
   * @returns The newly created {@link Role}.
   *
   * @example
   * const role = await roleRepository.create({ name: 'Editor', slug: 'editor' })
   */
  async create(data: Partial<Role>): Promise<Role> {
    return await Role.create(data as any)
  }

  /**
   * Updates a role by its primary key.
   *
   * @param id - The primary key of the role to update.
   * @param data - Partial {@link Role} fields to merge into the record.
   * @returns The updated {@link Role}, or `null` if no record was found.
   *
   * @example
   * const updated = await roleRepository.update(1, { name: 'Super Admin' })
   */
  async update(id: number, data: Partial<Role>): Promise<Role | null> {
    const role = await this.findById(id)

    if (!role) {
      return null
    }

    role.merge(data as any)
    await role.save()

    return role
  }

  /**
   * Deletes a role by its primary key.
   *
   * @param id - The primary key of the role to delete.
   * @returns `true` if the record was deleted, `false` if it was not found.
   *
   * @example
   * const deleted = await roleRepository.delete(1)
   */
  async delete(id: number): Promise<boolean> {
    const role = await this.findById(id)

    if (!role) {
      return false
    }

    await role.delete()
    return true
  }

  /**
   * Counts roles matching the given criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   * Omitting `criteria` returns the total count of all roles.
   *
   * @param criteria - Optional map of column/value pairs to filter by.
   * @returns The number of matching records.
   *
   * @example
   * const total = await roleRepository.count()
   * const systemRoles = await roleRepository.count({ isSystem: true })
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    let query = Role.query()

    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.where(key, value)
      })
    }

    const result = await query.count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Checks whether at least one role matches the given criteria.
   *
   * @param criteria - Map of column/value pairs to filter by.
   * @returns `true` if at least one matching record exists, `false` otherwise.
   *
   * @example
   * const taken = await roleRepository.exists({ slug: 'editor' })
   */
  async exists(criteria: Record<string, any>): Promise<boolean> {
    const count = await this.count(criteria)
    return count > 0
  }

  /**
   * Returns the default user role (slug: `'user'`).
   *
   * Used when assigning a role to newly registered users.
   *
   * @returns The user {@link Role}, or `null` if it has not been seeded.
   *
   * @example
   * const userRole = await roleRepository.getUserRole()
   */
  async getUserRole(): Promise<Role | null> {
    return await this.findBySlug('user')
  }

  /**
   * Returns the administrator role (slug: `'admin'`).
   *
   * @returns The admin {@link Role}, or `null` if it has not been seeded.
   *
   * @example
   * const adminRole = await roleRepository.getAdminRole()
   */
  async getAdminRole(): Promise<Role | null> {
    return await this.findBySlug('admin')
  }

  /**
   * Checks whether a role with the given slug already exists.
   *
   * Useful for uniqueness validation before creating or renaming a role.
   *
   * @param slug - The slug to check.
   * @returns `true` if a role with that slug exists, `false` otherwise.
   *
   * @example
   * if (await roleRepository.slugExists('editor')) {
   *   throw new Exception('Slug already taken')
   * }
   */
  async slugExists(slug: string): Promise<boolean> {
    return await this.exists({ slug })
  }

  /**
   * Finds a role by its primary key, throwing if not found.
   *
   * @param id - The role's primary key.
   * @returns The matching {@link Role}.
   * @throws {Exception} With code `E_ROW_NOT_FOUND` if no record exists for `id`.
   *
   * @example
   * const role = await roleRepository.findByIdOrFail(1)
   */
  async findByIdOrFail(id: number): Promise<Role> {
    return await Role.findOrFail(id)
  }
}
