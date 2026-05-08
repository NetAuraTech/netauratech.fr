import { ReactNode } from 'react'
import { useAuth } from '~/hooks/use_auth'

interface HasRoleProps {
  role: string | string[]
  requireAll?: boolean
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Conditionally renders children based on the current user's role.
 *
 * Accepts either a single role slug or an array of slugs.
 * When an array is provided, the `requireAll` flag controls whether
 * the user must match all of them (`true`) or at least one (`false`, default).
 * Since a user can only hold one role, `requireAll` with distinct slugs will always return `false`.
 *
 * @param role - A single role slug or an array of slugs to check
 * @param requireAll - If `true`, every slug in the list must match the user's role. Defaults to `false`
 * @param fallback - Content to render when the role check fails. Defaults to `null`
 * @param children - Content to render when the role check passes
 *
 * @example
 * // Single role
 * <HasRole role="admin">
 *   <AdminPanel />
 * </HasRole>
 *
 * @example
 * // Any of the roles, with fallback
 * <HasRole role={['admin', 'moderator']} fallback={<Unauthorized />}>
 *   <ModeratorTools />
 * </HasRole>
 */
export function HasRole({ role, requireAll = false, fallback = null, children }: HasRoleProps) {
  const { hasRole, hasAnyRole, hasAllRoles } = useAuth()

  const hasAccess = Array.isArray(role)
    ? requireAll
      ? hasAllRoles(role)
      : hasAnyRole(role)
    : hasRole(role)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}
