import { type SharedProps } from '@adonisjs/inertia/types';
import { type Data } from '@generated/data';
import { usePage } from '@inertiajs/react';
import * as authHelpers from '~/helpers/authorization';
import type { PermissionSlug, SystemRoleSlug } from '#start/permissions';

type SharedPropsWithAuth = Omit<SharedProps, 'currentUser'> & {
	currentUser: Data.Identity.User | undefined;
};

/**
 * Hook providing authentication state and authorization helpers
 * derived from Inertia shared props.
 *
 * The check helpers accept system permission/role slugs only (typed against
 * the system catalog); runtime custom slugs use the raw `hasRaw*` escapes.
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
	const { currentUser } = usePage<SharedPropsWithAuth>().props;

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
		 * Checks if the current user has a specific system role.
		 *
		 * @param roleSlug - The system role slug to check
		 * @returns `true` if the user's role matches the given slug
		 *
		 * @example
		 * hasRole('admin') // true
		 */
		hasRole: (roleSlug: SystemRoleSlug) => authHelpers.hasRole(currentUser, roleSlug),

		/**
		 * Checks if the current user has a specific role by a raw string slug.
		 *
		 * Escape for runtime custom roles outside the system catalog. The
		 * shipped UI is gated by system roles only — custom slugs must go
		 * through this raw check.
		 *
		 * @param roleSlug - A raw role slug outside the system catalog
		 * @returns `true` if the user's role matches the given slug
		 *
		 * @example
		 * hasRawRole('billing_manager') // true
		 */
		hasRawRole: (roleSlug: string) => authHelpers.hasRawRole(currentUser, roleSlug),

		/**
		 * Checks if the current user has at least one of the specified system roles.
		 *
		 * @param roleSlugs - Array of system role slugs to check against
		 * @returns `true` if the user's role is included in the given slugs
		 *
		 * @example
		 * hasAnyRole(['admin', 'user']) // true
		 */
		hasAnyRole: (roleSlugs: SystemRoleSlug[]) => authHelpers.hasAnyRole(currentUser, roleSlugs),

		/**
		 * Checks if the current user has all of the specified system roles.
		 * Since a user can only have one role, all slugs in the array must match that role.
		 *
		 * @param roleSlugs - Array of system role slugs that must all match the user's role
		 * @returns `true` if every slug in the array matches the user's role
		 *
		 * @example
		 * hasAllRoles(['admin']) // true
		 */
		hasAllRoles: (roleSlugs: SystemRoleSlug[]) => authHelpers.hasAllRoles(currentUser, roleSlugs),

		/**
		 * Checks if the current user has a specific system permission.
		 *
		 * @param permissionSlug - The system permission slug to check
		 * @returns `true` if the user holds the given permission
		 *
		 * @example
		 * can('users.create') // true
		 */
		can: (permissionSlug: PermissionSlug) => authHelpers.can(currentUser, permissionSlug),

		/**
		 * Checks if the current user has a specific permission by a raw string slug.
		 *
		 * Escape for runtime custom permissions outside the system catalog. The
		 * shipped UI is gated by system permissions only — custom slugs must go
		 * through this raw check.
		 *
		 * @param permissionSlug - A raw permission slug outside the system catalog
		 * @returns `true` if the user holds the given permission
		 *
		 * @example
		 * hasRawPermission('billing.export') // true
		 */
		hasRawPermission: (permissionSlug: string) => authHelpers.hasRawPermission(currentUser, permissionSlug),

		/**
		 * Checks if the current user has at least one of the specified system permissions.
		 *
		 * @param permissionSlugs - Array of system permission slugs to check against
		 * @returns `true` if the user holds at least one of the given permissions
		 *
		 * @example
		 * canAny(['users.create', 'users.delete']) // true
		 */
		canAny: (permissionSlugs: PermissionSlug[]) => authHelpers.canAny(currentUser, permissionSlugs),

		/**
		 * Checks if the current user has all of the specified system permissions.
		 *
		 * @param permissionSlugs - Array of system permission slugs the user must all hold
		 * @returns `true` if the user holds every given permission
		 *
		 * @example
		 * canAll(['users.view', 'users.create']) // true
		 */
		canAll: (permissionSlugs: PermissionSlug[]) => authHelpers.canAll(currentUser, permissionSlugs),

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
	};
}
