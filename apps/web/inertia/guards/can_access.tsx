import { ReactNode } from 'react';
import { useAuth } from '~/hooks/use_auth';
import type { PermissionSlug } from '#start/permissions';

interface CanAccessProps {
	permission: PermissionSlug | PermissionSlug[];
	requireAll?: boolean;
	fallback?: ReactNode;
	children: ReactNode;
}

/**
 * Conditionally renders children based on the current user's permissions.
 *
 * Accepts either a single system permission slug or an array of slugs.
 * When an array is provided, the `requireAll` flag controls whether
 * the user must hold all of them (`true`) or at least one (`false`, default).
 *
 * @param permission - A single system permission slug or an array of slugs to check
 * @param requireAll - If `true`, the user must hold all provided permissions. Defaults to `false`
 * @param fallback - Content to render when access is denied. Defaults to `null`
 * @param children - Content to render when access is granted
 *
 * @example
 * // Single permission
 * <CanAccess permission="users.create">
 *   <CreateUserButton />
 * </CanAccess>
 *
 * @example
 * // Any of the permissions
 * <CanAccess permission={['users.create', 'users.update']}>
 *   <EditUserButton />
 * </CanAccess>
 *
 * @example
 * // All permissions required, with fallback
 * <CanAccess permission={['users.create', 'users.delete']} requireAll fallback={<AccessDenied />}>
 *   <DangerZone />
 * </CanAccess>
 */
export function CanAccess({ permission, requireAll = false, fallback = null, children }: CanAccessProps) {
	const { can, canAny, canAll } = useAuth();

	const hasAccess = Array.isArray(permission)
		? requireAll
			? canAll(permission)
			: canAny(permission)
		: can(permission);

	return hasAccess ? <>{children}</> : <>{fallback}</>;
}
