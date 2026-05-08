import Permission from '#models/auth/permission'
import { type FindOptions } from '#types/core'

/**
 * Handles all database operations for the {@link Permission} model.
 *
 * Every method is a thin, focused wrapper around Lucid ORM queries so that
 * callers never interact with the ORM directly, making the data layer easy
 * to test and swap.
 */
export class PermissionRepository {
  /**
   * Finds a permission by its primary key.
   *
   * @param id - The permission's primary key.
   * @returns The matching {@link Permission}, or `null` if not found.
   *
   * @example
   * const permission = await permissionRepository.findById(1)
   */
  async findById(id: number): Promise<Permission | null> {
    return await Permission.find(id)
  }

  /**
   * Returns all permissions, with optional sorting and pagination.
   *
   * @param options - Optional {@link FindOptions} to control ordering and pagination.
   * @returns An array of {@link Permission} records.
   *
   * @example
   * const permissions = await permissionRepository.findAll({ orderBy: 'slug', limit: 20 })
   */
  async findAll(options?: FindOptions): Promise<Permission[]> {
    let query = Permission.query()

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
   * Finds a permission by its unique slug.
   *
   * @param slug - The permission slug to look up.
   * @returns The matching {@link Permission}, or `null` if not found.
   *
   * @example
   * const permission = await permissionRepository.findBySlug('users.create')
   */
  async findBySlug(slug: string): Promise<Permission | null> {
    return await Permission.findBy('slug', slug)
  }

  /**
   * Returns all permissions belonging to a given category.
   *
   * @param category - The category name to filter by.
   * @returns An array of {@link Permission} records in that category.
   *
   * @example
   * const permissions = await permissionRepository.findByCategory('users')
   */
  async findByCategory(category: string): Promise<Permission[]> {
    return await Permission.query().where('category', category)
  }

  /**
   * Finds a permission by its primary key, throwing if not found.
   *
   * @param id - The permission's primary key.
   * @returns The matching {@link Permission}.
   * @throws {Exception} With code `E_ROW_NOT_FOUND` if no record exists for `id`.
   *
   * @example
   * const permission = await permissionRepository.findByIdOrFail(1)
   */
  async findByIdOrFail(id: number): Promise<Permission> {
    return await Permission.findOrFail(id)
  }

  /**
   * Creates and persists a new permission.
   *
   * @param data - Partial {@link Permission} fields to populate the new record.
   * @returns The newly created {@link Permission}.
   *
   * @example
   * const permission = await permissionRepository.create({ slug: 'users.delete', category: 'users' })
   */
  async create(data: Partial<Permission>): Promise<Permission> {
    return await Permission.create(data as any)
  }

  /**
   * Updates a permission by its primary key.
   *
   * @param id - The primary key of the permission to update.
   * @param data - Partial {@link Permission} fields to merge into the record.
   * @returns The updated {@link Permission}, or `null` if no record was found.
   *
   * @example
   * const updated = await permissionRepository.update(1, { category: 'admin' })
   */
  async update(id: number, data: Partial<Permission>): Promise<Permission | null> {
    const permission = await this.findById(id)

    if (!permission) {
      return null
    }

    permission.merge(data as any)
    await permission.save()

    return permission
  }

  /**
   * Deletes a permission by its primary key.
   *
   * @param id - The primary key of the permission to delete.
   * @returns `true` if the record was deleted, `false` if it was not found.
   *
   * @example
   * const deleted = await permissionRepository.delete(1)
   */
  async delete(id: number): Promise<boolean> {
    const permission = await this.findById(id)

    if (!permission) {
      return false
    }

    await permission.delete()
    return true
  }

  /**
   * Counts permissions matching the given criteria.
   *
   * Each key/value pair in `criteria` is applied as a `WHERE` clause.
   * Omitting `criteria` returns the total count of all permissions.
   *
   * @param criteria - Optional map of column/value pairs to filter by.
   * @returns The number of matching records.
   *
   * @example
   * const total = await permissionRepository.count()
   * const userPerms = await permissionRepository.count({ category: 'users' })
   */
  async count(criteria?: Record<string, any>): Promise<number> {
    let query = Permission.query()

    if (criteria) {
      Object.entries(criteria).forEach(([key, value]) => {
        query = query.where(key, value)
      })
    }

    const result = await query.count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Checks whether a permission with the given slug already exists.
   *
   * Useful for uniqueness validation before creating or renaming a permission.
   *
   * @param slug - The slug to check.
   * @returns `true` if a permission with that slug exists, `false` otherwise.
   *
   * @example
   * if (await permissionRepository.slugExists('users.create')) {
   *   throw new Exception('Slug already taken')
   * }
   */
  async slugExists(slug: string): Promise<boolean> {
    const count = await this.count({ slug })
    return count > 0
  }

  /**
   * Returns the sorted list of all distinct permission categories.
   *
   * Useful for populating category filters or grouping permissions in a UI.
   *
   * @returns An alphabetically sorted array of category name strings.
   *
   * @example
   * const categories = await permissionRepository.getCategories()
   * // ['admin', 'billing', 'users']
   */
  async getCategories(): Promise<string[]> {
    const rows = await Permission.query().distinct('category').orderBy('category', 'asc')
    return rows.map((r) => r.category)
  }
}
