import vine from '@vinejs/vine'
import type Role from '#models/auth/role'

const id = () => vine.number().exists({ table: 'roles', column: 'id' })
const name = () => vine.string().trim().minLength(2).maxLength(100)
const description = () => vine.string().trim().maxLength(255).optional()
const permissionIds = () =>
  vine.array(vine.number().exists({ table: 'permissions', column: 'id' })).optional()

/**
 * Validates list query params for the roles admin listing.
 */
export const listRolesValidator = vine.create({
  search: vine.string().trim().maxLength(100).optional(),
})

/**
 * Validates route params for the role show page.
 */
export const showRoleValidator = vine.create({
  id: id(),
})

/**
 * Validates route params for the role edit form.
 */
export const editRoleValidator = vine.create({
  id: id(),
})

/**
 * Validates route params for role deletion.
 */
export const deleteRoleValidator = vine.create({
  id: id(),
})

/**
 * Validates payload for creating a custom role.
 *
 * The slug must be unique across all roles and match the lowercase
 * machine-readable format used by seeded roles.
 */
export const createRoleValidator = vine.create({
  name: name(),
  slug: vine
    .string()
    .trim()
    .minLength(2)
    .maxLength(50)
    .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
    .unique(async (query, value) => {
      const role = await query.from('roles').where('slug', value).first()

      return !role
    }),
  description: description(),
  permission_ids: permissionIds(),
})

/**
 * Validates payload for updating a custom role.
 *
 * The unique slug rule ignores the role being updated.
 *
 * @param roleId - The id of the role being updated.
 */
export const updateRoleValidator = (roleId: Role['id']) =>
  vine.create({
    name: name(),
    slug: vine
      .string()
      .trim()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)
      .unique(async (query, value) => {
        const role = await query.from('roles').where('slug', value).whereNot('id', roleId).first()

        return !role
      }),
    description: description(),
    permission_ids: permissionIds(),
  })

export { restIdValidator as restRoleIdValidator } from '#validators/rest'
