import * as authHelpers from '~/helpers/authorization'
import { type Data } from '@generated/data'
import { usePage } from '@inertiajs/react'
import { type SharedProps } from '@adonisjs/inertia/types'

type SharedPropsWithAuth = Omit<SharedProps, 'currentUser'> & {
  currentUser: Data.User | undefined
}

/**
 * Hook providing authentication state and authorization helpers
 * derived from Inertia shared props.
 *
 * @returns An object containing the current user, authentication state,
 * role checks, permission checks, and getter utilities.
 *
 * @example
 * const { user, isAuthenticated, can, hasRole } = useAuth()
 *
 * if (can('users.create')) {
 *   // render create button
 * }
 */
export function useAuth() {
  const { currentUser } = usePage<SharedPropsWithAuth>().props

  return {
    /**
     * The currently authenticated user, or `null` if unauthenticated.
     */
    user: currentUser,

    /**
     * Whether a user is currently authenticated.
     */
    isAuthenticated: !!currentUser,

    /**
     * Checks if the current user has a specific role.
     *
     * @param roleSlug - The role slug to check (e.g. `'admin'`)
     * @returns `true` if the user's role matches the given slug
     *
     * @example
     * hasRole('admin') // true
     */
    hasRole: (roleSlug: string) => authHelpers.hasRole(currentUser, roleSlug),

    /**
     * Checks if the current user has at least one of the specified roles.
     *
     * @param roleSlugs - Array of role slugs to check against
     * @returns `true` if the user's role is included in the given slugs
     *
     * @example
     * hasAnyRole(['admin', 'moderator']) // true
     */
    hasAnyRole: (roleSlugs: string[]) => authHelpers.hasAnyRole(currentUser, roleSlugs),

    /**
     * Checks if the current user has all of the specified roles.
     * Since a user can only have one role, all slugs in the array must match that role.
     *
     * @param roleSlugs - Array of role slugs that must all match the user's role
     * @returns `true` if every slug in the array matches the user's role
     *
     * @example
     * hasAllRoles(['admin']) // true
     */
    hasAllRoles: (roleSlugs: string[]) => authHelpers.hasAllRoles(currentUser, roleSlugs),

    /**
     * Checks if the current user has a specific permission.
     *
     * @param permissionSlug - The permission slug to check (e.g. `'users.create'`)
     * @returns `true` if the user holds the given permission
     *
     * @example
     * can('users.create') // true
     */
    can: (permissionSlug: string) => authHelpers.can(currentUser, permissionSlug),

    /**
     * Checks if the current user has at least one of the specified permissions.
     *
     * @param permissionSlugs - Array of permission slugs to check against
     * @returns `true` if the user holds at least one of the given permissions
     *
     * @example
     * canAny(['users.create', 'users.delete']) // true
     */
    canAny: (permissionSlugs: string[]) => authHelpers.canAny(currentUser, permissionSlugs),

    /**
     * Checks if the current user has all of the specified permissions.
     *
     * @param permissionSlugs - Array of permission slugs the user must all hold
     * @returns `true` if the user holds every given permission
     *
     * @example
     * canAll(['users.view', 'users.create']) // true
     */
    canAll: (permissionSlugs: string[]) => authHelpers.canAll(currentUser, permissionSlugs),

    /**
     * Returns all permission slugs held by the current user.
     *
     * @returns Array of permission slugs, or an empty array if unauthenticated
     *
     * @example
     * getPermissions() // ['users.view', 'users.create', 'roles.view']
     */
    getPermissions: () => authHelpers.getPermissions(currentUser),

    /**
     * Returns the role slug of the current user.
     *
     * @returns The user's role slug, or `null` if unauthenticated
     *
     * @example
     * getRole() // 'admin'
     */
    getRole: () => authHelpers.getRole(currentUser),
  }
}
