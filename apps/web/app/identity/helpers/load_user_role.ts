import type Role from '#identity/models/role';
import type User from '#identity/models/user';

/**
 * Preload a user's role (with its permissions) so the {@link UserTransformer}
 * contract is satisfied before serialization. `user.load` can safely be
 * called on both freshly-created and refreshed instances.
 */
export async function preloadUserRoleWithPermissions(user: User): Promise<void> {
	await user.load((loader) => {
		loader.load('role', (role) => {
			role.preload('permissions');
		});
	});
}

/**
 * Map roles to a list of string ids accepted by the user validators'
 * `role_id` `in(...)` rule.
 */
export function roleIdsToAllowlist(roles: Role[]): string[] {
	return roles.map((role) => String(role.id));
}
