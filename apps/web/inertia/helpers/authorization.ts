import { type Data } from '@generated/data';
import type { PermissionSlug, SystemRoleSlug } from '#start/permissions';

/**
 * Checks if the user has a specific system role.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param roleSlug - The system role slug to check
 * @returns `true` if the user's role matches the given slug, `false` otherwise
 *
 * @example
 * hasRole(user, 'admin') // true
 */
export function hasRole(user: Data.Identity.User | undefined, roleSlug: SystemRoleSlug): boolean {
	return user?.role?.slug === roleSlug;
}

/**
 * Checks if the user has a specific role by a raw string slug.
 *
 * Escape for **runtime custom roles** created by an admin at runtime, which
 * are not part of the system role catalog. The shipped UI is gated by system
 * roles only: {@link hasRole} accepts catalog slugs exclusively, so the
 * compiler rejects a renamed or misspelled slug at the call site — custom
 * slugs must go through this raw check instead.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param roleSlug - A raw role slug outside the system catalog
 * @returns `true` if the user's role matches the given slug, `false` otherwise
 *
 * @example
 * hasRawRole(user, 'billing_manager') // true
 */
export function hasRawRole(user: Data.Identity.User | undefined, roleSlug: string): boolean {
	return user?.role?.slug === roleSlug;
}

/**
 * Checks if the user has at least one of the specified system roles.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param roleSlugs - Array of system role slugs to check against
 * @returns `true` if the user's role is included in the given slugs, `false` otherwise
 *
 * @example
 * hasAnyRole(user, ['admin', 'user']) // true
 */
export function hasAnyRole(user: Data.Identity.User | undefined, roleSlugs: SystemRoleSlug[]): boolean {
	return !!user?.role && roleSlugs.some((slug) => slug === user.role?.slug);
}

/**
 * Checks if the user has all of the specified system roles.
 * Since a user can only have one role, this effectively checks
 * whether that single role is present in every entry of the provided list.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param roleSlugs - Array of system role slugs that must all match the user's role
 * @returns `true` if every slug in the array matches the user's role, `false` otherwise
 *
 * @example
 * hasAllRoles(user, ['admin', 'admin']) // true (same slug repeated)
 * hasAllRoles(user, ['admin', 'user']) // false (user can only have one role)
 */
export function hasAllRoles(user: Data.Identity.User | undefined, roleSlugs: SystemRoleSlug[]): boolean {
	return !!user?.role && roleSlugs.every((slug) => slug === user.role?.slug);
}

/**
 * Checks if the user has a specific system permission.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param permissionSlug - The system permission slug to check
 * @returns `true` if the user holds the given permission, `false` otherwise
 *
 * @example
 * can(user, 'users.create') // true
 */
export function can(user: Data.Identity.User | undefined, permissionSlug: PermissionSlug): boolean {
	return user?.permissions.includes(permissionSlug) ?? false;
}

/**
 * Checks if the user has a specific permission by a raw string slug.
 *
 * Escape for **runtime custom permissions** created by an admin at runtime,
 * which are not part of the system permission catalog. The shipped UI is
 * gated by system permissions only: {@link can} accepts catalog slugs
 * exclusively, so the compiler rejects a renamed or misspelled slug at the
 * call site — custom slugs must go through this raw check instead.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param permissionSlug - A raw permission slug outside the system catalog
 * @returns `true` if the user holds the given permission, `false` otherwise
 *
 * @example
 * hasRawPermission(user, 'billing.export') // true
 */
export function hasRawPermission(user: Data.Identity.User | undefined, permissionSlug: string): boolean {
	return user?.permissions.includes(permissionSlug) ?? false;
}

/**
 * Checks if the user has at least one of the specified system permissions.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param permissionSlugs - Array of system permission slugs to check against
 * @returns `true` if the user holds at least one of the given permissions, `false` otherwise
 *
 * @example
 * canAny(user, ['users.create', 'users.delete']) // true
 */
export function canAny(user: Data.Identity.User | undefined, permissionSlugs: PermissionSlug[]): boolean {
	return permissionSlugs.some((slug) => user?.permissions.includes(slug) ?? false);
}

/**
 * Checks if the user has all of the specified system permissions.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @param permissionSlugs - Array of system permission slugs that the user must all hold
 * @returns `true` if the user holds every given permission, `false` otherwise
 *
 * @example
 * canAll(user, ['users.view', 'users.create']) // true
 */
export function canAll(user: Data.Identity.User | undefined, permissionSlugs: PermissionSlug[]): boolean {
	return permissionSlugs.every((slug) => user?.permissions.includes(slug) ?? false);
}

/**
 * Returns all permission slugs held by the user.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @returns Array of permission slugs, or an empty array if the user is undefined or has no permissions
 *
 * @example
 * getPermissions(user) // ['users.view', 'users.create', 'roles.view']
 */
export function getPermissions(user: Data.Identity.User | undefined): string[] {
	return user?.permissions ?? [];
}

/**
 * Returns the role slug of the user.
 *
 * @param user - The authenticated user object, or undefined if unauthenticated
 * @returns The user's role slug, or `undefined` if the user is undefined or has no role
 *
 * @example
 * getRole(user) // 'admin'
 */
export function getRole(user: Data.Identity.User | undefined): string | undefined {
	return user?.role?.slug ?? undefined;
}
