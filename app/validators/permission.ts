import vine from '@vinejs/vine'
import type Permission from '#models/auth/permission'

const id = () => vine.number().exists({ table: 'permissions', column: 'id' })
const name = () => vine.string().trim().minLength(2).maxLength(100)
const description = () => vine.string().trim().maxLength(255).optional()

/**
 * Validates route params for the permission edit form.
 */
export const editPermissionValidator = vine.create({
  id: id(),
})

/**
 * Validates route params for permission deletion.
 */
export const deletePermissionValidator = vine.create({
  id: id(),
})

/**
 * Validates payload for creating a custom permission.
 *
 * The slug must be unique across all permissions and match the
 * `category.action` format used by seeded permissions.
 */
export const createPermissionValidator = vine.create({
  name: name(),
  slug: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(100)
    .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
    .unique(async (query, value) => {
      const permission = await query.from('permissions').where('slug', value).first()

      return !permission
    }),
  category: vine.string().trim().minLength(2).maxLength(50),
  description: description(),
})

/**
 * Validates payload for updating a custom permission.
 *
 * The unique slug rule ignores the permission being updated.
 *
 * @param permissionId - The id of the permission being updated.
 */
export const updatePermissionValidator = (permissionId: Permission['id']) =>
  vine.create({
    name: name(),
    slug: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(100)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
      .unique(async (query, value) => {
        const permission = await query
          .from('permissions')
          .where('slug', value)
          .whereNot('id', permissionId)
          .first()

        return !permission
      }),
    category: vine.string().trim().minLength(2).maxLength(50),
    description: description(),
  })
